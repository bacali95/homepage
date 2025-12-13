import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Header } from "@/components/Header";
import { AppFormPage } from "@/routes/AppFormPage";
import { HomePage } from "@/routes/HomePage";
import { SettingsPage } from "@/routes/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/10">
        <main className="container mx-auto px-4 py-12 max-w-7xl">
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:app/*" element={<AppFormPage />} />
            <Route path="/settings/*" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
