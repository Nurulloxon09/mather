"use client";

import { BookmarkIcon, PinIcon } from "./icons";

export type GridCell = { answered: boolean; marked: boolean };

export function Legend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] font-semibold">
      <span className="flex items-center gap-1.5">
        <PinIcon width={18} height={18} className="text-[#1e1e1e]" /> Current
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-4 w-4 border-[1.5px] border-dashed border-[#6b6b6b]" /> Unanswered
      </span>
      <span className="flex items-center gap-1.5">
        <BookmarkIcon filled width={16} height={16} className="text-bb-red" /> For Review
      </span>
    </div>
  );
}

export function QuestionGrid({
  cells,
  current,
  onPick,
}: {
  cells: GridCell[];
  current: number | null;
  onPick: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-6 pt-2">
      {cells.map((c, i) => (
        <button
          key={i}
          onClick={() => onPick(i)}
          data-answered={c.answered}
          className="bb-cell"
          aria-label={`Question ${i + 1}${c.answered ? ", answered" : ", unanswered"}${c.marked ? ", marked for review" : ""}`}
        >
          {current === i && (
            <PinIcon width={18} height={18} className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[#1e1e1e]" />
          )}
          {c.marked && (
            <BookmarkIcon filled width={14} height={14} className="absolute -right-[7px] -top-[7px] text-bb-red" />
          )}
          {i + 1}
        </button>
      ))}
    </div>
  );
}
