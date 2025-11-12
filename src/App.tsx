import { Outlet, Link } from "react-router";
import { Home, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            Homepage
          </Link>
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="ghost" asChild>
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link to="/manage">
              <Button variant="ghost" asChild>
                <Settings className="mr-2 h-4 w-4" />
                Manage Apps
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
