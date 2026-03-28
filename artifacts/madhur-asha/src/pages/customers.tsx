import { useState } from "react";
import { Link } from "wouter";
import { useListCustomers, useCreateCustomer } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Building2, Search, ArrowRight, Hash, FileText } from "lucide-react";
import { format } from "date-fns";

export default function CustomersPage() {
  const { data: customers, isLoading, refetch } = useListCustomers();
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", gstin: "", address: "", contact: "" });
  const createMutation = useCreateCustomer();

  const filteredCustomers = customers?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.gstin && c.gstin.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = () => {
    if (!formData.name) return;
    createMutation.mutate({ data: formData }, {
      onSuccess: () => {
        setOpen(false);
        setFormData({ name: "", gstin: "", address: "", contact: "" });
        refetch();
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm">Manage your clients and view their history.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="rounded-xl shadow-lg w-full sm:w-auto">
          <Plus className="w-5 h-5 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or GSTIN..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-card"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredCustomers?.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/50">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
          No customers found.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="p-4 font-semibold text-sm text-muted-foreground">Name</th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground">GSTIN</th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground text-center">Calculations</th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Added On</th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers?.map((customer) => (
                    <tr key={customer.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-foreground">{customer.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-mono">{customer.gstin || '-'}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">
                          {customer.calculationCount}
                        </span>
                      </td>
                      <td className="p-4 text-right text-sm text-muted-foreground">
                        {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/customers/${customer.id}`}>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-5 h-5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredCustomers?.map((customer) => (
              <Link key={customer.id} href={`/customers/${customer.id}`}>
                <Card className="p-4 active:scale-[0.99] transition-transform cursor-pointer hover:border-primary/40">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{customer.name}</p>
                      {customer.gstin && (
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                          <Hash className="w-3 h-3 mr-1" />
                          <span className="font-mono">{customer.gstin}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end mb-1">
                        <FileText className="w-3 h-3" />
                        <span className="font-bold text-foreground">{customer.calculationCount}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{format(new Date(customer.createdAt), 'dd MMM yy')}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-1" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Add Customer Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>Enter the details for your new client.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Business Name *</label>
            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Reliance Industries" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">GSTIN</label>
            <Input value={formData.gstin} onChange={e => setFormData({ ...formData, gstin: e.target.value })} placeholder="27XXXXX0000X1Z5" className="font-mono uppercase" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Contact Info</label>
            <Input value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} placeholder="Phone or Email" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Address</label>
            <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Full address" />
          </div>
          <Button onClick={handleCreate} isLoading={createMutation.isPending} disabled={!formData.name} className="w-full mt-2">
            Create Customer
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
