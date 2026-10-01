import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5">
      <div className="w-full">
        <EmptyState title="Page not found">
          My Tesla has no car or page at this address.
        </EmptyState>
        <Link
          href="/"
          className="mt-6 flex h-10 items-center justify-center rounded bg-primary text-sm font-medium text-primary-foreground transition-tesla hover:bg-primary/90"
        >
          Go to your car
        </Link>
      </div>
    </main>
  );
}
