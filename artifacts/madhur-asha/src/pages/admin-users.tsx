import { useState } from "react";
import { useListUsers, useApproveUser, useRejectUser, useListCustomers } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ShieldCheck, XCircle, CheckCircle2 } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Access Management</h1>
        <p className="text-muted-foreground">Approve new users and manage their access levels.</p>
      </div>

      <Card className="overflow-hidden border-border/50">
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
                    <Badge variant="outline" className="capitalize">
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={user.status === 'approved' ? 'success' : user.status === 'rejected' ? 'destructive' : 'warning'} className="capitalize">
                      {user.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {format(new Date(user.createdAt), 'dd MMM yyyy')}
                  </td>
                  <td className="p-4 text-right">
                    {user.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="border-emerald-500 text-emerald-600 hover:bg-emerald-50" onClick={() => setApproveDialog({ open: true, userId: user.id })}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleReject(user.id)}>
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                    {user.status === 'approved' && (
                      <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setApproveDialog({ open: true, userId: user.id })}>
                        <ShieldCheck className="w-4 h-4 mr-1" /> Edit Access
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={approveDialog.open} onOpenChange={(open) => !open && setApproveDialog({ open: false, userId: null })}>
        <DialogHeader>
          <DialogTitle>Set User Access</DialogTitle>
          <DialogDescription>Define what this user is allowed to do in the portal.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <label className="text-sm font-semibold">Access Role</label>
            <div className="grid gap-3">
              <label className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${role === 'calc_only' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <div className="flex items-center mb-1">
                  <input type="radio" name="role" value="calc_only" checked={role === 'calc_only'} onChange={() => setRole('calc_only')} className="mr-3" />
                  <span className="font-bold">Calculator Only</span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">Can only use the calculator. Cannot view or save history.</p>
              </label>

              <label className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${role === 'customer_access' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <div className="flex items-center mb-1">
                  <input type="radio" name="role" value="customer_access" checked={role === 'customer_access'} onChange={() => setRole('customer_access')} className="mr-3" />
                  <span className="font-bold">Customer Access</span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">Can save calculations and view history for assigned customers.</p>
              </label>

              <label className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${role === 'admin' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <div className="flex items-center mb-1">
                  <input type="radio" name="role" value="admin" checked={role === 'admin'} onChange={() => setRole('admin')} className="mr-3" />
                  <span className="font-bold">Full Admin</span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">Has access to everything, including this admin panel.</p>
              </label>
            </div>
          </div>

          {role === 'customer_access' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-semibold">Assign Customers</label>
              <div className="max-h-48 overflow-y-auto border-2 border-border rounded-xl p-2 space-y-1 bg-muted/10">
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
                    <span className="font-medium">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleApprove} isLoading={approveMutation.isPending} className="w-full h-12 text-lg">
            Save Access Settings
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
