import { useState, useEffect } from "react";
import { useLibrary } from "@/context/LibraryContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Send, CheckCircle, XCircle, Clock } from "lucide-react";

interface BookRequest {
  id: string;
  student_id: string;
  book_id: string;
  book_title: string;
  student_name: string;
  quantity: number;
  status: string;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export default function RequestsPage() {
  const { books, profile } = useLibrary();
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [selectedBook, setSelectedBook] = useState("");
  const [reason, setReason] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<BookRequest | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewAction, setReviewAction] = useState<"approved" | "declined">("approved");

  const isStudent = profile?.role === "student";
  const availableBooks = books.filter((b) => b.available > 0);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("book_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setRequests(data as BookRequest[]);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmitRequest = async () => {
    if (!selectedBook || !reason.trim() || quantity < 1) {
      toast.error("Please fill all fields correctly");
      return;
    }
    const book = books.find((b) => b.id === selectedBook);
    if (!book || !profile) return;
    if (quantity > book.available) {
      toast.error(`Only ${book.available} copies available`);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("book_requests").insert({
      student_id: profile.id,
      book_id: book.id,
      book_title: book.title,
      student_name: profile.full_name || "Student",
      reason: reason.trim(),
      quantity,
    } as any);

    if (error) {
      toast.error("Failed to submit request");
    } else {
      toast.success("Book request submitted!");
      setSelectedBook("");
      setReason("");
      setQuantity(1);
      fetchRequests();
    }
    setSubmitting(false);
  };

  const handleReview = async () => {
    if (!reviewDialog) return;
    const { error } = await supabase
      .from("book_requests")
      .update({
        status: reviewAction,
        review_note: reviewNote.trim() || null,
        reviewed_by: profile?.id,
        reviewed_at: new Date().toISOString(),
      } as any)
      .eq("id", reviewDialog.id);

    if (error) {
      toast.error("Failed to update request");
    } else {
      toast.success(`Request ${reviewAction}!`);
      setReviewDialog(null);
      setReviewNote("");
      fetchRequests();
    }
  };

  const statusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle className="h-4 w-4 text-success" />;
    if (status === "declined") return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-muted text-muted-foreground",
      approved: "bg-success/10 text-success",
      declined: "bg-destructive/10 text-destructive",
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {statusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1>{isStudent ? "Request a Book" : "Book Requests"}</h1>
        <p>{isStudent ? "Submit a request to borrow a book" : "Review and manage student book requests"}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student: Request Form */}
        {isStudent && (
          <div className="bg-card rounded-lg border shadow-sm p-6 lg:col-span-1">
            <h2 className="font-heading text-lg font-bold mb-4">New Request</h2>
            <div className="space-y-4">
              <div>
                <Label>Select Book</Label>
                <Select value={selectedBook} onValueChange={setSelectedBook}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a book" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBooks.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.title} — {b.author}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Number of Books</Label>
                <Input
                  type="number"
                  min={1}
                  max={selectedBook ? (books.find(b => b.id === selectedBook)?.available || 1) : 1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Reason for Borrowing</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. I need this for my coursework on..."
                  className="mt-1"
                  rows={4}
                />
              </div>
              <Button onClick={handleSubmitRequest} disabled={submitting} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        )}

        {/* Request List */}
        <div className={`bg-card rounded-lg border shadow-sm ${isStudent ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <div className="px-6 py-4 border-b">
            <h2 className="font-heading text-lg font-bold">
              {isStudent ? "My Requests" : "All Student Requests"}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {!isStudent && <th>Student</th>}
                  <th>Book</th>
                  <th>Qty</th>
                  <th>Reason</th>
                  <th>Date</th>
                  <th>Status</th>
                  {!isStudent && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    {!isStudent && <td className="font-medium">{req.student_name}</td>}
                    <td className="font-medium">{req.book_title}</td>
                    <td className="max-w-[200px] truncate" title={req.reason}>{req.reason}</td>
                    <td className="whitespace-nowrap">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td>
                      {statusBadge(req.status)}
                      {req.review_note && (
                        <p className="text-xs text-muted-foreground mt-1">Note: {req.review_note}</p>
                      )}
                    </td>
                    {!isStudent && (
                      <td>
                        {req.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setReviewDialog(req);
                                setReviewAction("approved");
                                setReviewNote("");
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setReviewDialog(req);
                                setReviewAction("declined");
                                setReviewNote("");
                              }}
                            >
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Reviewed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={isStudent ? 4 : 6} className="text-center text-muted-foreground py-8">
                      No requests yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={(open) => !open && setReviewDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approved" ? "Approve" : "Decline"} Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm">
              <strong>Student:</strong> {reviewDialog?.student_name}
            </p>
            <p className="text-sm">
              <strong>Book:</strong> {reviewDialog?.book_title}
            </p>
            <p className="text-sm">
              <strong>Reason:</strong> {reviewDialog?.reason}
            </p>
            <div>
              <Label>Add a note (optional)</Label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={reviewAction === "approved" ? "e.g. Come pick it up at the front desk" : "e.g. This book is reserved for another class"}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(null)}>Cancel</Button>
            <Button
              variant={reviewAction === "approved" ? "default" : "destructive"}
              onClick={handleReview}
            >
              {reviewAction === "approved" ? "Approve" : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
