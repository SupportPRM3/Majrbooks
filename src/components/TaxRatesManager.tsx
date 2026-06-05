import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Percent } from "lucide-react";
import { z } from "zod";

const taxRateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  rate: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, "Rate must be between 0 and 100"),
  description: z.string().max(500).optional(),
});

export const TaxRatesManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    rate: "",
    description: "",
  });

  const { data: taxRates, refetch } = useQuery({
    queryKey: ["tax_rates", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("tax_rates")
        .select("*")
        .eq("user_id", user.id)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const handleOpenDialog = (rate?: any) => {
    if (rate) {
      setEditingRate(rate);
      setFormData({
        name: rate.name,
        rate: rate.rate.toString(),
        description: rate.description || "",
      });
    } else {
      setEditingRate(null);
      setFormData({ name: "", rate: "", description: "" });
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;

    try {
      const validated = taxRateSchema.parse(formData);
      setLoading(true);

      if (editingRate) {
        const { error } = await supabase
          .from("tax_rates")
          .update({
            name: validated.name,
            rate: parseFloat(validated.rate),
            description: validated.description || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingRate.id)
          .eq("user_id", user.id);

        if (error) throw error;

        toast({
          title: "Tax Rate Updated",
          description: `${validated.name} has been updated successfully.`,
        });
      } else {
        const { error } = await supabase.from("tax_rates").insert({
          user_id: user.id,
          name: validated.name,
          rate: parseFloat(validated.rate),
          description: validated.description || null,
        });

        if (error) throw error;

        toast({
          title: "Tax Rate Created",
          description: `${validated.name} has been created successfully.`,
        });
      }

      setOpen(false);
      setFormData({ name: "", rate: "", description: "" });
      refetch();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error("Error saving tax rate:", error);
        toast({
          title: "Error",
          description: "Failed to save tax rate. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (rate: any) => {
    try {
      const { error } = await supabase
        .from("tax_rates")
        .update({ is_active: !rate.is_active })
        .eq("id", rate.id)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: rate.is_active ? "Tax Rate Deactivated" : "Tax Rate Activated",
        description: `${rate.name} has been ${rate.is_active ? "deactivated" : "activated"}.`,
      });

      refetch();
    } catch (error) {
      console.error("Error toggling tax rate:", error);
      toast({
        title: "Error",
        description: "Failed to update tax rate status.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (rate: any) => {
    if (!confirm(`Are you sure you want to delete ${rate.name}?`)) return;

    try {
      const { error } = await supabase
        .from("tax_rates")
        .delete()
        .eq("id", rate.id)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Tax Rate Deleted",
        description: `${rate.name} has been deleted.`,
      });

      refetch();
    } catch (error) {
      console.error("Error deleting tax rate:", error);
      toast({
        title: "Error",
        description: "Failed to delete tax rate. It may be in use by existing invoices.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sales Tax Rates</CardTitle>
            <CardDescription>
              Manage your sales tax rates for invoices
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tax Rate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRate ? "Edit Tax Rate" : "Add Tax Rate"}
                </DialogTitle>
                <DialogDescription>
                  Configure a sales tax rate for your invoices
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Tax Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., State Sales Tax, VAT"
                    required
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">
                    Tax Rate (%) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.rate}
                      onChange={(e) =>
                        setFormData({ ...formData, rate: e.target.value })
                      }
                      placeholder="0.00"
                      className="pr-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Optional description"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingRate ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!taxRates || taxRates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tax rates configured yet.</p>
            <p className="text-sm mt-2">
              Add your first tax rate to enable sales tax on invoices.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium">{rate.name}</TableCell>
                  <TableCell>{rate.rate}%</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {rate.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={rate.is_active ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => handleToggleActive(rate)}
                    >
                      {rate.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(rate)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rate)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
