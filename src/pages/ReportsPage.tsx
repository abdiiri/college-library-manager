import { useState } from "react";
import { useLibrary } from "@/context/LibraryContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function ReportsPage() {
  const { books, transactions } = useLibrary();
  const [memberSearch, setMemberSearch] = useState("");

  const borrowedTx = transactions.filter((t) => !t.return_date);
  const overdueTx = transactions.filter((t) => !t.return_date && new Date(t.due_date) < new Date());

  const filteredHistory = memberSearch
    ? transactions.filter((t) => t.member_name.toLowerCase().includes(memberSearch.toLowerCase()))
    : transactions;

  return (
    <div>
      <div className="page-header">
        <h1>Reports</h1>
        <p>View library reports and statistics</p>
      </div>

      <Tabs defaultValue="books" className="space-y-4">
        <TabsList>
          <TabsTrigger value="books">All Books</TabsTrigger>
          <TabsTrigger value="borrowed">Borrowed</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="history">Member History</TabsTrigger>
        </TabsList>

        <TabsContent value="books">
          <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Title</th><th>Author</th><th>Category</th><th>ISBN</th><th>Total</th><th>Available</th></tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id}>
                    <td className="font-medium">{b.title}</td>
                    <td>{b.author}</td>
                    <td>{b.category}</td>
                    <td className="font-mono text-xs">{b.isbn}</td>
                    <td>{b.quantity}</td>
                    <td className={b.available === 0 ? "text-destructive font-semibold" : "text-success font-semibold"}>{b.available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="borrowed">
          <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Member</th><th>Book</th><th>Issue Date</th><th>Due Date</th></tr>
              </thead>
              <tbody>
                {borrowedTx.map((tx) => (
                  <tr key={tx.id}>
                    <td className="font-medium">{tx.member_name}</td>
                    <td>{tx.book_title}</td>
                    <td>{tx.issue_date}</td>
                    <td>{tx.due_date}</td>
                  </tr>
                ))}
                {borrowedTx.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-muted-foreground py-8">No borrowed books</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="overdue">
          <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Member</th><th>Book</th><th>Issue Date</th><th>Due Date</th><th>Days Overdue</th></tr>
              </thead>
              <tbody>
                {overdueTx.map((tx) => {
                  const days = Math.ceil((new Date().getTime() - new Date(tx.due_date).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={tx.id}>
                      <td className="font-medium">{tx.member_name}</td>
                      <td>{tx.book_title}</td>
                      <td>{tx.issue_date}</td>
                      <td>{tx.due_date}</td>
                      <td className="text-destructive font-semibold">{days} days</td>
                    </tr>
                  );
                })}
                {overdueTx.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-muted-foreground py-8">No overdue books</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="mb-4 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by member name..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Member</th><th>Book</th><th>Issue Date</th><th>Due Date</th><th>Return Date</th><th>Fine</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filteredHistory.map((tx) => (
                  <tr key={tx.id}>
                    <td className="font-medium">{tx.member_name}</td>
                    <td>{tx.book_title}</td>
                    <td>{tx.issue_date}</td>
                    <td>{tx.due_date}</td>
                    <td>{tx.return_date || "—"}</td>
                    <td>{tx.fine > 0 ? `$${Number(tx.fine).toFixed(2)}` : "—"}</td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === "returned" ? "bg-success/10 text-success" : tx.status === "overdue" ? "bg-destructive/10 text-destructive" : "bg-secondary/20 text-secondary-foreground"
                      }`}>
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
