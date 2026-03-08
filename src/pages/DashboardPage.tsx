import { useLibrary } from "@/context/LibraryContext";
import { BookOpen, Users, ArrowLeftRight, AlertTriangle, Clock } from "lucide-react";

export default function DashboardPage() {
  const { books, members, transactions, profile } = useLibrary();
  const isStudent = profile?.role === "student";

  const totalBooks = books.reduce((s, b) => s + b.quantity, 0);
  const totalAvailable = books.reduce((s, b) => s + b.available, 0);
  const totalMembers = members.filter((m) => m.active).length;
  const allBorrowed = transactions.filter((t) => !t.return_date);
  const allOverdue = transactions.filter((t) => !t.return_date && new Date(t.due_date) < new Date());

  // Student: show their own transactions
  const myBorrowed = allBorrowed;
  const myOverdue = allOverdue;

  if (isStudent) {
    const stats = [
      { label: "Total Books in Library", value: totalBooks, icon: BookOpen, color: "text-primary" },
      { label: "Available Books", value: totalAvailable, icon: BookOpen, color: "text-success" },
      { label: "My Borrowed Books", value: myBorrowed.length, icon: ArrowLeftRight, color: "text-primary" },
      { label: "My Overdue Books", value: myOverdue.length, icon: AlertTriangle, color: "text-destructive" },
    ];

    return (
      <div>
        <div className="page-header">
          <h1>My Dashboard</h1>
          <p>Welcome back, {profile?.full_name || "Student"}</p>
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

        {/* Student's borrowed books */}
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="font-heading text-lg font-bold">My Borrowed Books</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myBorrowed.map((tx) => {
                  const isOverdue = new Date(tx.due_date) < new Date();
                  return (
                    <tr key={tx.id}>
                      <td className="font-medium">{tx.book_title}</td>
                      <td>{tx.issue_date}</td>
                      <td>{tx.due_date}</td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isOverdue ? "bg-destructive/10 text-destructive" : "bg-secondary/20 text-secondary-foreground"
                        }`}>
                          {isOverdue ? "Overdue" : "Borrowed"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {myBorrowed.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-muted-foreground py-8">No borrowed books</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Librarian/Admin dashboard
  const stats = [
    { label: "Total Books", value: totalBooks, icon: BookOpen, color: "text-primary" },
    { label: "Active Members", value: totalMembers, icon: Users, color: "text-secondary" },
    { label: "Books Borrowed", value: allBorrowed.length, icon: ArrowLeftRight, color: "text-primary" },
    { label: "Overdue Books", value: allOverdue.length, icon: AlertTriangle, color: "text-destructive" },
  ];

  const recentTx = transactions.slice(0, 10);

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
                <th>Return Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTx.map((tx) => {
                const isOverdue = !tx.return_date && new Date(tx.due_date) < new Date();
                return (
                  <tr key={tx.id}>
                    <td className="font-medium">{tx.member_name}</td>
                    <td>{tx.book_title}</td>
                    <td>{tx.issue_date}</td>
                    <td>{tx.due_date}</td>
                    <td>{tx.return_date || "—"}</td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.return_date
                          ? "bg-success/10 text-success"
                          : isOverdue
                          ? "bg-destructive/10 text-destructive"
                          : "bg-secondary/20 text-secondary-foreground"
                      }`}>
                        {tx.return_date ? "Returned" : isOverdue ? "Overdue" : "Borrowed"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {recentTx.length === 0 && (
                <tr><td colSpan={6} className="text-center text-muted-foreground py-8">No transactions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
