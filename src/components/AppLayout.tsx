import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLibrary } from "@/context/LibraryContext";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowLeftRight,
  FileText,
  LogOut,
  Library,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "librarian", "member"] },
  { to: "/books", label: "Books", icon: BookOpen, roles: ["admin", "librarian", "member"] },
  { to: "/members", label: "Members", icon: Users, roles: ["admin", "librarian"] },
  { to: "/transactions", label: "Borrow / Return", icon: ArrowLeftRight, roles: ["admin", "librarian"] },
  { to: "/reports", label: "Reports", icon: FileText, roles: ["admin", "librarian"] },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useLibrary();
  const location = useLocation();

  if (!user) return null;

  const filtered = navItems.filter((n) => n.roles.includes(user.role));

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <Library className="h-7 w-7 text-sidebar-primary" />
          <div>
            <h1 className="font-heading text-lg font-bold text-sidebar-accent-foreground">LibraTrack</h1>
            <p className="text-xs text-sidebar-foreground/60">College Library</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {filtered.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-sidebar-accent-foreground">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{user.role}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-background">
        <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
