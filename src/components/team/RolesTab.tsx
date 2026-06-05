import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, MoreHorizontal, Copy, Eye, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { AddRoleDialog } from "./AddRoleDialog";
import { ViewRoleDialog } from "./ViewRoleDialog";

interface Role {
  id: string;
  role_name: string;
  description: string | null;
  role_type: "client" | "firm";
  permissions: any;
  is_custom: boolean | null;
  updated_at: string;
  user_id: string;
}

// Predefined system roles matching the template
const PREDEFINED_FIRM_ROLES: Omit<Role, "user_id">[] = [
  {
    id: "predefined-bill-approver",
    role_name: "Bill approver",
    description: "Users with this role can only approve bills. They can not approve bill payments, pay bills or take any other action related to bills or payments.",
    role_type: "firm",
    permissions: { bills: { approve: true } },
    is_custom: false,
    updated_at: "2025-03-04",
  },
  {
    id: "predefined-bill-clerk",
    role_name: "Bill clerk",
    description: "Users with this role can add bills and mark bills as paid, but cannot approve or pay bills.",
    role_type: "firm",
    permissions: { bills: { add: true, markPaid: true } },
    is_custom: false,
    updated_at: "2025-03-04",
  },
  {
    id: "predefined-bill-payer",
    role_name: "Bill payer",
    description: "Users with this role can view and pay bills, and edit vendor info. They can not add bills, take any other action related to bills, or approve bill payments.",
    role_type: "firm",
    permissions: { bills: { view: true, pay: true }, vendors: { edit: true } },
    is_custom: false,
    updated_at: "2025-03-04",
  },
  {
    id: "predefined-company-admin",
    role_name: "Company admin",
    description: "Users with this role can see and do everything. This includes sending money, changing passwords, and adding users. Not everyone should be an admin.",
    role_type: "firm",
    permissions: { all: true },
    is_custom: false,
    updated_at: "2025-03-04",
  },
  {
    id: "predefined-payroll-manager",
    role_name: "Payroll manager",
    description: "Users with this role can manage employees, run payroll, and do other payroll tasks.",
    role_type: "firm",
    permissions: { payroll: { all: true }, employees: { all: true } },
    is_custom: false,
    updated_at: "2025-03-04",
  },
  {
    id: "predefined-standard-all-access",
    role_name: "Standard all access",
    description: "Users with this role get full access without admin privileges, plus access to Payroll.",
    role_type: "firm",
    permissions: { standard: true, payroll: { view: true } },
    is_custom: false,
    updated_at: "2025-03-04",
  },
  {
    id: "predefined-standard-all-access-no-bills",
    role_name: "Standard all access (can't pay bills)",
    description: "Users with this role get full access without admin privileges, but cannot pay bills",
    role_type: "firm",
    permissions: { standard: true, bills: { pay: false } },
    is_custom: false,
    updated_at: "2025-03-04",
  },
  {
    id: "predefined-standard-without-payroll",
    role_name: "Standard all access without payroll",
    description: "Users with this role get full access without admin privileges.",
    role_type: "firm",
    permissions: { standard: true, payroll: false },
    is_custom: false,
    updated_at: "2025-03-04",
  },
  {
    id: "predefined-standard-limited-customers",
    role_name: "Standard limited customers only",
    description: "Users with this role can see and do everything with Customers and Sales.",
    role_type: "firm",
    permissions: { customers: { all: true }, sales: { all: true } },
    is_custom: false,
    updated_at: "2025-03-04",
  },
  {
    id: "predefined-standard-limited-vendors",
    role_name: "Standard limited vendors only",
    description: "Users with this role can see and do everything with Vendors and Purchases.",
    role_type: "firm",
    permissions: { vendors: { all: true }, purchases: { all: true } },
    is_custom: false,
    updated_at: "2025-03-04",
  },
  {
    id: "predefined-view-company-reports",
    role_name: "View company reports",
    description: "Users with this role can see all reports except the ones that show payroll or contact info.",
    role_type: "firm",
    permissions: { reports: { view: true, payroll: false, contacts: false } },
    is_custom: false,
    updated_at: "2025-03-04",
  },
  {
    id: "predefined-expense-manager",
    role_name: "Expense manager",
    description: "Users with this role can manage expenses, approve expense reports, and set expense policies.",
    role_type: "firm",
    permissions: { expenses: { all: true } },
    is_custom: false,
    updated_at: "2025-03-04",
  },
  {
    id: "predefined-inventory-manager",
    role_name: "Inventory manager",
    description: "Users with this role can manage inventory, products, and stock levels.",
    role_type: "firm",
    permissions: { inventory: { all: true } },
    is_custom: false,
    updated_at: "2025-03-04",
  },
  {
    id: "predefined-sales-manager",
    role_name: "Sales manager",
    description: "Users with this role can manage sales, quotes, and customer relationships.",
    role_type: "firm",
    permissions: { sales: { all: true }, customers: { all: true } },
    is_custom: false,
    updated_at: "2025-03-04",
  },
];

