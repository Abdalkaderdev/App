import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4">
      <h2 className="text-2xl font-semibold">Page not found</h2>
      <p className="text-foreground/70">We couldn’t find what you’re looking for.</p>
      <Link href="/">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}