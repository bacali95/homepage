import { Outlet, Link } from "react-router";
import { Home, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            Homelab Homepage
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/manage">
                <Settings className="mr-2 h-4 w-4" />
                Manage Apps
              </Link>
            </Button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
