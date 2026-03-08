import { useState } from "react";
import { useLibrary, Book } from "@/context/LibraryContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export default function BooksPage() {
  const { books, refreshBooks, profile } = useLibrary();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [form, setForm] = useState({ title: "", author: "", category: "", isbn: "", quantity: "1" });

  const canManage = profile?.role === "admin" || profile?.role === "librarian";

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", author: "", category: "", isbn: "", quantity: "1" });
    setDialogOpen(true);
  };

  const openEdit = (book: Book) => {
    setEditing(book);
    setForm({ title: book.title, author: book.author, category: book.category, isbn: book.isbn, quantity: String(book.quantity) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.author) {
      toast.error("Title and Author are required");
      return;
    }
    const qty = parseInt(form.quantity) || 1;

    if (editing) {
      const newAvailable = editing.available + (qty - editing.quantity);
      const { error } = await supabase.from("books").update({
        title: form.title, author: form.author, category: form.category,
        isbn: form.isbn, quantity: qty, available: Math.max(0, newAvailable),
      } as any).eq("id", editing.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Book updated");
    } else {
      const { error } = await supabase.from("books").insert({
        title: form.title, author: form.author, category: form.category,
        isbn: form.isbn, quantity: qty, available: qty,
      } as any);
      if (error) { toast.error("Failed to add"); return; }
      toast.success("Book added");
    }
    await refreshBooks();
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("books").delete().eq("id", id);
    toast.success("Book deleted");
    await refreshBooks();
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Books</h1>
          <p>Browse and manage the book catalog</p>
        </div>
        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Book
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Book" : "Add New Book"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Author</Label>
                  <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>ISBN</Label>
                    <Input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="mt-1" />
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editing ? "Update Book" : "Add Book"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by title, author, or category..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Category</th>
              <th>ISBN</th>
              <th>Qty</th>
              <th>Available</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((book) => (
              <tr key={book.id}>
                <td className="font-medium">{book.title}</td>
                <td>{book.author}</td>
                <td>{book.category}</td>
                <td className="font-mono text-xs">{book.isbn}</td>
                <td>{book.quantity}</td>
                <td>
                  <span className={book.available === 0 ? "text-destructive font-semibold" : "text-success font-semibold"}>
                    {book.available}
                  </span>
                </td>
                {canManage && (
                  <td>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(book)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(book.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={canManage ? 7 : 6} className="text-center text-muted-foreground py-8">
                  No books found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
