import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, UserPlus } from "lucide-react";
import { AVAILABLE_MODULES, DEFAULT_PERMISSIONS } from "@/hooks/usePermissions";

interface InviteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PermissionLevel = 'admin' | 'accountant' | 'employee';

interface ModuleAccess {
  can_view: boolean;
  can_edit: boolean;
}

const InviteEmployeeDialog = ({ open, onOpenChange }: InviteEmployeeDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "employee" as PermissionLevel,
    canEdit: false,
  });

  const [moduleAccess, setModuleAccess] = useState<Record<string, ModuleAccess>>(() => {
    const initial: Record<string, ModuleAccess> = {};
    AVAILABLE_MODULES.forEach(m => {
      const defaults = DEFAULT_PERMISSIONS.employee[m.id];
      initial[m.id] = { 
        can_view: defaults?.can_view ?? false, 
        can_edit: defaults?.can_edit ?? false 
      };
    });
    return initial;
  });

  const updateModuleAccessForRole = (role: PermissionLevel) => {
    const newAccess: Record<string, ModuleAccess> = {};
    AVAILABLE_MODULES.forEach(m => {
      const defaults = DEFAULT_PERMISSIONS[role][m.id];
      newAccess[m.id] = { 
        can_view: defaults?.can_view ?? false, 
        can_edit: defaults?.can_edit ?? false 
      };
    });
    setModuleAccess(newAccess);
  };

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Get user profile for inviter name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, business_name')
        .eq('id', user.id)
        .single();

      // Create team member
      const { data: teamMember, error: createError } = await supabase
        .from('team_members')
        .insert({
          owner_id: user.id,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
          can_edit: formData.canEdit,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Create module access records
      const moduleAccessRecords = Object.entries(moduleAccess).map(([moduleName, access]) => ({
        team_member_id: teamMember.id,
        module_name: moduleName,
        can_view: access.can_view,
        can_edit: access.can_edit,
        can_delete: formData.role === 'admin',
      }));

      const { error: accessError } = await supabase
        .from('module_access')
        .insert(moduleAccessRecords);

      if (accessError) throw accessError;

      // Send invite email via edge function
      const { error: inviteError } = await supabase.functions.invoke('send-team-invite', {
        body: {
          teamMemberId: teamMember.id,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          inviterName: profile?.full_name || 'Team Admin',
          businessName: profile?.business_name || 'MAJR Books',
        },
      });

      if (inviteError) {
        console.error("Error sending invite:", inviteError);
        // Don't throw - team member was created successfully
      }

      return teamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${formData.email}`,
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to send invitation",
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "employee",
      canEdit: false,
    });
    updateModuleAccessForRole("employee");
  };

  const handleRoleChange = (role: PermissionLevel) => {
    setFormData({ ...formData, role });
    updateModuleAccessForRole(role);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Add a new employee and assign their access permissions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); inviteMutation.mutate(); }} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(v) => handleRoleChange(v as PermissionLevel)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div>
                    <div className="font-medium">Admin</div>
                    <div className="text-xs text-muted-foreground">Full access to all features</div>
                  </div>
                </SelectItem>
                <SelectItem value="accountant">
                  <div>
                    <div className="font-medium">Accountant</div>
                    <div className="text-xs text-muted-foreground">Bookkeeping, invoices, tax tools</div>
                  </div>
                </SelectItem>
                <SelectItem value="employee">
                  <div>
                    <div className="font-medium">Employee</div>
                    <div className="text-xs text-muted-foreground">Limited access based on permissions</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role === 'employee' && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="canEdit">Allow Edit Access</Label>
                <p className="text-sm text-muted-foreground">
                  Enable to allow editing in permitted modules
                </p>
              </div>
              <Switch
                id="canEdit"
                checked={formData.canEdit}
                onCheckedChange={(checked) => setFormData({ ...formData, canEdit: checked })}
              />
            </div>
          )}

          <div className="space-y-3">
            <Label>Module Access</Label>
            <div className="border rounded-lg divide-y">
              {AVAILABLE_MODULES.map((module) => (
                <div key={module.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-medium text-sm">{module.name}</p>
                    <p className="text-xs text-muted-foreground">{module.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`${module.id}-view`} className="text-xs">View</Label>
                      <Switch
                        id={`${module.id}-view`}
                        checked={moduleAccess[module.id]?.can_view ?? false}
                        onCheckedChange={(checked) => 
                          setModuleAccess({
                            ...moduleAccess,
                            [module.id]: { ...moduleAccess[module.id], can_view: checked }
                          })
                        }
                        disabled={formData.role === 'admin'}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`${module.id}-edit`} className="text-xs">Edit</Label>
                      <Switch
                        id={`${module.id}-edit`}
                        checked={moduleAccess[module.id]?.can_edit ?? false}
                        onCheckedChange={(checked) => 
                          setModuleAccess({
                            ...moduleAccess,
                            [module.id]: { ...moduleAccess[module.id], can_edit: checked }
                          })
                        }
                        disabled={formData.role === 'admin'}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteEmployeeDialog;
