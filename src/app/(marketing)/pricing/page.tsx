import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function PricingPage() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Free</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80">Get started with personal note-taking.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80">Advanced client management and exports.</p>
        </CardContent>
      </Card>
    </div>
  );
}