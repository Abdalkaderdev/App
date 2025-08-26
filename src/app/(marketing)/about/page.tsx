import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function AboutPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About Therapist Lite</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-foreground/80">Therapist Lite is a focused toolkit for notes, clients, and scheduling.</p>
      </CardContent>
    </Card>
  );
}