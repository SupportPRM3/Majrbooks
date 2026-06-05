import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, X, Users } from "lucide-react";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface TeamMember {
  id: string;
  employee_id: string;
  role: string;
  employee: Employee;
}

interface ProjectTeamDialogProps {
  projectId: string | null;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProjectTeamDialog({
  projectId,
  projectName,
  open,
  onOpenChange,
  onSuccess,
}: ProjectTeamDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("member");

  useEffect(() => {
    if (open && projectId) {
      fetchTeamMembers();
      fetchEmployees();
    }
  }, [open, projectId]);

  const fetchTeamMembers = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from("project_team_members")
        .select(`
          id,
          employee_id,
          role,
          employee:employees(id, first_name, last_name)
        `)
        .eq("project_id", projectId);

      if (error) throw error;
      setTeamMembers(data as unknown as TeamMember[]);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const fetchEmployees = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const addTeamMember = async () => {
    if (!projectId || !selectedEmployee || !user) return;
    setLoading(true);

    try {
      const { error } = await supabase.from("project_team_members").insert({
        project_id: projectId,
        employee_id: selectedEmployee,
        role: selectedRole,
        user_id: user.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("This employee is already on the team");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Team member added");
      setSelectedEmployee("");
      setSelectedRole("member");
      fetchTeamMembers();
      updateProjectTeamSize();
    } catch (error) {
      console.error("Error adding team member:", error);
      toast.error("Failed to add team member");
    } finally {
      setLoading(false);
    }
  };

  const removeTeamMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("project_team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Team member removed");
      fetchTeamMembers();
      updateProjectTeamSize();
    } catch (error) {
      console.error("Error removing team member:", error);
      toast.error("Failed to remove team member");
    }
  };

  const updateProjectTeamSize = async () => {
    if (!projectId) return;

    try {
      const { count } = await supabase
        .from("project_team_members")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      await supabase
        .from("projects")
        .update({ team_size: count || 0 })
        .eq("id", projectId);

      onSuccess();
    } catch (error) {
      console.error("Error updating team size:", error);
    }
  };

  const availableEmployees = employees.filter(
    (emp) => !teamMembers.some((tm) => tm.employee_id === emp.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team - {projectName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add member section */}
          <div className="flex gap-2">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {availableEmployees.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No available employees
                  </SelectItem>
                ) : (
                  availableEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="reviewer">Reviewer</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="icon"
              onClick={addTeamMember}
              disabled={!selectedEmployee || loading}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Team members list */}
          <div className="space-y-2">
            {teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No team members assigned yet
              </p>
            ) : (
              teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {member.employee?.first_name?.[0]}
                        {member.employee?.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {member.employee?.first_name} {member.employee?.last_name}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTeamMember(member.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
