import { useMemo } from "react";
import { inlineHtml, parseBlocks } from "@/lib/rich";

/** Renders question markup (paragraphs, LaTeX, tables, images). */
export function Rich({ src, className }: { src: string; className?: string }) {
  const blocks = useMemo(() => parseBlocks(src), [src]);
  return (
    <div className={`rich ${className ?? ""}`}>
      {blocks.map((b, i) => {
        switch (b.t) {
          case "p":
            return <p key={i} dangerouslySetInnerHTML={{ __html: b.html }} />;
          case "math":
            return (
              <div key={i} className="rich-math" dangerouslySetInnerHTML={{ __html: b.html }} />
            );
          case "img":
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={b.src}
                alt={b.alt}
                className="rich-img"
                style={b.width ? { width: b.width } : undefined}
              />
            );
          case "table":
            return (
              <div key={i} className="rich-table-wrap">
                <table className="rich-table">
                  {b.caption && (
                    <caption dangerouslySetInnerHTML={{ __html: b.caption }} />
                  )}
                  {b.head && (
                    <thead>
                      <tr>
                        {b.head.map((h, j) => (
                          <th key={j} dangerouslySetInnerHTML={{ __html: h }} />
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k} dangerouslySetInnerHTML={{ __html: c }} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}

/** Single-line markup (answer choices, short labels). */
export function RichInline({ src, className }: { src: string; className?: string }) {
  const html = useMemo(() => inlineHtml(src), [src]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
