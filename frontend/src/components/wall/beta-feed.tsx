"use client";

import { Crosshair, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api, type BetaNote, type Hold, type RouteDetail } from "@/lib/api";
import { KIND_LABEL } from "@/lib/holds";
import { Button } from "../ui/button";
import { TextAreaField, TextField } from "../ui/field";
import { ScrollArea } from "../ui/scroll-area";
import { Switch } from "../ui/switch";

const AUTHOR_KEY = "climber:author";

function timeAgo(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function NoteItem({ note, hold, onSelectHold }: { note: BetaNote; hold?: Hold; onSelectHold?: (id: number) => void }) {
  return (
    <article className="border border-line/60 bg-ink/60 p-2.5">
      <header className="mb-1 flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase">
        <span className="text-signal">@{note.author}</span>
        <span className="text-faint">{timeAgo(note.created_at)}</span>
        {hold && onSelectHold && (
          <button
            type="button"
            onClick={() => onSelectHold(hold.id)}
            className="ml-auto flex cursor-pointer items-center gap-1 border border-signal/50 px-1 text-signal hover:bg-signal/15"
          >
            <Crosshair className="size-3" />#{hold.sequence} {KIND_LABEL[hold.kind]}
          </button>
        )}
      </header>
      <p className="text-xs leading-relaxed text-bone/90">{note.body}</p>
    </article>
  );
}

interface BetaFeedProps {
  route: RouteDetail;
  selected: Hold | null;
  onSelectHold: (id: number) => void;
  onNoteAdded: (note: BetaNote) => void;
}

export function BetaFeed({ route, selected, onSelectHold, onNoteAdded }: BetaFeedProps) {
  const holdsById = new Map(route.holds.map((h) => [h.id, h]));
  const [author, setAuthor] = useState(() => {
    try {
      return typeof window === "undefined" ? "" : (window.localStorage.getItem(AUTHOR_KEY) ?? "");
    } catch {
      return "";
    }
  });
  const [body, setBody] = useState("");
  const [attach, setAttach] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !body.trim()) return;
    setPending(true);
    setError(null);
    try {
      const note = await api.addBeta(route.id, {
        author: author.trim(),
        body: body.trim(),
        hold_id: attach && selected ? selected.id : null,
      });
      onNoteAdded(note);
      setBody("");
      try {
        window.localStorage.setItem(AUTHOR_KEY, author.trim());
      } catch {
        // Not critical.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {route.beta_notes.length === 0 && <p className="text-[11px] text-faint">No beta yet. Be the first.</p>}
          {route.beta_notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              hold={note.hold_id !== null ? holdsById.get(note.hold_id) : undefined}
              onSelectHold={onSelectHold}
            />
          ))}
        </div>
      </ScrollArea>
      <form onSubmit={submit} className="space-y-2 border-t border-line p-3">
        <TextField
          label="Callsign"
          value={author}
          onValueChange={setAuthor}
          maxLength={60}
          placeholder="your handle"
        />
        <TextAreaField
          label="Beta"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
          placeholder="Share a sequence tip, rest, or warning…"
        />
        <Switch
          label={selected ? `Pin to hold #${selected.sequence}` : "Pin to selected hold"}
          checked={attach && selected !== null}
          onCheckedChange={setAttach}
        />
        {error && <p className="text-[11px] text-danger">{error}</p>}
        <Button type="submit" variant="solid" className="w-full justify-center" disabled={pending || !author.trim() || !body.trim()}>
          <Send className="size-3.5" />
          {pending ? "Transmitting…" : "Transmit beta"}
        </Button>
      </form>
    </>
  );
}
