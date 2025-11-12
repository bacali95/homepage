import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle } from "lucide-react";
import { api, type App } from "@/lib/api";

export default function HomePage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const allApps = await api.getApps();
      setApps(allApps);
    } catch (error) {
      console.error("Error loading apps:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading apps...</div>;
  }

  if (apps.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No apps configured yet.</p>
        <Button asChild>
          <Link to="/manage">Add your first app</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Homelab Services</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => (
          <Card key={app.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl">{app.name}</CardTitle>
                {app.has_update ? (
                  <Badge
                    variant="destructive"
                    className="flex items-center gap-1"
                  >
                    <AlertCircle className="h-3 w-3" />
                    Update Available
                  </Badge>
                ) : null}
              </div>
              <CardDescription>
                Version: {app.current_version}
                {app.latest_version && app.has_update ? (
                  <span className="ml-2 text-destructive">
                    → {app.latest_version}
                  </span>
                ) : null}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end">
              <Link to={app.url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
