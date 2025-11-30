import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import { HomePage } from "@/routes/HomePage";
import { AppFormPage } from "@/routes/AppFormPage";
import { SettingsPage } from "@/routes/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/10">
        <main className="container mx-auto px-4 py-12 max-w-7xl">
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/new" element={<AppFormPage />} />
            <Route path="/:app" element={<AppFormPage />} />
            <Route path="/settings/*" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
