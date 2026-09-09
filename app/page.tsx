"use client";

import { useMemo, useState } from "react";
import type { CloseResult } from "@/lib/close";
import { scrapeTotals } from "@/lib/parse";

export default function Page() {
  const [store, setStore] = useState("This house");
  const [businessDate, setBusinessDate] = useState("");
  const [netSales, setNetSales] = useState("");
  const [laborDollars, setLaborDollars] = useState("");
  const [target, setTarget] = useState("30");
  const [managerName, setManagerName] = useState("Kenzy");
  const [paste, setPaste] = useState("");
  const [result, setResult] = useState<CloseResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const preview = useMemo(() => scrapeTotals(paste), [paste]);

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
    const body = `Hey ${managerName} —\n${result.sendText}`;
    await navigator.clipboard.writeText(body);
    setCopied(true);
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <p style={{ letterSpacing: ".16em", fontSize: 11, textTransform: "uppercase" }}>Action Shift</p>
      <h1 style={{ fontSize: 42, fontStyle: "italic", fontWeight: 500, margin: "0 0 .4rem" }}>
        Last night.
      </h1>
      <p style={{ color: "var(--mute)", maxWidth: 520 }}>
        Drop two numbers. I will not ask for a schedule photo. I will not invent food cost.
      </p>

      <section style={{ marginTop: 28, display: "grid", gap: 12 }}>
        <label>
          House
          <input value={store} onChange={(e) => setStore(e.target.value)} style={field} />
        </label>
        <label>
          Business date
          <input value={businessDate} onChange={(e) => setBusinessDate(e.target.value)} placeholder="2026-08-31" style={field} />
        </label>
        <label>
          Net sales
          <input value={netSales} onChange={(e) => setNetSales(e.target.value)} placeholder="3408.15" style={field} />
        </label>
        <label>
          Labor dollars
          <input value={laborDollars} onChange={(e) => setLaborDollars(e.target.value)} placeholder="1211.85" style={field} />
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
            placeholder="Net $3,408.15  Labor $1,211.85"
            style={{ ...field, minHeight: 90 }}
          />
        </label>
        {preview.netSales ? (
          <p style={{ fontSize: 13, color: "var(--mute)" }}>
            Read from paste: net {preview.netSales} · labor {preview.laborDollars ?? "—"}
          </p>
        ) : null}
        <button onClick={() => void runClose()} style={btn}>
          Close last night
        </button>
        {error ? <p style={{ color: "var(--move)" }}>{error}</p> : null}
      </section>

      {result ? (
        <section style={{ marginTop: 36, borderTop: "1px solid var(--rule)", paddingTop: 24 }}>
          <p style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" }}>{result.verdict}</p>
          <p style={{ fontSize: 32, margin: "8px 0" }}>{result.laborPct.toFixed(2)}%</p>
          <p>{result.formula}</p>
          <p style={{ marginTop: 16 }}>{result.move}</p>
          <p style={{ color: "var(--hold)" }}>{result.hold}</p>
          <pre style={{ whiteSpace: "pre-wrap", background: "#fff", padding: 16, marginTop: 20, border: "1px solid var(--rule)" }}>
            {`Hey ${managerName} —\n${result.sendText}`}
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
