import Link from "next/link";

export const NAV = [
  { href: "/bank", label: "Practice", key: "bank" },
  { href: "/stats", label: "Stats", key: "stats" },
  { href: "/upload", label: "Upload", key: "upload" },
] as const;

export type NavKey = (typeof NAV)[number]["key"];

/** Shared width for the header and page content, so everything lines up. */
export const PAGE = "mx-auto w-full max-w-5xl px-5 sm:px-8";

/** The review workspace is a wide three-pane tool. */
export const WIDE = "mx-auto w-full max-w-[1680px] px-4 sm:px-6";

/** Header for the pages around the test. The wordmark is the way home. */
export function AppHeader({ active, wide }: { active?: NavKey; wide?: boolean }) {
  return (
    <header className={`${wide ? WIDE : PAGE} flex items-center gap-6 py-5`}>
      <Link href="/" className="mr-auto text-lg font-extrabold tracking-tight">
        mather
      </Link>
      <nav className="flex gap-5 text-[15px] font-semibold sm:gap-7">
        {NAV.map((n) => (
          <Link
            key={n.key}
            href={n.href}
            aria-current={active === n.key ? "page" : undefined}
            className={
              active === n.key
                ? "text-bb-ink underline decoration-2 underline-offset-[10px]"
                : "text-bb-muted hover:text-bb-ink"
            }
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
