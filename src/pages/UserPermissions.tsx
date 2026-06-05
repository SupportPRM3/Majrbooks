import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Mail,
  UserX,
  UserCheck,
  Settings,
  Loader2,
  Users,
  Clock,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import InviteEmployeeDialog from "@/components/permissions/InviteEmployeeDialog";
import EditTeamMemberDialog from "@/components/permissions/EditTeamMemberDialog";
import AuditLogPanel from "@/components/permissions/AuditLogPanel";

const roleIcons: Record<string, React.ReactNode> = {
  admin: <ShieldCheck className="h-4 w-4 text-primary" />,
  accountant: <Shield className="h-4 w-4 text-blue-500" />,
  employee: <ShieldAlert className="h-4 w-4 text-muted-foreground" />,
};

const roleBadgeVariants: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  accountant: "secondary",
  employee: "outline",
};

const UserPermissions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [memberToDeactivate, setMemberToDeactivate] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);

  // Fetch team members
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Resend invite mutation
  const resendInviteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const member = teamMembers?.find(m => m.id === memberId);
      if (!member) throw new Error("Member not found");

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, business_name')
        .eq('id', user?.id)
        .single();

      await supabase.functions.invoke('send-team-invite', {
        body: {
          teamMemberId: member.id,
          email: member.email,
          firstName: member.first_name,
          lastName: member.last_name,
          role: member.role,
          inviterName: profile?.full_name || 'Team Admin',
          businessName: profile?.business_name || 'MAJR Books',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Invite resent",
        description: "A new invitation email has been sent",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to resend invite",
        description: error.message,
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ memberId, isActive }: { memberId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: isActive })
        .eq('id', memberId);

      if (error) throw error;

      // Log the action
      await supabase.from('audit_logs').insert({
        owner_id: user?.id,
        user_id: user?.id,
        team_member_id: memberId,
        action: isActive ? 'user_activated' : 'user_deactivated',
        entity_type: 'team_member',
        entity_id: memberId,
      });
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      toast({
        title: isActive ? "User activated" : "User deactivated",
        description: isActive 
          ? "The user can now access the system" 
          : "The user can no longer access the system",
      });
      setDeactivateDialogOpen(false);
      setMemberToDeactivate(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to update user",
        description: error.message,
      });
    },
  });

  // Delete team member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      // First delete related module_access records
      await supabase
        .from('module_access')
        .delete()
        .eq('team_member_id', memberId);

      // Then delete the team member
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Log the action
      await supabase.from('audit_logs').insert({
        owner_id: user?.id,
        user_id: user?.id,
        action: 'user_deleted',
        entity_type: 'team_member',
        entity_id: memberId,
        details: { deleted_member: memberToDelete?.email },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      toast({
        title: "Team member deleted",
        description: "The team member has been permanently removed",
      });
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to delete team member",
        description: error.message,
      });
    },
  });

  const filteredMembers = teamMembers?.filter(member =>
    `${member.first_name} ${member.last_name} ${member.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (member: any) => {
    if (!member.is_active) {
      return <Badge variant="destructive">Deactivated</Badge>;
    }
    if (member.invite_accepted_at) {
      return <Badge variant="default" className="bg-green-500">Active</Badge>;
    }
    if (member.invite_sent_at) {
      return <Badge variant="secondary">Pending Invite</Badge>;
    }
    return <Badge variant="outline">Not Invited</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Access & Permissions</h1>
            <p className="text-muted-foreground">
              Manage team members and their access levels
            </p>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Employee
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamMembers?.filter(m => m.role === 'admin').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accountants</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamMembers?.filter(m => m.role === 'accountant').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamMembers?.filter(m => m.invite_sent_at && !m.invite_accepted_at).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Team Members</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Team Members Table */}
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  View and manage all team members and their permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredMembers && filteredMembers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="w-[70px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.first_name} {member.last_name}
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {roleIcons[member.role]}
                              <Badge variant={roleBadgeVariants[member.role]}>
                                <span className="capitalize">{member.role}</span>
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(member)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(member.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedMemberId(member.id);
                                  setEditDialogOpen(true);
                                }}>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Edit Permissions
                                </DropdownMenuItem>
                                {!member.invite_accepted_at && (
                                  <DropdownMenuItem 
                                    onClick={() => resendInviteMutation.mutate(member.id)}
                                    disabled={resendInviteMutation.isPending}
                                  >
                                    <Mail className="mr-2 h-4 w-4" />
                                    Resend Invite
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {member.is_active ? (
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => {
                                      setMemberToDeactivate(member);
                                      setDeactivateDialogOpen(true);
                                    }}
                                  >
                                    <UserX className="mr-2 h-4 w-4" />
                                    Deactivate User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => toggleActiveMutation.mutate({ 
                                      memberId: member.id, 
                                      isActive: true 
                                    })}
                                  >
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activate User
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => {
                                    setMemberToDelete(member);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No team members yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Invite employees to give them access to the platform
                    </p>
                    <Button onClick={() => setInviteDialogOpen(true)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Employee
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <AuditLogPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <InviteEmployeeDialog 
        open={inviteDialogOpen} 
        onOpenChange={setInviteDialogOpen} 
      />
      
      <EditTeamMemberDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        teamMemberId={selectedMemberId}
      />

      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate{" "}
              <span className="font-medium">
                {memberToDeactivate?.first_name} {memberToDeactivate?.last_name}
              </span>
              ? They will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (memberToDeactivate) {
                  toggleActiveMutation.mutate({ 
                    memberId: memberToDeactivate.id, 
                    isActive: false 
                  });
                }
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <span className="font-medium">
                {memberToDelete?.first_name} {memberToDelete?.last_name}
              </span>
              ? This action cannot be undone and will remove all their access and permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (memberToDelete) {
                  deleteMemberMutation.mutate(memberToDelete.id);
                }
              }}
            >
              {deleteMemberMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default UserPermissions;
