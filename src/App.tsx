import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Santri from "./pages/Santri";
import Monitoring from "./pages/Monitoring";
import Tabungan from "./pages/Tabungan";
import Donasi from "./pages/Donasi";
import Inventaris from "./pages/Inventaris";
import Koperasi from "./pages/Koperasi";
import Keuangan from "./pages/Keuangan";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/santri" element={<Santri />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/tabungan" element={<Tabungan />} />
            <Route path="/donasi" element={<Donasi />} />
            <Route path="/inventaris" element={<Inventaris />} />
            <Route path="/koperasi" element={<Koperasi />} />
            <Route path="/keuangan" element={<Keuangan />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
