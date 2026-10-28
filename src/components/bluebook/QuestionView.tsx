"use client";

import { entryToTex, isAllowedPartial } from "@/lib/grid";
import { tex } from "@/lib/rich";
import { LETTERS, type ChoiceLetter, type ItemState, type Question } from "@/lib/types";
import { Rich } from "../Rich";
import { BookmarkIcon, StrikeToggleIcon } from "./icons";

export type Reveal = { correctLetter?: ChoiceLetter } | null;

function QuestionHeader({
  number,
  marked,
  onToggleMark,
  strikeMode,
  onToggleStrike,
  showStrike,
}: {
  number: number;
  marked: boolean;
  onToggleMark: () => void;
  strikeMode: boolean;
  onToggleStrike: () => void;
  showStrike: boolean;
}) {
  return (
    <div className="mb-5">
      <div className="flex h-10 items-stretch bg-bb-bar">
        <div className="grid w-10 place-items-center bg-[#1e1e1e] text-[17px] font-bold text-white">
          {number}
        </div>
        <button
          onClick={onToggleMark}
          aria-pressed={marked}
          className="ml-2 flex items-center gap-1.5 px-2 text-[14px] font-semibold hover:underline"
        >
          <BookmarkIcon
            filled={marked}
            width={20}
            height={20}
            className={marked ? "text-bb-red" : "text-bb-ink"}
          />
          Mark for Review
        </button>
        {showStrike && (
          <button
            onClick={onToggleStrike}
            aria-pressed={strikeMode}
            title="Cross out answer choices you think are wrong"
            className={`ml-auto mr-2 my-1.5 grid place-items-center rounded px-1 ${
              strikeMode ? "bg-bb-blue text-white" : "text-bb-ink hover:bg-white"
            }`}
          >
            <StrikeToggleIcon />
          </button>
        )}
      </div>
      <div className="bb-dash" />
    </div>
  );
}

function Choices({
  q,
  item,
  strikeMode,
  locked,
  reveal,
  onAnswer,
  onCross,
}: {
  q: Question;
  item: ItemState;
  strikeMode: boolean;
  locked: boolean;
  reveal: Reveal;
  onAnswer: (a: string | undefined) => void;
  onCross: (l: ChoiceLetter) => void;
}) {
  const crossed = item.crossed ?? [];
  return (
    <div className="space-y-3.5">
      {(q.choices ?? []).map((c, i) => {
        const letter = LETTERS[i];
        const selected = item.answer === letter;
        const isCrossed = crossed.includes(letter);
        let result: string | undefined;
        if (reveal?.correctLetter) {
          if (letter === reveal.correctLetter) result = "correct";
          else if (selected) result = "wrong";
        }
        return (
          <div key={letter} className="flex items-center gap-3">
            <button
              type="button"
              disabled={locked}
              data-selected={selected}
              data-crossed={isCrossed}
              data-result={result}
              data-disabled={locked}
              onClick={() => onAnswer(selected ? undefined : letter)}
              className="bb-choice relative flex min-h-[52px] flex-1 items-center gap-4 bg-white px-3.5 py-2.5 text-left disabled:cursor-default"
            >
              <span className="bb-letter">{letter}</span>
              <span className="bb-choice-body min-w-0 flex-1">
                <Rich src={c} className="!text-[16.5px]" />
              </span>
            </button>
            {strikeMode && !locked && (
              <button
                type="button"
                onClick={() => onCross(letter)}
                className="w-12 shrink-0 text-center text-[13px] font-bold"
                aria-label={isCrossed ? `Undo cross out ${letter}` : `Cross out ${letter}`}
              >
                {isCrossed ? (
                  <span className="underline underline-offset-2">Undo</span>
                ) : (
                  <span className="relative inline-grid h-7 w-7 place-items-center rounded-full border-[1.5px] border-[#1e1e1e]">
                    {letter}
                    <span className="absolute left-[-4px] right-[-4px] top-1/2 border-t-[1.5px] border-[#1e1e1e]" />
                  </span>
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GridInput({
  value,
  locked,
  onChange,
}: {
  value: string;
  locked: boolean;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="mt-6">
      <input
        value={value}
        disabled={locked}
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        aria-label="Your answer"
        onChange={(e) => {
          const v = e.target.value.replace(/\s/g, "");
          if (isAllowedPartial(v)) onChange(v || undefined);
        }}
        className="h-[52px] w-[180px] rounded-lg border-[1.5px] border-[#1e1e1e] border-b-[4px] bg-white px-3 text-[20px] font-semibold tracking-wide outline-none focus:border-bb-blue disabled:bg-[#f7f7f7]"
      />
      <div className="mt-3 flex min-h-[44px] items-center gap-2 text-[15px]">
        <span className="font-semibold">Answer Preview:</span>
        {value && <span dangerouslySetInnerHTML={{ __html: tex(entryToTex(value)) }} />}
      </div>
    </div>
  );
}

export function QuestionView({
  q,
  number,
  item,
  strikeMode,
  onToggleStrike,
  onAnswer,
  onToggleMark,
  onCross,
  locked = false,
  reveal = null,
}: {
  q: Question;
  number: number;
  item: ItemState;
  strikeMode: boolean;
  onToggleStrike: () => void;
  onAnswer: (a: string | undefined) => void;
  onToggleMark: () => void;
  onCross: (l: ChoiceLetter) => void;
  locked?: boolean;
  reveal?: Reveal;
}) {
  const header = (
    <QuestionHeader
      number={number}
      marked={!!item.marked}
      onToggleMark={onToggleMark}
      strikeMode={strikeMode}
      onToggleStrike={onToggleStrike}
      showStrike={q.type === "mcq"}
    />
  );

  // Grid-in entry rules live in the Directions dropdown, so both types share one centered column.
  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-[720px] px-6 py-8">
        {header}
        <Rich src={q.stem} />
        {q.type === "spr" ? (
          <GridInput value={item.answer ?? ""} locked={locked} onChange={onAnswer} />
        ) : (
          <div className="mt-6">
            <Choices
              q={q}
              item={item}
              strikeMode={strikeMode}
              locked={locked}
              reveal={reveal}
              onAnswer={onAnswer}
              onCross={onCross}
            />
          </div>
        )}
      </div>
    </div>
  );
}
