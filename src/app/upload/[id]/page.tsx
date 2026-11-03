import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader, PAGE, WIDE } from "@/components/AppHeader";
import { Workspace } from "@/components/upload/Workspace";
import { geminiConfigured, geminiModels } from "@/server/gemini";
import { getUploadState, HttpError } from "@/server/uploads";

export const metadata: Metadata = { title: "Review upload · Mather" };

export default function Page(props: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <div className="min-h-dvh">
      <AppHeader active="upload" wide />
      <Suspense fallback={<p className={`${WIDE} py-10 text-bb-muted`}>Loading…</p>}>
        <WorkspaceData {...props} />
      </Suspense>
    </div>
  );
}

async function WorkspaceData({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const loaded = await getUploadState(id).catch((err: unknown) => {
    if (err instanceof HttpError) return err;
    throw err;
  });
  if (loaded instanceof HttpError) {
    return (
      <div className={`${PAGE} py-16 text-center`}>
        <p className="text-lg font-semibold">{loaded.status === 404 ? "Upload not found" : loaded.message}</p>
        <Link href="/upload" className="bb-btn bb-btn-primary mt-5 inline-block">
          Back to uploads
        </Link>
      </div>
    );
  }
  return (
    <Workspace
      initial={loaded}
      models={geminiModels()}
      aiReady={geminiConfigured()}
      autoStart={sp.start === "1"}
      initialQuestion={typeof sp.q === "string" && loaded.drafts.some((d) => d.id === sp.q) ? sp.q : undefined}
    />
  );
}
