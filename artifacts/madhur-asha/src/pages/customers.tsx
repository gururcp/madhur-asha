import { useState } from "react";
import { Link } from "wouter";
import { useListCustomers, useCreateCustomer } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Building2, Search, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function CustomersPage() {
  const { data: customers, isLoading, refetch } = useListCustomers();
  const [search, setSearch] = useState("");
  
  // Create Dialog State
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your clients and view their calculation history.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="rounded-xl shadow-lg">
          <Plus className="w-5 h-5 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card className="bg-card border-border/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search by name or GSTIN..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>
        
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
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filteredCustomers?.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No customers found.</td></tr>
              ) : (
                filteredCustomers?.map((customer) => (
                  <tr key={customer.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Building2 className="w-5 h-5" />
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>Enter the details for your new client.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Business Name *</label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Reliance Industries" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">GSTIN</label>
            <Input value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} placeholder="27XXXXX0000X1Z5" className="font-mono uppercase" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Contact Info</label>
            <Input value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="Phone or Email" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Address</label>
            <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full address" />
          </div>
          <Button onClick={handleCreate} isLoading={createMutation.isPending} disabled={!formData.name} className="w-full mt-4">
            Create Customer
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
