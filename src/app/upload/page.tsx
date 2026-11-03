import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { AppHeader, PAGE } from "@/components/AppHeader";
import { DbNotice } from "@/components/DbNotice";
import { UploadHome } from "@/components/upload/UploadHome";
import { dbMode } from "@/server/db";
import { geminiConfigured } from "@/server/gemini";
import { orNull } from "@/server/progress";
import { listUploads } from "@/server/uploads";

export const metadata: Metadata = { title: "Upload · Mather" };

export default function Page() {
  return (
    <div className="min-h-dvh">
      <AppHeader active="upload" />
      <Suspense fallback={<p className={`${PAGE} py-10 text-bb-muted`}>Loading uploads…</p>}>
        <UploadData />
      </Suspense>
    </div>
  );
}

async function UploadData() {
  await connection();
  const uploads = await orNull(listUploads);
  return (
    <>
      <DbNotice mode={dbMode()} error={uploads.error} />
      <UploadHome uploads={uploads.data} geminiReady={geminiConfigured()} />
    </>
  );
}
