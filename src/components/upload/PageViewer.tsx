"use client";

import { useRef, useState } from "react";
import { Rich } from "../Rich";
import { fileUrl, type UploadPage } from "@/lib/uploads";

type Box = [number, number, number, number];

/**
 * The original page, with the current question's figure boxes drawn on top. In "select" mode,
 * dragging a rectangle returns its box (0–1000 on each axis, [ymin, xmin, ymax, xmax]).
 */
export function PageViewer({
  page,
  boxes,
  selecting,
  onSelect,
}: {
  page?: UploadPage;
  boxes: { label: string; box: Box }[];
  selecting: boolean;
  onSelect: (box: Box) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

  if (!page) return <div className="grid h-64 place-items-center text-sm text-bb-muted">No page selected</div>;

  if (!page.fileId) {
    return page.text ? (
      <div className="rounded-lg border border-bb-line bg-bb-surface p-5">
        <Rich src={page.text} className="!text-[15px]" />
      </div>
    ) : (
      <div className="grid h-64 place-items-center text-sm text-bb-muted">This page&apos;s image was deleted.</div>
    );
  }

  const pos = (e: React.PointerEvent) => {
    const r = wrap.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1000, ((e.clientX - r.left) / r.width) * 1000)),
      y: Math.max(0, Math.min(1000, ((e.clientY - r.top) / r.height) * 1000)),
    };
  };

  const rect = drag && {
    left: Math.min(drag.x0, drag.x1) / 10,
    top: Math.min(drag.y0, drag.y1) / 10,
    width: Math.abs(drag.x1 - drag.x0) / 10,
    height: Math.abs(drag.y1 - drag.y0) / 10,
  };

  return (
    <div
      ref={wrap}
      className={`relative select-none overflow-hidden rounded-lg border border-bb-line bg-bb-surface ${selecting ? "cursor-crosshair" : ""}`}
      onPointerDown={(e) => {
        if (!selecting) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const p = pos(e);
        setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
      }}
      onPointerMove={(e) => {
        if (!drag) return;
        const p = pos(e);
        setDrag({ ...drag, x1: p.x, y1: p.y });
      }}
      onPointerUp={() => {
        if (!drag) return;
        const box: Box = [
          Math.round(Math.min(drag.y0, drag.y1)),
          Math.round(Math.min(drag.x0, drag.x1)),
          Math.round(Math.max(drag.y0, drag.y1)),
          Math.round(Math.max(drag.x0, drag.x1)),
        ];
        setDrag(null);
        if (box[2] - box[0] > 8 && box[3] - box[1] > 8) onSelect(box);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- stored page images, sized by the container */}
      <img src={fileUrl(page.fileId)} alt={`Page ${page.page}`} className="block w-full" draggable={false} />
      {boxes.map((b) => (
        <div
          key={b.label}
          className="pointer-events-none absolute border-2 border-[#e08a00] bg-[#e08a00]/10"
          style={{
            top: `${b.box[0] / 10}%`,
            left: `${b.box[1] / 10}%`,
            height: `${(b.box[2] - b.box[0]) / 10}%`,
            width: `${(b.box[3] - b.box[1]) / 10}%`,
          }}
        >
          <span className="absolute -top-5 left-0 rounded bg-[#e08a00] px-1 text-[10px] font-bold text-white">{b.label}</span>
        </div>
      ))}
      {rect && (
        <div
          className="pointer-events-none absolute border-2 border-bb-blue bg-bb-blue/10"
          style={{ left: `${rect.left}%`, top: `${rect.top}%`, width: `${rect.width}%`, height: `${rect.height}%` }}
        />
      )}
    </div>
  );
}
