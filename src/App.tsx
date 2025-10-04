import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Santri from "./pages/Santri";
import Monitoring from "./pages/Monitoring";
import Tabungan from "./pages/Tabungan";
import Donasi from "./pages/Donasi";
import Inventaris from "./pages/Inventaris";
import Koperasi from "./pages/Koperasi";
import Keuangan from "./pages/Keuangan";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <Layout>
                <Dashboard />
              </Layout>
            } />
            <Route path="/santri" element={
              <Layout>
                <Santri />
              </Layout>
            } />
            <Route path="/monitoring" element={
              <Layout>
                <Monitoring />
              </Layout>
            } />
            <Route path="/tabungan" element={
              <Layout>
                <Tabungan />
              </Layout>
            } />
            <Route path="/donasi" element={
              <Layout>
                <Donasi />
              </Layout>
            } />
            <Route path="/inventaris" element={
              <Layout>
                <Inventaris />
              </Layout>
            } />
            <Route path="/koperasi" element={
              <Layout>
                <Koperasi />
              </Layout>
            } />
            <Route path="/keuangan" element={
              <Layout>
                <Keuangan />
              </Layout>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
