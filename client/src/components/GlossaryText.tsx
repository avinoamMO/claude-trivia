import { useMemo } from "react";
import { glossaryEntries } from "../lib/glossary";

interface GlossaryTextProps {
  text: string;
  className?: string;
}

interface Segment {
  text: string;
  term?: string;
  definition?: string;
}

function segmentText(text: string): Segment[] {
  const segments: Segment[] = [];
  // Build a flat array of all matches with positions
  const allMatches: { start: number; end: number; term: string; definition: string }[] = [];

  for (const [term, definition] of glossaryEntries) {
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      // Check no overlap with existing matches
      let overlaps = false;
      for (const existing of allMatches) {
        if (start < existing.end && end > existing.start) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) {
        allMatches.push({ start, end, term, definition });
      }
    }
  }

  // Sort by position
  allMatches.sort((a, b) => a.start - b.start);

  // Build segments
  let cursor = 0;
  for (const m of allMatches) {
    if (m.start > cursor) {
      segments.push({ text: text.slice(cursor, m.start) });
    }
    segments.push({
      text: text.slice(m.start, m.end),
      term: m.term,
      definition: m.definition,
    });
    cursor = m.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ text }];
}

export default function GlossaryText({ text, className = "" }: GlossaryTextProps) {
  const segments = useMemo(() => segmentText(text), [text]);

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.definition ? (
          <span key={i} className="glossary-term group relative inline">
            <span className="border-b border-dotted border-[#D97757]/50 text-[#E8956F] cursor-help hover:text-[#D97757] hover:border-[#D97757] transition-colors">
              {seg.text}<sup className="text-[8px] text-[#D97757]/60 ml-0.5 select-none">?</sup>
            </span>
            <span className="glossary-tooltip pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a1a] border border-[#D97757]/30 rounded-lg text-xs text-zinc-300 leading-relaxed w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-xl">
              <span className="font-semibold text-[#D97757] block mb-0.5">{seg.term}</span>
              {seg.definition}
              <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#D97757]/30" />
            </span>
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </span>
  );
}
