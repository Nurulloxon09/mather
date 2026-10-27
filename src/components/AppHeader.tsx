import Link from "next/link";

const NAV = [
  { href: "/", label: "Home", key: "home" },
  { href: "/bank", label: "Question Bank", key: "bank" },
] as const;

/** Header for the pages around the test (home, bank, results). */
export function AppHeader({
  active,
  children,
}: {
  active?: (typeof NAV)[number]["key"];
  children?: React.ReactNode;
}) {
  return (
    <header className="border-b border-bb-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          mather
        </Link>
        <nav className="flex gap-1 text-[15px] font-semibold">
          {NAV.map((n) => (
            <Link
              key={n.key}
              href={n.href}
              aria-current={active === n.key ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 ${
                active === n.key ? "bg-bb-blue-soft text-bb-blue" : "text-bb-muted hover:text-bb-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        {children && <div className="ml-auto flex items-center gap-3">{children}</div>}
      </div>
    </header>
  );
}
