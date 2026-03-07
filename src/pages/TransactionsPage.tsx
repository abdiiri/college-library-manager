import { useState } from "react";
import { useLibrary } from "@/context/LibraryContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function TransactionsPage() {
  const { books, members, transactions, issueBook, returnBook } = useLibrary();
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [dueDate, setDueDate] = useState("");

  const activeMembers = members.filter((m) => m.active);
  const availableBooks = books.filter((b) => b.available > 0);
  const activeTx = transactions.filter((t) => !t.returnDate);

  const handleIssue = () => {
    if (!selectedMember || !selectedBook || !dueDate) {
      toast.error("Please fill all fields");
      return;
    }
    const success = issueBook(selectedMember, selectedBook, dueDate);
    if (success) {
      toast.success("Book issued successfully");
      setSelectedMember("");
      setSelectedBook("");
      setDueDate("");
    } else {
      toast.error("Failed to issue book");
    }
  };

  const handleReturn = (txId: string) => {
    const result = returnBook(txId);
    if (result) {
      if (result.fine > 0) {
        toast.warning(`Book returned. Fine: $${result.fine.toFixed(2)}`);
      } else {
        toast.success("Book returned successfully. No fine.");
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Borrow & Return</h1>
        <p>Issue and return books</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Issue Form */}
        <div className="bg-card rounded-lg border shadow-sm p-6 lg:col-span-1">
          <h2 className="font-heading text-lg font-bold mb-4">Issue Book</h2>
          <div className="space-y-4">
            <div>
              <Label>Select Member</Label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose member" />
                </SelectTrigger>
                <SelectContent>
                  {activeMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.memberId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select Book</Label>
              <Select value={selectedBook} onValueChange={setSelectedBook}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose book" />
                </SelectTrigger>
                <SelectContent>
                  {availableBooks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.title} ({b.available} avail.)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" />
            </div>
            <Button onClick={handleIssue} className="w-full">
              Issue Book
            </Button>
          </div>
        </div>

        {/* Active Borrowings */}
        <div className="bg-card rounded-lg border shadow-sm lg:col-span-2">
          <div className="px-6 py-4 border-b">
            <h2 className="font-heading text-lg font-bold">Active Borrowings</h2>
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeTx.map((tx) => {
                  const isOverdue = new Date(tx.dueDate) < new Date();
                  return (
                    <tr key={tx.id}>
                      <td className="font-medium">{tx.memberName}</td>
                      <td>{tx.bookTitle}</td>
                      <td>{tx.issueDate}</td>
                      <td>{tx.dueDate}</td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOverdue ? "bg-destructive/10 text-destructive" : "bg-secondary/20 text-secondary-foreground"}`}>
                          {isOverdue ? "Overdue" : "Borrowed"}
                        </span>
                      </td>
                      <td>
                        <Button size="sm" variant="outline" onClick={() => handleReturn(tx.id)}>
                          Return
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {activeTx.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground py-8">
                      No active borrowings
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
