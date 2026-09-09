"use client";

import { useMemo, useState } from "react";
import type { CloseResult } from "@/lib/close";
import { mergeCsvFiles } from "@/lib/csv";
import { scrapeTotals } from "@/lib/parse";

export default function Page() {
  const [store, setStore] = useState("Community Tap");
  const [businessDate, setBusinessDate] = useState("");
  const [netSales, setNetSales] = useState("");
  const [laborDollars, setLaborDollars] = useState("");
  const [target, setTarget] = useState("30");
  const [managerName, setManagerName] = useState("Kenzy");
  const [paste, setPaste] = useState("");
  const [csvNote, setCsvNote] = useState("");
  const [result, setResult] = useState<CloseResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const preview = useMemo(() => scrapeTotals(paste), [paste]);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    const files = await Promise.all(
      [...list].map(async (file) => ({ name: file.name, text: await file.text() })),
    );
    const csvs = files.filter((f) => /\.csv$/i.test(f.name) || f.name.toLowerCase().includes("csv"));
    const notes = files.filter((f) => !csvs.includes(f));
    const fromCsv = mergeCsvFiles(csvs);
    let net = fromCsv.netSales;
    let labor = fromCsv.laborDollars;
    for (const file of notes) {
      const scraped = scrapeTotals(file.text);
      if (scraped.netSales !== undefined) net = scraped.netSales;
      if (scraped.laborDollars !== undefined) labor = scraped.laborDollars;
    }
    if (net !== undefined) setNetSales(String(net));
    if (labor !== undefined) setLaborDollars(String(labor));
    const parts = [...fromCsv.source];
    if (net !== undefined || labor !== undefined) {
      parts.push(
        `Read: net ${net ?? "—"} · labor ${labor ?? "—"}. Food still MISSING.`,
      );
    } else {
      parts.push("No net or labor column found. Paste the two numbers.");
    }
    setCsvNote(parts.join(" "));
  }

  async function runClose() {
    setError("");
    setCopied(false);
    const net = Number(netSales || preview.netSales);
    const labor = Number(laborDollars || preview.laborDollars);
    const res = await fetch("/api/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store,
        businessDate: businessDate || undefined,
        netSales: net,
        laborDollars: labor,
        laborTargetPct: Number(target),
        managerName,
        hasFoodEvidence: false,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setResult(null);
      setError(json.error ?? "Cannot close.");
      return;
    }
    setResult(json);
  }

  async function copySend() {
    if (!result) return;
    const body = `Hey ${managerName} —\n${store}\n${result.sendText}`;
    await navigator.clipboard.writeText(body);
    setCopied(true);
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <p style={{ letterSpacing: ".16em", fontSize: 11, textTransform: "uppercase" }}>Action Shift · Never 86'd</p>
      <h1 style={{ fontSize: 42, fontStyle: "italic", fontWeight: 500, margin: "0 0 .4rem" }}>
        Last night.
      </h1>
      <p style={{ color: "var(--mute)", maxWidth: 520 }}>
        Community Tap. Kenzy runs it. Paste CTap net and labor. I will not ask for a schedule photo. I will not invent food cost. I will not copy another house into this seat.
      </p>

      <section style={{ marginTop: 28, display: "grid", gap: 12 }}>
        <label>
          House
          <input value={store} onChange={(e) => setStore(e.target.value)} style={field} />
        </label>
        <label>
          Business date
          <input value={businessDate} onChange={(e) => setBusinessDate(e.target.value)} placeholder="last night" style={field} />
        </label>
        <label>
          Net sales
          <input value={netSales} onChange={(e) => setNetSales(e.target.value)} placeholder="CTap net" style={field} />
        </label>
        <label>
          Labor dollars
          <input value={laborDollars} onChange={(e) => setLaborDollars(e.target.value)} placeholder="CTap labor" style={field} />
        </label>
        <label>
          House labor target %
          <input value={target} onChange={(e) => setTarget(e.target.value)} style={field} />
        </label>
        <label>
          One manager
          <input value={managerName} onChange={(e) => setManagerName(e.target.value)} style={field} />
        </label>
        <label>
          Or paste a Toast line
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={4}
            placeholder="Net $0.00  Labor $0.00"
            style={{ ...field, minHeight: 90 }}
          />
        </label>
        <label>
          Or drop Toast CSVs
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            multiple
            onChange={(e) => void onFiles(e.target.files)}
            style={{ ...field, padding: 10 }}
          />
        </label>
        <p style={{ fontSize: 12, color: "var(--mute)", margin: 0 }}>
          Labor Breakdown + Sales Summary only. No schedule photo. No food invent. No stranger-house dollars.
        </p>
        {preview.netSales ? (
          <p style={{ fontSize: 13, color: "var(--mute)" }}>
            Read from paste: net {preview.netSales} · labor {preview.laborDollars ?? "—"}
          </p>
        ) : null}
        {csvNote ? <p style={{ fontSize: 13, color: "var(--mute)" }}>{csvNote}</p> : null}
        <button onClick={() => void runClose()} style={btn}>
          Close last night
        </button>
        {error ? <p style={{ color: "var(--move)" }}>{error}</p> : null}
      </section>

      {result ? (
        <section style={{ marginTop: 36, borderTop: "1px solid var(--rule)", paddingTop: 24 }}>
          <p style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" }}>
            {result.verdict} · {result.totalsLabel} · {result.foodLabel}
          </p>
          <p style={{ fontSize: 32, margin: "8px 0" }}>{result.laborPct.toFixed(2)}%</p>
          <p>{result.formula}</p>
          <p style={{ marginTop: 8, fontSize: 20 }}>{result.heavyLine}</p>
          <p style={{ marginTop: 16 }}>{result.move}</p>
          <p style={{ color: "var(--hold)" }}>{result.hold}</p>
          <pre style={{ whiteSpace: "pre-wrap", background: "#fff", padding: 16, marginTop: 20, border: "1px solid var(--rule)" }}>
            {`Hey ${managerName} —\n${store}\n${result.sendText}`}
          </pre>
          <button onClick={() => void copySend()} style={btn}>
            {copied ? "Copied" : `Send this to ${managerName}`}
          </button>
        </section>
      ) : null}
    </main>
  );
}

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: "10px 12px",
  border: "1px solid var(--rule)",
  background: "#fff",
};
const btn: React.CSSProperties = {
  marginTop: 8,
  padding: "12px 16px",
  background: "var(--ink)",
  color: "var(--paper)",
  border: 0,
  cursor: "pointer",
};