const PREDEFINED_CLIENT_ROLES: Omit<Role, "user_id">[] = [
  {
    id: "predefined-client-admin",
    role_name: "Client admin",
    description: "Full access to all client features and settings.",
    role_type: "client",
    permissions: { all: true },
    is_custom: false,
    updated_at: "2025-03-04",
  },
  {
    id: "predefined-client-viewer",
    role_name: "Client viewer",
    description: "Can view all client data but cannot make changes.",
    role_type: "client",
    permissions: { view: true },
    is_custom: false,
    updated_at: "2025-03-04",
  },
  {
    id: "predefined-client-basic",
    role_name: "Client basic access",
    description: "Basic access to view invoices, statements, and make payments.",
    role_type: "client",
    permissions: { invoices: { view: true }, payments: { create: true } },
    is_custom: false,
    updated_at: "2025-03-04",
  },
];

export const RolesTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleType, setRoleType] = useState<"client" | "firm">("client");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [viewRole, setViewRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editData, setEditData] = useState({ role_name: "", description: "" });
  const [sortField, setSortField] = useState<"role_name" | "updated_at">("role_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const queryClient = useQueryClient();

  const { data: customRoles = [], isLoading } = useQuery({
    queryKey: ["user-roles", roleType],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("role_type", roleType)
        .eq("user_id", user.id)
        .eq("is_custom", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Role[];
    },
  });

  // Combine predefined roles with custom roles
  const predefinedRoles = roleType === "firm" ? PREDEFINED_FIRM_ROLES : PREDEFINED_CLIENT_ROLES;
  const allRoles = [...predefinedRoles.map(r => ({ ...r, user_id: "" })), ...customRoles];

  const copyRoleMutation = useMutation({
    mutationFn: async (role: Role) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role_name: `${role.role_name} (Copy)`,
          description: role.description,
          role_type: role.role_type,
          permissions: role.permissions,
          is_custom: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast.success("Role copied successfully");
    },
    onError: () => {
      toast.error("Failed to copy role");
    },
  });

  const editRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { role_name: string; description: string } }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({
          role_name: data.role_name,
          description: data.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast.success("Role updated successfully");
      setIsEditDialogOpen(false);
      setSelectedRole(null);
    },
    onError: () => {
      toast.error("Failed to update role");
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast.success("Role deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedRole(null);
    },
    onError: () => {
      toast.error("Failed to delete role");
    },
  });

  const handleEdit = (role: Role) => {
    if (!role.is_custom) {
      toast.error("System roles cannot be edited");
      return;
    }
    setSelectedRole(role);
    setEditData({
      role_name: role.role_name,
      description: role.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (role: Role) => {
    if (!role.is_custom) {
      toast.error("System roles cannot be deleted");
      return;
    }
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const handleSort = (field: "role_name" | "updated_at") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredRoles = allRoles
    .filter(role =>
      role.role_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = sortField === "role_name" ? a.role_name : a.updated_at;
      const bVal = sortField === "role_name" ? b.role_name : b.updated_at;
      const comparison = aVal.localeCompare(bVal);
      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <div className="space-y-6">
      <Tabs value={roleType} onValueChange={(value) => setRoleType(value as "client" | "firm")}>
        <TabsList>
          <TabsTrigger value="client">Client roles</TabsTrigger>
          <TabsTrigger value="firm">Firm roles</TabsTrigger>
        </TabsList>

        <TabsContent value={roleType} className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <a
                href="https://docs.lovable.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Learn about custom roles
              </a>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Add role
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading roles...</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("role_name")}
                    >
                      <div className="flex items-center gap-1">
                        role name
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        description
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("updated_at")}
                    >
                      <div className="flex items-center gap-1">
                        updated
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No roles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRoles?.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell 
                          className="font-medium text-primary cursor-pointer hover:underline"
                          onClick={() => setViewRole(role)}
                        >
                          {role.role_name}
                        </TableCell>
                        <TableCell className="max-w-xl text-muted-foreground">
                          {role.description}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {role.updated_at ? format(new Date(role.updated_at), "M/d/yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {role.is_custom ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyRoleMutation.mutate(role)}
                                className="text-primary hover:text-primary"
                              >
                                Make a copy
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewRole(role)}
                                className="text-primary hover:text-primary"
                              >
                                View
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover">
                                <DropdownMenuItem onClick={() => setViewRole(role)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => copyRoleMutation.mutate(role)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Make a Copy
                                </DropdownMenuItem>
                                {role.is_custom && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleEdit(role)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDelete(role)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AddRoleDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        roleType={roleType}
      />
      
      <ViewRoleDialog
        role={viewRole}
        onOpenChange={(open) => !open && setViewRole(null)}
      />

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_role_name">Role Name</Label>
              <Input
                id="edit_role_name"
                value={editData.role_name}
                onChange={(e) => setEditData({ ...editData, role_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedRole && editRoleMutation.mutate({ id: selectedRole.id, data: editData })}
              disabled={!editData.role_name || editRoleMutation.isPending}
            >
              {editRoleMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{selectedRole?.role_name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRole && deleteRoleMutation.mutate(selectedRole.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRoleMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
