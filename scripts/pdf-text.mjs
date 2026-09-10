/** Pull text from a PDQ Z-report PDF. No tokens. Photos still do not parse. */
import { deflateSync, inflateRawSync, inflateSync } from "node:zlib";

function unescapePdf(s) {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\([()\\])/g, "$1")
    .replace(/\\(\d{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

function pdfStrings(src) {
  const out = [];
  const re = /\(((?:\\.|[^\\)])*)\)/g;
  let m;
  while ((m = re.exec(src))) out.push(unescapePdf(m[1]));
  return out;
}

function tryInflate(bytes) {
  const candidates = [bytes];
  if (bytes.length && (bytes[0] === 0x0d || bytes[0] === 0x0a)) candidates.push(bytes.subarray(1));
  if (bytes.length > 1 && bytes[bytes.length - 1] === 0x0a) {
    candidates.push(bytes.subarray(0, -1));
  }
  for (const chunk of candidates) {
    for (const fn of [inflateSync, inflateRawSync]) {
      try {
        return fn(chunk).toString("latin1");
      } catch {
        /* next */
      }
    }
  }
  return "";
}

function streamBodies(latin1) {
  const bodies = [];
  const re = /stream\r?\n([\s\S]*?)endstream/g;
  let m;
  while ((m = re.exec(latin1))) {
    const raw = Buffer.from(m[1], "latin1");
    const inflated = tryInflate(raw);
    if (inflated) bodies.push(inflated);
    bodies.push(m[1]);
  }
  return bodies;
}

export function looksLikePdf(buf) {
  const head = Buffer.isBuffer(buf) ? buf.subarray(0, 5).toString("latin1") : String(buf || "").slice(0, 5);
  return head === "%PDF-";
}

/** Turn a Z-report PDF buffer (or already-extracted text) into scrapeable text. */
export function extractPdfText(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input ?? ""), "utf8");
  if (!buf.length) return "";
  const utf8 = buf.toString("utf8");
  if (/labor summary/i.test(utf8) && /subtotal/i.test(utf8) && !looksLikePdf(buf)) return utf8;
  if (!looksLikePdf(buf)) return utf8;
  const latin1 = buf.toString("latin1");
  const blobs = [latin1, ...streamBodies(latin1)];
  const strings = blobs.flatMap(pdfStrings);
  const joined = strings.join("\n");
  if (/labor summary/i.test(joined) && /subtotal/i.test(joined)) return joined;
  const ascii = blobs.join("\n").replace(/[^\x09\x0a\x0d\x20-\x7e]/g, " ");
  if (/labor summary/i.test(ascii) && /subtotal/i.test(ascii)) return ascii;
  return "";
}

function escapePdf(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Test helper: build a tiny Z-report PDF with a text layer. */
export function buildZReportPdf(text, { compress = false } = {}) {
  const lines = String(text).split(/\r?\n/);
  const ops = lines
    .map((line, i) => `BT /F1 11 Tf 72 ${720 - i * 14} Td (${escapePdf(line)}) Tj ET`)
    .join("\n");
  const content = compress ? deflateSync(Buffer.from(ops, "latin1")) : Buffer.from(ops, "latin1");
  const filter = compress ? "/Filter /FlateDecode" : "";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} ${filter} >>\nstream\n${content.toString("latin1")}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let body = "%PDF-1.1\n";
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(body, "latin1"));
    body += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefAt = Buffer.byteLength(body, "latin1");
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
}
