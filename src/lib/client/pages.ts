// Turning uploaded files into page images in the browser, and cropping figures out of them.

export type RenderedPage = { blob: Blob; width: number; height: number; text: string };

const PAGE_WIDTH = 1600;

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't encode the image"))), type, quality),
  );
}

export async function openPdf(file: Blob) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  return {
    numPages: doc.numPages,
    async render(n: number): Promise<RenderedPage> {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(4, PAGE_WIDTH / base.width) });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      await page.render({ canvas, viewport }).promise;
      const content = await page.getTextContent();
      const text = content.items
        .map((i) => ("str" in i ? i.str + (i.hasEOL ? "\n" : " ") : ""))
        .join("")
        .replace(/[ \t]+/g, " ")
        .trim();
      const blob = await toBlob(canvas, "image/jpeg", 0.85);
      page.cleanup();
      return { blob, width: canvas.width, height: canvas.height, text };
    },
    destroy: () => task.destroy(),
  };
}

/** A photo or scan of a page, scaled down to a sensible size and flattened onto white. */
export async function imageToPage(file: Blob): Promise<RenderedPage> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, (PAGE_WIDTH + 400) / bmp.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return { blob: await toBlob(canvas, "image/jpeg", 0.88), width: canvas.width, height: canvas.height, text: "" };
}

/** Crop [ymin, xmin, ymax, xmax] (0–1000) out of an image URL, with a little margin, as a PNG. */
export async function cropImage(url: string, box: [number, number, number, number], pad = 8) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Couldn't load the page image");
  const bmp = await createImageBitmap(await res.blob());
  const [y0, x0, y1, x1] = box;
  const px = (v: number, size: number) => Math.round((v / 1000) * size);
  const sx = Math.max(0, px(x0, bmp.width) - pad);
  const sy = Math.max(0, px(y0, bmp.height) - pad);
  const sw = Math.min(bmp.width, px(x1, bmp.width) + pad) - sx;
  const sh = Math.min(bmp.height, px(y1, bmp.height) + pad) - sy;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, sw);
  canvas.height = Math.max(1, sh);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, sw, sh);
  bmp.close();
  return { blob: await toBlob(canvas, "image/png"), width: sw, height: sh };
}
