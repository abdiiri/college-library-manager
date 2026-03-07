import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LibraryProvider, useLibrary } from "@/context/LibraryContext";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import BooksPage from "@/pages/BooksPage";
import MembersPage from "@/pages/MembersPage";
import TransactionsPage from "@/pages/TransactionsPage";
import ReportsPage from "@/pages/ReportsPage";
import NotFound from "@/pages/NotFound";
import { ReactNode } from "react";

const queryClient = new QueryClient();

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user } = useLibrary();
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function LoginGuard() {
  const { user } = useLibrary();
  if (user) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LibraryProvider>
          <Routes>
            <Route path="/" element={<LoginGuard />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/books" element={<ProtectedRoute><BooksPage /></ProtectedRoute>} />
            <Route path="/members" element={<ProtectedRoute roles={["admin", "librarian"]}><MembersPage /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute roles={["admin", "librarian"]}><TransactionsPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute roles={["admin", "librarian"]}><ReportsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </LibraryProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
