import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
<<<<<<< HEAD
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
=======
>>>>>>> bdcf22e94b2521577834a6e895c1d62e48381a20
import Index from "./pages/Index";
import Calculator from "./pages/Calculator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
<<<<<<< HEAD
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Index />} />
            <Route path="/calculator" element={<Calculator />} />
          </Route>

=======
          <Route path="/" element={<Index />} />
          <Route path="/calculator" element={<Calculator />} />
>>>>>>> bdcf22e94b2521577834a6e895c1d62e48381a20
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
