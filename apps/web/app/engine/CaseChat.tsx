"use client";

import { useRef, useState } from "react";
import type { CaseDoc, Edit } from "@/lib/case/types";
import type { ChatTurn } from "@/lib/case/agent";

export function CaseChat({ doc, onEdits }: { doc: CaseDoc; onEdits: (edits: Edit[]) => void }) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const docRef = useRef(doc);
  docRef.current = doc;

  async function send() {
    const message = input.trim();
    if (!message || busy) return;
    setInput("");
    const history = turns.slice(-12);
    setTurns((t) => [...t, { role: "user", text: message }]);
    setBusy(true);
    try {
      const res = await fetch("/api/case-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case: docRef.current, message, history }),
      });
      const data = (await res.json()) as { reply?: string; edits?: Edit[]; error?: string };
      if (!res.ok || data.error) { setTurns((t) => [...t, { role: "model", text: `Fel: ${data.error ?? res.status}` }]); return; }
      if (data.edits?.length) onEdits(data.edits);
      setTurns((t) => [...t, { role: "model", text: data.reply ?? "Klart." }]);
    } catch (e) {
      setTurns((t) => [...t, { role: "model", text: `Fel: ${e instanceof Error ? e.message : String(e)}` }]);
    } finally { setBusy(false); }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-1">
        {turns.length === 0 && <p className="text-sm text-stone-400">Skriv en instruktion, t.ex. &quot;byggår 1971, tillbyggt 2013&quot; eller &quot;lägg till risken för fritidshus&quot;.</p>}
        {turns.map((t, i) => (
          <div key={i} className={t.role === "user" ? "text-stone-900" : "text-emerald-800"}>
            <span className="text-xs uppercase tracking-wide text-stone-400">{t.role === "user" ? "Du" : "AI"}</span>
            <p className="whitespace-pre-wrap text-sm">{t.text}</p>
          </div>
        ))}
        {busy && <p className="text-sm italic text-stone-400">tänker… (fri kvot)</p>}
      </div>
      <div className="mt-2 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
          rows={2}
          placeholder="Skriv…"
          className="flex-1 resize-none rounded border border-stone-300 px-3 py-2 text-sm"
        />
        <button type="button" onClick={() => void send()} disabled={busy} className="self-end rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">Skicka</button>
      </div>
    </div>
  );
}
