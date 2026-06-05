import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Settings } from "lucide-react";
import { AVAILABLE_MODULES, DEFAULT_PERMISSIONS } from "@/hooks/usePermissions";

interface EditTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMemberId: string | null;
}

type PermissionLevel = 'admin' | 'accountant' | 'employee';

interface ModuleAccess {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const EditTeamMemberDialog = ({ open, onOpenChange, teamMemberId }: EditTeamMemberDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "employee" as PermissionLevel,
    canEdit: false,
  });

  const [moduleAccess, setModuleAccess] = useState<Record<string, ModuleAccess>>({});

  // Fetch team member data
  const { data: teamMember, isLoading } = useQuery({
    queryKey: ['team-member', teamMemberId],
    queryFn: async () => {
      if (!teamMemberId) return null;
      
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          module_access (*)
        `)
        .eq('id', teamMemberId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!teamMemberId && open,
  });

  // Update form when team member data is loaded
  useEffect(() => {
    if (teamMember) {
      setFormData({
        firstName: teamMember.first_name,
        lastName: teamMember.last_name,
        email: teamMember.email,
        role: teamMember.role as PermissionLevel,
        canEdit: teamMember.can_edit,
      });

      const access: Record<string, ModuleAccess> = {};
      if (teamMember.module_access) {
        for (const ma of teamMember.module_access) {
          access[ma.module_name] = {
            can_view: ma.can_view,
            can_edit: ma.can_edit,
            can_delete: ma.can_delete,
          };
        }
      }
      
      // Fill in missing modules with defaults
      AVAILABLE_MODULES.forEach(m => {
        if (!access[m.id]) {
          const defaults = DEFAULT_PERMISSIONS[teamMember.role][m.id];
          access[m.id] = {
            can_view: defaults?.can_view ?? false,
            can_edit: defaults?.can_edit ?? false,
            can_delete: defaults?.can_delete ?? false,
          };
        }
      });
      
      setModuleAccess(access);
    }
  }, [teamMember]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!teamMemberId) throw new Error("No team member selected");

      // Update team member
      const { error: updateError } = await supabase
        .from('team_members')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
          can_edit: formData.canEdit,
        })
        .eq('id', teamMemberId);

      if (updateError) throw updateError;

      // Delete existing module access
      await supabase
        .from('module_access')
        .delete()
        .eq('team_member_id', teamMemberId);

      // Create new module access records
      const moduleAccessRecords = Object.entries(moduleAccess).map(([moduleName, access]) => ({
        team_member_id: teamMemberId,
        module_name: moduleName,
        can_view: access.can_view,
        can_edit: access.can_edit,
        can_delete: access.can_delete,
      }));

      const { error: accessError } = await supabase
        .from('module_access')
        .insert(moduleAccessRecords);

      if (accessError) throw accessError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-member', teamMemberId] });
      toast({
        title: "Team member updated",
        description: "Permissions have been updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to update",
        description: error.message,
      });
    },
  });

  const handleRoleChange = (role: PermissionLevel) => {
    setFormData({ ...formData, role });
    
    // Update module access based on role defaults
    const newAccess: Record<string, ModuleAccess> = {};
    AVAILABLE_MODULES.forEach(m => {
      const defaults = DEFAULT_PERMISSIONS[role][m.id];
      newAccess[m.id] = {
        can_view: defaults?.can_view ?? false,
        can_edit: defaults?.can_edit ?? false,
        can_delete: role === 'admin',
      };
    });
    setModuleAccess(newAccess);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Edit Team Member
          </DialogTitle>
          <DialogDescription>
            Update permissions and access settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(v) => handleRoleChange(v as PermissionLevel)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin (Full Access)</SelectItem>
                <SelectItem value="accountant">Accountant (Partial Access)</SelectItem>
                <SelectItem value="employee">Employee (Limited Access)</SelectItem>
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
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTeamMemberDialog;
