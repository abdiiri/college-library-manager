import { useState } from "react";
import { useLibrary, Member } from "@/context/LibraryContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export default function MembersPage() {
  const { members, setMembers } = useLibrary();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", memberId: "", type: "student" as "student" | "staff" });

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.memberId.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", memberId: "", type: "student" });
    setDialogOpen(true);
  };

  const openEdit = (member: Member) => {
    setEditing(member);
    setForm({ name: member.name, email: member.email, phone: member.phone, memberId: member.memberId, type: member.type });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.memberId) {
      toast.error("Name and Member ID are required");
      return;
    }

    if (editing) {
      setMembers((prev) =>
        prev.map((m) => (m.id === editing.id ? { ...m, ...form } : m))
      );
      toast.success("Member updated");
    } else {
      const newMember: Member = {
        id: String(Date.now()),
        ...form,
        active: true,
      };
      setMembers((prev) => [...prev, newMember]);
      toast.success("Member registered");
    }
    setDialogOpen(false);
  };

  const toggleActive = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  };

  const handleDelete = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    toast.success("Member deleted");
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Members</h1>
          <p>Manage library members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Register Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Member" : "Register New Member"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Member ID</Label>
                <Input value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className="mt-1" placeholder="e.g. STU004" />
              </div>
              <div>
                <Label>Full Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "student" | "staff" })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full">
                {editing ? "Update Member" : "Register Member"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Member ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id}>
                <td className="font-mono text-xs">{m.memberId}</td>
                <td className="font-medium">{m.name}</td>
                <td>{m.email}</td>
                <td>{m.phone}</td>
                <td className="capitalize">{m.type}</td>
                <td>
                  <button onClick={() => toggleActive(m.id)} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${m.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {m.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
