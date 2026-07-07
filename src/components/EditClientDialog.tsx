import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const clientSchema = z.object({
  client_name: z.string().trim().min(1, "Client name is required").max(100),
  contact_name: z.string().trim().max(100).optional(),
  email: z.string().trim().email("Invalid email address").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional(),
  business_name: z.string().trim().max(100).optional(),
  address: z.string().trim().max(500).optional(),
  lead_accountant: z.string().trim().max(100).optional(),
  status: z.enum(["active", "inactive", "archived"]),
  notes: z.string().trim().max(1000).optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: {
    id: string;
    client_name: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    business_name: string | null;
    address: string | null;
    lead_accountant: string | null;
    status: string;
    notes: string | null;
  };
  onClientUpdated: () => void;
}

export const EditClientDialog = ({ open, onOpenChange, client, onClientUpdated }: EditClientDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      client_name: client.client_name,
      contact_name: client.contact_name || "",
      email: client.email || "",
      phone: client.phone || "",
      business_name: client.business_name || "",
      address: client.address || "",
      lead_accountant: client.lead_accountant || "",
      status: (client.status as "active" | "inactive" | "archived") || "active",
      notes: client.notes || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        client_name: client.client_name,
        contact_name: client.contact_name || "",
        email: client.email || "",
        phone: client.phone || "",
        business_name: client.business_name || "",
        address: client.address || "",
        lead_accountant: client.lead_accountant || "",
        status: (client.status as "active" | "inactive" | "archived") || "active",
        notes: client.notes || "",
      });
    }
  }, [open, client]);

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          client_name: data.client_name,
          contact_name: data.contact_name || null,
          email: data.email || null,
          phone: data.phone || null,
          business_name: data.business_name || null,
          address: data.address || null,
          lead_accountant: data.lead_accountant || null,
          status: data.status,
          notes: data.notes || null,
        })
        .eq("id", client.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client details updated successfully",
      });

      onOpenChange(false);
      onClientUpdated();
    } catch (error) {
      console.error("Error updating client:", error);
      toast({
        title: "Error",
        description: "Failed to update client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter client name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="client@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="business_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter business name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter full address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lead_accountant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Accountant</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter lead accountant name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any additional notes" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
