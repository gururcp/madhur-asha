import { useState } from "react";
import { useListUsers, useApproveUser, useRejectUser, useListCustomers } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ShieldCheck, XCircle, CheckCircle2, Users } from "lucide-react";

export default function AdminUsersPage() {
  const { data: users, refetch } = useListUsers();
  const { data: customers } = useListCustomers();

  const approveMutation = useApproveUser();
  const rejectMutation = useRejectUser();

  const [approveDialog, setApproveDialog] = useState<{ open: boolean; userId: number | null }>({ open: false, userId: null });
  const [role, setRole] = useState<"admin" | "customer_access" | "calc_only">("calc_only");
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);

  const handleApprove = () => {
    if (!approveDialog.userId) return;
    approveMutation.mutate(
      { id: approveDialog.userId, data: { role, assignedCustomerIds: role === 'customer_access' ? selectedCustomers : [] } },
      { onSuccess: () => { setApproveDialog({ open: false, userId: null }); refetch(); } }
    );
  };

  const handleReject = (userId: number) => {
    if (confirm("Are you sure you want to reject this user?")) {
      rejectMutation.mutate({ id: userId }, { onSuccess: () => refetch() });
    }
  };

  const openApprove = (userId: number) => {
    setRole("calc_only");
    setSelectedCustomers([]);
    setApproveDialog({ open: true, userId });
  };

  const pendingUsers = users?.filter(u => u.status === 'pending') || [];
  const otherUsers = users?.filter(u => u.status !== 'pending') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Access Management</h1>
        <p className="text-muted-foreground text-sm">Approve new users and manage their access levels.</p>
      </div>

      {/* Pending Section */}
      {pendingUsers.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-amber-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Pending Approval ({pendingUsers.length})
          </h2>
          {pendingUsers.map(user => (
            <Card key={user.id} className="p-4 border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center gap-3 mb-3">
                <img src={user.picture || ''} alt="" className="w-10 h-10 rounded-full bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">{format(new Date(user.createdAt), 'dd MMM yy')}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50 bg-transparent border" onClick={() => openApprove(user.id)}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleReject(user.id)}>
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* All Users */}
      <div>
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> All Users ({users?.length || 0})
        </h2>

        {/* Desktop Table */}
        <div className="hidden md:block bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30">
                  <th className="p-4 font-semibold text-sm text-muted-foreground">User</th>
                  <th className="p-4 font-semibold text-sm text-muted-foreground">Role</th>
                  <th className="p-4 font-semibold text-sm text-muted-foreground">Status</th>
                  <th className="p-4 font-semibold text-sm text-muted-foreground">Joined</th>
                  <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={user.picture || ''} alt="" className="w-10 h-10 rounded-full bg-muted" />
                        <div>
                          <div className="font-bold text-foreground">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="capitalize">{user.role.replace('_', ' ')}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.status === 'approved' ? 'success' : user.status === 'rejected' ? 'destructive' : 'warning'} className="capitalize">
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{format(new Date(user.createdAt), 'dd MMM yyyy')}</td>
                    <td className="p-4 text-right">
                      {user.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="border-emerald-500 text-emerald-600 hover:bg-emerald-50" onClick={() => openApprove(user.id)}>
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleReject(user.id)}>
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                      {user.status === 'approved' && (
                        <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => openApprove(user.id)}>
                          <ShieldCheck className="w-4 h-4 mr-1" /> Edit Access
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards — approved/rejected users */}
        <div className="md:hidden space-y-3">
          {otherUsers.map(user => (
            <Card key={user.id} className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <img src={user.picture || ''} alt="" className="w-10 h-10 rounded-full bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2">
                  <Badge variant="outline" className="capitalize text-xs">{user.role.replace('_', ' ')}</Badge>
                  <Badge variant={user.status === 'approved' ? 'success' : user.status === 'rejected' ? 'destructive' : 'warning'} className="capitalize text-xs">
                    {user.status}
                  </Badge>
                </div>
                {user.status === 'approved' && (
                  <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => openApprove(user.id)}>
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Approve/Edit Dialog */}
      <Dialog open={approveDialog.open} onOpenChange={(open) => !open && setApproveDialog({ open: false, userId: null })}>
        <DialogHeader>
          <DialogTitle>Set User Access</DialogTitle>
          <DialogDescription>Define what this user is allowed to do in the portal.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-semibold">Access Role</label>
            <div className="grid gap-2">
              {[
                { value: 'calc_only', label: 'Calculator Only', desc: 'Can use the calculator. Cannot save or view history.' },
                { value: 'customer_access', label: 'Customer Access', desc: 'Can save calculations and view history for assigned customers.' },
                { value: 'admin', label: 'Full Admin', desc: 'Has access to everything, including this admin panel.' },
              ].map(opt => (
                <label key={opt.value} className={`border-2 p-3 rounded-xl cursor-pointer transition-all ${role === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                  <div className="flex items-center mb-0.5">
                    <input type="radio" name="role" value={opt.value} checked={role === opt.value} onChange={() => setRole(opt.value as any)} className="mr-2.5" />
                    <span className="font-bold text-sm">{opt.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-5">{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {role === 'customer_access' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-semibold">Assign Customers</label>
              <div className="max-h-40 overflow-y-auto border-2 border-border rounded-xl p-2 space-y-1 bg-muted/10">
                {customers?.map(c => (
                  <label key={c.id} className="flex items-center p-2 rounded hover:bg-card cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-3 rounded w-4 h-4 text-primary"
                      checked={selectedCustomers.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedCustomers([...selectedCustomers, c.id]);
                        else setSelectedCustomers(selectedCustomers.filter(id => id !== c.id));
                      }}
                    />
                    <span className="font-medium text-sm">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleApprove} isLoading={approveMutation.isPending} className="w-full h-12 text-base">
            Save Access Settings
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
