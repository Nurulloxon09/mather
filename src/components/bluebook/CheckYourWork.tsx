"use client";

import { Legend, QuestionGrid, type GridCell } from "./QuestionGrid";

/** The end-of-module review page. */
export function CheckYourWork({
  title,
  cells,
  onPick,
}: {
  title: string;
  cells: GridCell[];
  onPick: (i: number) => void;
}) {
  const unanswered = cells.filter((c) => !c.answered).length;
  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-[760px] px-6 py-10">
        <h1 className="text-center text-[30px] font-bold">Check Your Work</h1>
        <p className="mx-auto mt-4 max-w-[600px] text-center text-[15px] leading-relaxed">
          On test day, you won&apos;t be able to move on to the next module until time expires.
          <br />
          For these practice questions, you can click <strong>Next</strong> when you&apos;re ready to move on.
        </p>
        <div className="mt-8 rounded-xl border border-bb-line p-6 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <div className="flex flex-wrap items-center gap-4 border-b border-bb-line pb-4">
            <h2 className="flex-1 text-[17px] font-bold">{title}</h2>
            <Legend />
          </div>
          <div className="py-6">
            <QuestionGrid cells={cells} current={null} onPick={onPick} />
          </div>
          {unanswered > 0 && (
            <p className="text-center text-sm font-semibold text-bb-red">
              {unanswered} unanswered question{unanswered === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
