import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppFormPage } from "@/routes/AppFormPage";
import { HomePage } from "@/routes/HomePage";
import { SettingsPage } from "@/routes/SettingsPage";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-1.5 focus:text-accent-fg"
        >
          Skip to content
        </a>
        <Header />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto max-w-[1600px] px-4 py-6 outline-none sm:px-6"
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:app/*" element={<AppFormPage />} />
            <Route path="/settings/*" element={<SettingsPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </ThemeProvider>
  );
}
