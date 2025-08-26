import { Container } from "@/components/Container";

export function Footer() {
  return (
    <footer className="border-t border-black/10 dark:border-white/10 mt-16">
      <Container>
        <div className="h-16 flex items-center justify-between text-sm text-foreground/70">
          <p>© {new Date().getFullYear()} Therapist Lite</p>
          <div className="flex items-center gap-4">
            <a href="/sitemap.xml" className="hover:text-foreground">Sitemap</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}