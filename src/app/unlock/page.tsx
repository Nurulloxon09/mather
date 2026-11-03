import { Suspense } from "react";
import type { Metadata } from "next";
import { UnlockForm } from "@/components/UnlockForm";

export const metadata: Metadata = { title: "Unlock · Mather" };

export default function Page() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-extrabold tracking-tight">mather</h1>
        <p className="mb-5 mt-1 text-sm text-bb-muted">Enter the passcode to continue.</p>
        <Suspense>
          <UnlockForm />
        </Suspense>
      </div>
    </div>
  );
}
