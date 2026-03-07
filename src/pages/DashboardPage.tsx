import { useLibrary } from "@/context/LibraryContext";
import { BookOpen, Users, ArrowLeftRight, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const { books, members, transactions } = useLibrary();

  const totalBooks = books.reduce((s, b) => s + b.quantity, 0);
  const totalMembers = members.filter((m) => m.active).length;
  const borrowed = transactions.filter((t) => t.status === "borrowed" || t.status === "overdue").length;
  const overdue = transactions.filter((t) => {
    if (t.returnDate) return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const stats = [
    { label: "Total Books", value: totalBooks, icon: BookOpen, color: "text-primary" },
    { label: "Active Members", value: totalMembers, icon: Users, color: "text-secondary" },
    { label: "Books Borrowed", value: borrowed, icon: ArrowLeftRight, color: "text-primary" },
    { label: "Overdue Books", value: overdue, icon: AlertTriangle, color: "text-destructive" },
  ];

  const recentTx = transactions.slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of the library system</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.value}</p>
              </div>
              <s.icon className={`h-10 w-10 ${s.color} opacity-80`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="font-heading text-lg font-bold">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Book</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTx.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-medium">{tx.memberName}</td>
                  <td>{tx.bookTitle}</td>
                  <td>{tx.issueDate}</td>
                  <td>{tx.dueDate}</td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === "returned"
                          ? "bg-success/10 text-success"
                          : tx.status === "overdue"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-secondary/20 text-secondary-foreground"
                      }`}
                    >
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
