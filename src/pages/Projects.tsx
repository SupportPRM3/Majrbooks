import { useState, useEffect, useMemo } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Search,
  Filter,
  MoreVertical,
  Building2,
  Clock,
  DollarSign,
  Users,
  Edit,
  Trash2,
  Target,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AddProjectDialog } from "@/components/projects/AddProjectDialog";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import { ProjectTeamDialog } from "@/components/projects/ProjectTeamDialog";
import { ProjectMilestonesDialog } from "@/components/projects/ProjectMilestonesDialog";

interface Project {
  id: string;
  name: string;
  client_name: string;
  description?: string | null;
  status: string;
  budget: number;
  spent: number;
  billing_rate?: number | null;
  start_date?: string | null;
  due_date?: string | null;
  team_size: number;
}

const Projects = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [milestonesDialogOpen, setMilestonesDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.client_name.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "planning":
        return "bg-yellow-100 text-yellow-800";
      case "on_hold":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      case "planning":
        return "Planning";
      case "on_hold":
        return "On Hold";
      default:
        return status;
    }
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setEditDialogOpen(true);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  const handleTeam = (project: Project) => {
    setSelectedProject(project);
    setTeamDialogOpen(true);
  };

  const handleMilestones = (project: Project) => {
    setSelectedProject(project);
    setMilestonesDialogOpen(true);
  };

  // Calculate stats from actual data
  const stats = useMemo(() => {
    const activeProjects = projects.filter(
      (p) => p.status === "in_progress" || p.status === "planning"
    ).length;
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
    const totalTeamMembers = projects.reduce((sum, p) => sum + (p.team_size || 0), 0);

    return [
      {
        label: "Active Projects",
        value: activeProjects.toString(),
        icon: Building2,
        color: "text-blue-600",
      },
      {
        label: "Total Budget",
        value: `$${(totalBudget / 1000).toFixed(0)}K`,
        icon: DollarSign,
        color: "text-green-600",
      },
      {
        label: "Total Spent",
        value: `$${(totalSpent / 1000).toFixed(0)}K`,
        icon: Clock,
        color: "text-purple-600",
      },
      {
        label: "Team Members",
        value: totalTeamMembers.toString(),
        icon: Users,
        color: "text-orange-600",
      },
    ];
  }, [projects]);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all your client projects
            </p>
          </div>
          <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Projects</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading projects...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? "No projects match your search"
                  : "No projects yet. Create your first project!"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        {project.name}
                      </TableCell>
                      <TableCell>{project.client_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getStatusColor(project.status)}
                        >
                          {getStatusLabel(project.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>${project.budget.toLocaleString()}</TableCell>
                      <TableCell>${project.spent.toLocaleString()}</TableCell>
                      <TableCell>{project.due_date || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{project.team_size || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(project)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Project
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTeam(project)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Manage Team
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMilestones(project)}>
                              <Target className="h-4 w-4 mr-2" />
                              Milestones
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(project)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddProjectDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchProjects}
      />

      <EditProjectDialog
        project={selectedProject}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchProjects}
      />

      <DeleteProjectDialog
        projectId={selectedProject?.id || null}
        projectName={selectedProject?.name || ""}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={fetchProjects}
      />

      <ProjectTeamDialog
        projectId={selectedProject?.id || null}
        projectName={selectedProject?.name || ""}
        open={teamDialogOpen}
        onOpenChange={setTeamDialogOpen}
        onSuccess={fetchProjects}
      />

      <ProjectMilestonesDialog
        projectId={selectedProject?.id || null}
        projectName={selectedProject?.name || ""}
        open={milestonesDialogOpen}
        onOpenChange={setMilestonesDialogOpen}
      />
    </Layout>
  );
};

export default Projects;
