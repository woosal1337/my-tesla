"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5">
      <div className="w-full">
        <EmptyState title="The dashboard cannot read the data">
          The TeslaMate database did not answer. Try again in a moment.
        </EmptyState>
        <Button
          onClick={reset}
          className="mt-6 h-10 w-full rounded text-sm transition-tesla"
        >
          Try again
        </Button>
      </div>
    </main>
  );
}
