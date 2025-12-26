import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TenantProvider } from "@/contexts/TenantContext";
import { HelmetProvider } from "react-helmet-async";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdminAuth from "./pages/AdminAuth";
import DecoratorSignup from "./pages/DecoratorSignup";
import SuperAdmin from "./pages/SuperAdmin";
import RenewSubscription from "./pages/RenewSubscription";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TenantProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/site/:slug" element={<Index />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/login" element={<AdminAuth />} />
              <Route path="/cadastro" element={<DecoratorSignup />} />
              <Route path="/super-admin" element={<SuperAdmin />} />
              <Route path="/renovar" element={<RenewSubscription />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </TenantProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
