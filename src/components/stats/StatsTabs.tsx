import Link from "next/link";

/** Overview and History share the Stats menu item. */
export function StatsTabs({ active }: { active: "overview" | "history" }) {
  const tab = (key: typeof active, href: string, label: string) => (
    <Link
      href={href}
      aria-current={active === key ? "page" : undefined}
      className={`-mb-px border-b-2 pb-2.5 ${
        active === key ? "border-bb-ink text-bb-ink" : "border-transparent text-bb-muted hover:text-bb-ink"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <nav className="mb-8 flex gap-6 border-b border-bb-hair text-[15px] font-semibold">
      {tab("overview", "/stats", "Overview")}
      {tab("history", "/history", "History")}
    </nav>
  );
}
