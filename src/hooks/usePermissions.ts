import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ModulePermission {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface UserPermissions {
  role: 'admin' | 'accountant' | 'employee';
  can_edit: boolean;
  modules: Record<string, ModulePermission>;
}

export const AVAILABLE_MODULES = [
  { id: 'bookkeeping', name: 'Bookkeeping', description: 'Transactions, reconciliation, chart of accounts' },
  { id: 'invoices', name: 'Invoices', description: 'Create and manage invoices' },
  { id: 'payroll', name: 'Payroll', description: 'Employee payroll management' },
  { id: 'tax', name: 'Tax Tools', description: 'Tax returns and preparation' },
  { id: 'reports', name: 'Reports', description: 'Financial reports and analytics' },
  { id: 'crm', name: 'CRM', description: 'Client management' },
  { id: 'billing', name: 'Billing', description: 'Subscription and billing settings' },
  { id: 'settings', name: 'Settings', description: 'System configuration' },
  { id: 'team', name: 'Team', description: 'Team member management' },
] as const;

export const DEFAULT_PERMISSIONS: Record<string, Record<string, ModulePermission>> = {
  admin: Object.fromEntries(
    AVAILABLE_MODULES.map(m => [m.id, { can_view: true, can_edit: true, can_delete: true }])
  ),
  accountant: {
    bookkeeping: { can_view: true, can_edit: true, can_delete: false },
    invoices: { can_view: true, can_edit: true, can_delete: false },
    payroll: { can_view: true, can_edit: false, can_delete: false },
    tax: { can_view: true, can_edit: true, can_delete: false },
    reports: { can_view: true, can_edit: false, can_delete: false },
    crm: { can_view: true, can_edit: true, can_delete: false },
    billing: { can_view: false, can_edit: false, can_delete: false },
    settings: { can_view: false, can_edit: false, can_delete: false },
    team: { can_view: false, can_edit: false, can_delete: false },
  },
  employee: {
    bookkeeping: { can_view: true, can_edit: false, can_delete: false },
    invoices: { can_view: true, can_edit: false, can_delete: false },
    payroll: { can_view: false, can_edit: false, can_delete: false },
    tax: { can_view: false, can_edit: false, can_delete: false },
    reports: { can_view: true, can_edit: false, can_delete: false },
    crm: { can_view: true, can_edit: false, can_delete: false },
    billing: { can_view: false, can_edit: false, can_delete: false },
    settings: { can_view: false, can_edit: false, can_delete: false },
    team: { can_view: false, can_edit: false, can_delete: false },
  },
};

export const usePermissions = () => {
  const { user, isAdmin } = useAuth();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async (): Promise<UserPermissions | null> => {
      if (!user) return null;

      // Check if user is an owner (has their own team members)
      const { data: ownedTeam } = await supabase
        .from('team_members')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      // If user owns team members, they're an admin
      if (ownedTeam && ownedTeam.length > 0 || isAdmin) {
        return {
          role: 'admin',
          can_edit: true,
          modules: DEFAULT_PERMISSIONS.admin,
        };
      }

      // Check if user is a team member
      const { data: teamMember } = await supabase
        .from('team_members')
        .select(`
          role,
          can_edit,
          module_access (
            module_name,
            can_view,
            can_edit,
            can_delete
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!teamMember) {
        // Default to admin if no team member record (owner)
        return {
          role: 'admin',
          can_edit: true,
          modules: DEFAULT_PERMISSIONS.admin,
        };
      }

      const modules: Record<string, ModulePermission> = {};
      if (teamMember.module_access) {
        for (const access of teamMember.module_access) {
          modules[access.module_name] = {
            can_view: access.can_view,
            can_edit: access.can_edit,
            can_delete: access.can_delete,
          };
        }
      }

      return {
        role: teamMember.role as 'admin' | 'accountant' | 'employee',
        can_edit: teamMember.can_edit,
        modules: Object.keys(modules).length > 0 ? modules : DEFAULT_PERMISSIONS[teamMember.role],
      };
    },
    enabled: !!user,
  });

  const hasModuleAccess = (moduleId: string, action: 'view' | 'edit' | 'delete' = 'view'): boolean => {
    if (!permissions) return false;
    if (permissions.role === 'admin') return true;

    const modulePerms = permissions.modules[moduleId];
    if (!modulePerms) return false;

    switch (action) {
      case 'view': return modulePerms.can_view;
      case 'edit': return modulePerms.can_edit;
      case 'delete': return modulePerms.can_delete;
      default: return false;
    }
  };

  return {
    permissions,
    isLoading,
    hasModuleAccess,
    isOwner: permissions?.role === 'admin',
    isAccountant: permissions?.role === 'accountant',
    isEmployee: permissions?.role === 'employee',
  };
};
