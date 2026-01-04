import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import DesignerDashboard from "./pages/DesignerDashboard";
import CashierDashboard from "./pages/CashierDashboard";
import OperatorDashboard from "./pages/OperatorDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to={`/${userRole}`} replace />;
  }

  return <>{children}</>;
}

function AuthRedirect() {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user && userRole) {
    return <Navigate to={`/${userRole}`} replace />;
  }

  return <AuthPage />;
}

function HomeRedirect() {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user && userRole) {
    return <Navigate to={`/${userRole}`} replace />;
  }

  return <Navigate to="/auth" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/auth" element={<AuthRedirect />} />
            <Route
              path="/designer"
              element={
                <ProtectedRoute allowedRoles={['designer']}>
                  <DesignerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/designer/*"
              element={
                <ProtectedRoute allowedRoles={['designer']}>
                  <DesignerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cashier"
              element={
                <ProtectedRoute allowedRoles={['cashier']}>
                  <CashierDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cashier/*"
              element={
                <ProtectedRoute allowedRoles={['cashier']}>
                  <CashierDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operator"
              element={
                <ProtectedRoute allowedRoles={['operator']}>
                  <OperatorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operator/*"
              element={
                <ProtectedRoute allowedRoles={['operator']}>
                  <OperatorDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
