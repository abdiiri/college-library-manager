import { useState } from "react";
import { useLibrary, Member } from "@/context/LibraryContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function MembersPage() {
  const { members, refreshMembers } = useLibrary();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", member_id: "", type: "student", password: "" });
  const [saving, setSaving] = useState(false);

  // Reset password state
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetMember, setResetMember] = useState<Member | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.member_id.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", member_id: "", type: "student", password: "" });
    setDialogOpen(true);
  };

  const openEdit = (member: Member) => {
    setEditing(member);
    setForm({ name: member.name, email: member.email, phone: member.phone, member_id: member.member_id, type: member.type, password: "" });
    setDialogOpen(true);
  };

  const openResetPassword = (member: Member) => {
    setResetMember(member);
    setNewPassword("");
    setResetDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetMember?.user_id) {
      toast.error("This member has no linked account");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setResetting(true);
    const { data, error } = await supabase.functions.invoke("reset-password", {
      body: { user_id: resetMember.user_id, new_password: newPassword },
    });

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Failed to reset password");
    } else {
      toast.success(`Password reset for ${resetMember.name}`);
      setResetDialogOpen(false);
    }
    setResetting(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.member_id) {
      toast.error("Name and Member ID are required");
      return;
    }

    setSaving(true);

    if (editing) {
      const { error } = await supabase.from("members").update({
        name: form.name, email: form.email, phone: form.phone,
        member_id: form.member_id, type: form.type,
      } as any).eq("id", editing.id);
      if (error) { toast.error("Failed to update"); setSaving(false); return; }
      toast.success("Member updated");
    } else {
      if (!form.email || !form.password) {
        toast.error("Email and password are required for new members");
        setSaving(false);
        return;
      }
      if (form.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        setSaving(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-student", {
        body: {
          email: form.email,
          password: form.password,
          full_name: form.name,
          member_id: form.member_id,
          phone: form.phone,
          type: form.type,
        },
      });

      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Failed to create account");
        setSaving(false);
        return;
      }
      toast.success("Member registered with login credentials");
    }
    await refreshMembers();
    setDialogOpen(false);
    setSaving(false);
  };

  const toggleActive = async (id: string) => {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    await supabase.from("members").update({ active: !member.active } as any).eq("id", id);
    await refreshMembers();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("members").delete().eq("id", id);
    toast.success("Member deleted");
    await refreshMembers();
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
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Member" : "Register New Member"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Member ID</Label>
                <Input value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })} className="mt-1" placeholder="e.g. STU004" />
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
              {!editing && (
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1" placeholder="Login password (min 6 chars)" minLength={6} required />
                </div>
              )}
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full" disabled={saving}>
                {saving ? "Please wait..." : editing ? "Update Member" : "Register Member"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Set a new password for <strong>{resetMember?.name}</strong> ({resetMember?.email})
            </p>
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
                placeholder="Min 6 characters"
                minLength={6}
              />
            </div>
            <Button onClick={handleResetPassword} className="w-full" disabled={resetting}>
              {resetting ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                <td className="font-mono text-xs">{m.member_id}</td>
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
                    {m.user_id && (
                      <Button variant="ghost" size="icon" onClick={() => openResetPassword(m)} title="Reset Password">
                        <KeyRound className="h-4 w-4" />
                      </Button>
                    )}
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
