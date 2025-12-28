import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TenantProvider } from "@/contexts/TenantContext";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdminAuth from "./pages/AdminAuth";
import ContractSign from "./pages/ContractSign";
import QuoteApproval from "./pages/QuoteApproval";
import Invitations from "./pages/Invitations";
import InvitationView from "./pages/InvitationView";
import GiftList from "./pages/GiftList";
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
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/login" element={<AdminAuth />} />
              <Route path="/contrato/assinar/:token" element={<ContractSign />} />
              <Route path="/orcamento/:token" element={<QuoteApproval />} />
              <Route path="/convites" element={<Invitations />} />
              <Route path="/convite/:token" element={<InvitationView />} />
              <Route path="/presentes/:token" element={<GiftList />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </TenantProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
