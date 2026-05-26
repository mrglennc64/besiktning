"use client";

import { useCallback, useMemo, useRef, useState } from "react";

// Gemini free tier is 5 requests/minute for gemini-2.5-flash. We cap concurrent
// in-flight requests, and on 429 we read Google's suggested retry delay from
// the error body and back off automatically.
const MAX_CONCURRENT = 2;
const DEFAULT_RETRY_DELAY_MS = 40_000;
const MAX_RETRIES = 4;

interface PhotoMatch {
  notering_id: string;
  category: string;
  title: string;
  body: string;
  ai_match_confidence: number;
  reasoning: string;
}

type PhotoStatus =
  | { kind: "queued" }
  | { kind: "analyzing" }
  | { kind: "ratelimited"; retryAtMs: number }
  | { kind: "ready"; matches: PhotoMatch[] }
  | { kind: "error"; message: string };

function parseRetryDelayMs(body: string): number {
  // Google returns: "Please retry in 37.598735359s" or a retryDelay field "37s"
  const m = body.match(/retry in ([\d.]+)\s*s/i) ?? body.match(/retryDelay[^\d]*([\d.]+)\s*s/i);
  if (m) {
    const seconds = parseFloat(m[1]);
    if (!isNaN(seconds)) return Math.ceil(seconds * 1000) + 500;
  }
  return DEFAULT_RETRY_DELAY_MS;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Module-level FIFO queue with bounded concurrency.
const _queue: Array<() => Promise<void>> = [];
let _active = 0;

function enqueue(task: () => Promise<void>) {
  _queue.push(task);
  pump();
}

function pump() {
  while (_active < MAX_CONCURRENT && _queue.length > 0) {
    const task = _queue.shift();
    if (!task) break;
    _active++;
    task().finally(() => {
      _active--;
      pump();
    });
  }
}

interface PhotoEntry {
  id: string;
  file: File;
  previewUrl: string;
  status: PhotoStatus;
  // Per-match decision state — index → "accepted" | "rejected" | undefined (undecided)
  decisions: Record<number, "accepted" | "rejected">;
}

let _uid = 0;
const nextId = () => `p${++_uid}-${Date.now()}`;

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function PhotoLoop() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    const entries: PhotoEntry[] = files.map((f) => ({
      id: nextId(),
      file: f,
      previewUrl: URL.createObjectURL(f),
      status: { kind: "queued" },
      decisions: {},
    }));
    setPhotos((prev) => [...prev, ...entries]);
    for (const entry of entries) {
      analyze(entry.id, entry.file);
    }
  }, []);

  function analyze(id: string, file: File) {
    enqueue(async () => {
      await analyzeWithRetry(id, file, 0);
    });
  }

  async function analyzeWithRetry(id: string, file: File, attempt: number): Promise<void> {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: { kind: "analyzing" } } : p)),
    );
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch("/api/match-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: base64, mime_type: file.type }),
      });
      const bodyText = await res.text();
      if (!res.ok) {
        // Gemini free-tier rate limit. Auto-retry using the suggested delay.
        const is429 = res.status === 429 || /RESOURCE_EXHAUSTED|rate.*limit|quota/i.test(bodyText);
        if (is429 && attempt < MAX_RETRIES) {
          const delayMs = parseRetryDelayMs(bodyText);
          const retryAtMs = Date.now() + delayMs;
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === id ? { ...p, status: { kind: "ratelimited", retryAtMs } } : p,
            ),
          );
          await sleep(delayMs);
          return analyzeWithRetry(id, file, attempt + 1);
        }
        throw new Error(bodyText || `HTTP ${res.status}`);
      }
      const data = JSON.parse(bodyText) as { matches: PhotoMatch[] };
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: { kind: "ready", matches: data.matches } } : p,
        ),
      );
    } catch (e) {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: { kind: "error", message: e instanceof Error ? e.message : String(e) } }
            : p,
        ),
      );
    }
  }

  function reanalyze(id: string) {
    const entry = photos.find((p) => p.id === id);
    if (entry) analyze(id, entry.file);
  }

  function decide(photoId: string, matchIndex: number, decision: "accepted" | "rejected") {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId
          ? { ...p, decisions: { ...p.decisions, [matchIndex]: decision } }
          : p,
      ),
    );
  }

  function validateAll(photoId: string) {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId && p.status.kind === "ready"
          ? {
              ...p,
              decisions: Object.fromEntries(p.status.matches.map((_, i) => [i, "accepted" as const])),
            }
          : p,
      ),
    );
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  const acceptedCount = useMemo(() => {
    return photos.reduce((sum, p) => {
      if (p.status.kind !== "ready") return sum;
      return sum + Object.values(p.decisions).filter((d) => d === "accepted").length;
    }, 0);
  }, [photos]);

  function assembleReport() {
    const findings: Array<{
      photo: string;
      notering_id: string;
      category: string;
      title: string;
      body: string;
    }> = [];
    for (const p of photos) {
      if (p.status.kind !== "ready") continue;
      for (let i = 0; i < p.status.matches.length; i++) {
        if (p.decisions[i] === "accepted") {
          const m = p.status.matches[i];
          findings.push({
            photo: p.file.name,
            notering_id: m.notering_id,
            category: m.category,
            title: m.title,
            body: m.body,
          });
        }
      }
    }
    const blob = new Blob([JSON.stringify({ findings, generated_at: new Date().toISOString() }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `utlatande-utkast-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <DropZone
        dragOver={dragOver}
        onDrag={setDragOver}
        onPick={() => inputRef.current?.click()}
        onDrop={addFiles}
        photosCount={photos.length}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {photos.length > 0 && (
        <Toolbar
          photosCount={photos.length}
          acceptedCount={acceptedCount}
          onAssemble={assembleReport}
        />
      )}

      <div className="space-y-5">
        {photos.map((p) => (
          <PhotoCard
            key={p.id}
            entry={p}
            onValidateAll={() => validateAll(p.id)}
            onDecide={(i, d) => decide(p.id, i, d)}
            onReanalyze={() => reanalyze(p.id)}
            onRemove={() => removePhoto(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

function DropZone({
  dragOver,
  onDrag,
  onPick,
  onDrop,
  photosCount,
}: {
  dragOver: boolean;
  onDrag: (v: boolean) => void;
  onPick: () => void;
  onDrop: (files: FileList) => void;
  photosCount: number;
}) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onDrag(true);
      }}
      onDragLeave={() => onDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        onDrag(false);
        if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
        dragOver
          ? "border-amber-500 bg-amber-50"
          : "border-stone-300 bg-white hover:border-stone-400"
      }`}
    >
      <p className="text-base font-medium text-stone-800">
        {photosCount === 0
          ? "Släpp foton här — eller klicka för att välja från disken."
          : "Lägg till fler foton."}
      </p>
      <p className="mt-1 text-sm text-stone-500">
        JPG, PNG, HEIC. Flera filer åt gången går bra.
      </p>
      <button
        type="button"
        onClick={onPick}
        className="mt-4 rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-stone-800"
      >
        Välj filer
      </button>
    </div>
  );
}

function Toolbar({
  photosCount,
  acceptedCount,
  onAssemble,
}: {
  photosCount: number;
  acceptedCount: number;
  onAssemble: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-5 py-3">
      <div className="text-sm text-stone-600">
        <span className="font-medium text-stone-800">{photosCount}</span> foto
        {photosCount === 1 ? "" : "n"} ·{" "}
        <span className="font-medium text-stone-800">{acceptedCount}</span>{" "}
        accepterade fynd
      </div>
      <button
        type="button"
        onClick={onAssemble}
        disabled={acceptedCount === 0}
        className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Sammanställ utlåtande (JSON) →
      </button>
    </div>
  );
}

function PhotoCard({
  entry,
  onValidateAll,
  onDecide,
  onReanalyze,
  onRemove,
}: {
  entry: PhotoEntry;
  onValidateAll: () => void;
  onDecide: (matchIndex: number, decision: "accepted" | "rejected") => void;
  onReanalyze: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="grid md:grid-cols-[280px_1fr]">
        {/* Photo column */}
        <div className="relative bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={entry.previewUrl}
            alt={entry.file.name}
            className="h-full max-h-80 w-full object-cover"
          />
          <button
            type="button"
            onClick={onRemove}
            aria-label="Ta bort foto"
            className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-white"
          >
            ✕
          </button>
        </div>
        {/* Matches column */}
        <div className="p-5">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-stone-800">
                {entry.file.name}
              </p>
              <p className="mt-0.5 text-xs text-stone-500">
                <Status status={entry.status} />
              </p>
            </div>
            {entry.status.kind === "ready" && (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={onValidateAll}
                  className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800"
                >
                  Acceptera alla
                </button>
                <button
                  type="button"
                  onClick={onReanalyze}
                  className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
                >
                  Kör om
                </button>
              </div>
            )}
          </div>

          {(entry.status.kind === "analyzing" || entry.status.kind === "ratelimited") && (
            <SkeletonMatches />
          )}
          {entry.status.kind === "error" && (
            <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {entry.status.message}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={onReanalyze}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                >
                  Försök igen
                </button>
              </div>
            </div>
          )}
          {entry.status.kind === "ready" && (
            <ol className="mt-4 space-y-3">
              {entry.status.matches.map((m, i) => (
                <MatchRow
                  key={i}
                  match={m}
                  index={i}
                  decision={entry.decisions[i]}
                  onDecide={(d) => onDecide(i, d)}
                />
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function Status({ status }: { status: PhotoStatus }) {
  if (status.kind === "queued") return <>I kö…</>;
  if (status.kind === "analyzing") return <>AI analyserar fotot…</>;
  if (status.kind === "ratelimited") {
    const sec = Math.max(0, Math.ceil((status.retryAtMs - Date.now()) / 1000));
    return <>Väntar på AI-tjänsten (≈{sec}s, fri kvot)…</>;
  }
  if (status.kind === "error") return <>Fel: {status.message.slice(0, 60)}</>;
  return <>{status.matches.length} förslag från katalogen</>;
}

function SkeletonMatches() {
  return (
    <ul className="mt-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <li
          key={i}
          className="h-16 animate-pulse rounded-md border border-stone-200 bg-stone-50"
        />
      ))}
    </ul>
  );
}

function MatchRow({
  match,
  index,
  decision,
  onDecide,
}: {
  match: PhotoMatch;
  index: number;
  decision: "accepted" | "rejected" | undefined;
  onDecide: (d: "accepted" | "rejected") => void;
}) {
  const confPct = Math.round(match.ai_match_confidence * 100);
  const confColor =
    confPct >= 80 ? "bg-emerald-600" : confPct >= 50 ? "bg-amber-500" : "bg-stone-400";
  const ringColor =
    decision === "accepted"
      ? "ring-emerald-400 bg-emerald-50/60"
      : decision === "rejected"
      ? "ring-stone-300 bg-stone-50 opacity-60"
      : "ring-stone-200";

  return (
    <li className={`rounded-lg ring-1 ${ringColor} transition`}>
      <div className="flex items-start gap-3 p-3">
        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-700">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-semibold text-stone-900">
              {match.title || <span className="italic text-stone-500">[saknar rubrik]</span>}
            </p>
            <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-stone-700">
              {match.category}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-stone-700">
            {match.body || <span className="italic text-stone-400">(katalogen saknar text för detta ID)</span>}
          </p>
          <p className="mt-2 text-xs italic text-stone-500">
            AI-resonemang: {match.reasoning}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-stone-500">
                <span>Säkerhet</span>
                <span>{confPct}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className={`h-full ${confColor} transition-all`}
                  style={{ width: `${confPct}%` }}
                />
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => onDecide("accepted")}
                aria-pressed={decision === "accepted"}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  decision === "accepted"
                    ? "bg-emerald-700 text-white"
                    : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                }`}
              >
                Acceptera
              </button>
              <button
                type="button"
                onClick={() => onDecide("rejected")}
                aria-pressed={decision === "rejected"}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  decision === "rejected"
                    ? "bg-stone-700 text-white"
                    : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                }`}
              >
                Avvisa
              </button>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
