import Link from "next/link";
import { Container } from "@/components/Container";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 dark:border-white/10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <div className="h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">
            Therapist <span className="text-blue-600">Lite</span>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden sm:flex items-center gap-6 text-sm text-foreground/80">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <a href="https://nextjs.org/docs" target="_blank" rel="noreferrer" className="hover:text-foreground">Docs</a>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </Container>
    </header>
  );
}