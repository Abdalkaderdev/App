"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4">
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <p className="text-foreground/70">{error.message || "An unexpected error occurred."}</p>
      <div className="flex items-center gap-3 mt-2">
        <Button onClick={() => reset()}>Try again</Button>
        <Link href="/" className="underline text-sm">Go home</Link>
      </div>
    </div>
  );
}