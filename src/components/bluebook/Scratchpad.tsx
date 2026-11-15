"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, PenTool, Trash2, Undo2, X } from "lucide-react";

export type ScratchPoint = { x: number; y: number };
export type ScratchStroke = {
  tool: "pen" | "eraser";
  color: string;
  size: number;
  points: ScratchPoint[];
};

const PEN_COLORS = [
  { id: "#1e1e1e", label: "Black" },
  { id: "#324dc7", label: "Blue" },
  { id: "#c13145", label: "Red" },
  { id: "#12805c", label: "Green" },
];

const PEN_SIZES = [
  { size: 2.5, label: "Fine" },
  { size: 5, label: "Medium" },
];

const ERASER_SIZE = 22;

function drawStroke(ctx: CanvasRenderingContext2D, stroke: ScratchStroke) {
  const { points, tool, color, size } = stroke;
  if (!points.length) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = size;
  if (tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.fillStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
  }

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

export function Scratchpad({
  open,
  strokes,
  onChange,
  onClose,
}: {
  open: boolean;
  strokes: ScratchStroke[];
  onChange: (next: ScratchStroke[]) => void;
  onClose: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef<ScratchStroke | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState(PEN_COLORS[1].id);
  const [penSize, setPenSize] = useState(PEN_SIZES[0].size);

  const redraw = useCallback(
    (extra?: ScratchStroke | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const s of strokes) drawStroke(ctx, s);
      if (extra) drawStroke(ctx, extra);
      ctx.restore();
    },
    [strokes],
  );

  // Sync canvas dimensions to container and redraw whenever open, size, or strokes change.
  useEffect(() => {
    if (!open) return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const nextW = Math.max(1, Math.floor(rect.width * dpr));
      const nextH = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }
      redraw(activeRef.current);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [open, redraw]);

  useEffect(() => {
    if (open) redraw(activeRef.current);
  }, [open, strokes, redraw]);

  if (!open) return null;

  const pointOf = (e: React.PointerEvent<HTMLCanvasElement>): ScratchPoint => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerIdRef.current = e.pointerId;
    const stroke: ScratchStroke = {
      tool,
      color,
      size: tool === "eraser" ? ERASER_SIZE : penSize,
      points: [pointOf(e)],
    };
    activeRef.current = stroke;
    redraw(stroke);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointerIdRef.current !== e.pointerId || !activeRef.current) return;
    activeRef.current.points.push(pointOf(e));
    redraw(activeRef.current);
  };

  const finishStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointerIdRef.current !== e.pointerId || !activeRef.current) return;
    const completed = activeRef.current;
    activeRef.current = null;
    pointerIdRef.current = null;
    onChange([...strokes, completed]);
  };

  return (
    <div
      ref={wrapRef}
      className="pointer-events-auto absolute inset-0 z-20 overflow-hidden"
      aria-label="Drawing scratchpad overlay"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
        className={`h-full w-full touch-none ${tool === "eraser" ? "cursor-cell" : "cursor-crosshair"}`}
      />

      {/* Floating Scratchpad Toolbar */}
      <div
        role="toolbar"
        aria-label="Scratchpad tools"
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute right-4 top-3 z-30 flex flex-wrap items-center gap-1.5 rounded-lg border border-[#1e1e1e] bg-white px-2.5 py-1.5 shadow-lg"
      >
        <button
          type="button"
          onClick={() => setTool("pen")}
          aria-pressed={tool === "pen"}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold ${
            tool === "pen" ? "bg-bb-blue text-white" : "text-bb-ink hover:bg-bb-bar"
          }`}
        >
          <PenTool size={14} aria-hidden="true" />
          Pen
        </button>

        <div className="flex items-center gap-1 px-1" aria-label="Pen colors">
          {PEN_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              title={`${c.label} ink`}
              aria-label={`${c.label} ink`}
              onClick={() => {
                setColor(c.id);
                setTool("pen");
              }}
              className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 ${
                tool === "pen" && color === c.id ? "border-[#1e1e1e] ring-2 ring-[#1e1e1e]/30" : "border-black/20"
              }`}
              style={{ backgroundColor: c.id }}
            />
          ))}
        </div>

        <div className="flex items-center gap-0.5 rounded bg-bb-bar p-0.5" aria-label="Pen thickness">
          {PEN_SIZES.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                setPenSize(s.size);
                setTool("pen");
              }}
              aria-pressed={tool === "pen" && penSize === s.size}
              className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                tool === "pen" && penSize === s.size ? "bg-white text-bb-ink shadow-xs" : "text-bb-muted hover:text-bb-ink"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setTool("eraser")}
          aria-pressed={tool === "eraser"}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold ${
            tool === "eraser" ? "bg-bb-blue text-white" : "text-bb-ink hover:bg-bb-bar"
          }`}
        >
          <Eraser size={14} aria-hidden="true" />
          Eraser
        </button>

        <span className="mx-0.5 h-5 w-px bg-bb-line" aria-hidden="true" />

        <button
          type="button"
          disabled={!strokes.length}
          onClick={() => onChange(strokes.slice(0, -1))}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-bb-ink hover:bg-bb-bar disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Undo2 size={14} aria-hidden="true" />
          Undo
        </button>

        <button
          type="button"
          disabled={!strokes.length}
          onClick={() => onChange([])}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-bb-red hover:bg-bb-red-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={14} aria-hidden="true" />
          Clear
        </button>

        <span className="mx-0.5 h-5 w-px bg-bb-line" aria-hidden="true" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close scratchpad"
          className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-bb-muted hover:bg-bb-bar hover:text-bb-ink"
        >
          <X size={14} aria-hidden="true" />
          Close
        </button>
      </div>
    </div>
  );
}
