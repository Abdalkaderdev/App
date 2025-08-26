import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function DashboardPage() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Session</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80">No sessions scheduled.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80">No notes yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}