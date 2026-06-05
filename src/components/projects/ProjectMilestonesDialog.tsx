import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2, Target, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  due_date: string | null;
  status: string;
  completed_at: string | null;
}

interface ProjectMilestonesDialogProps {
  projectId: string | null;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectMilestonesDialog({
  projectId,
  projectName,
  open,
  onOpenChange,
}: ProjectMilestonesDialogProps) {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    name: "",
    description: "",
    due_date: "",
  });

  useEffect(() => {
    if (open && projectId) {
      fetchMilestones();
    }
  }, [open, projectId]);

  const fetchMilestones = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("due_date", { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error("Error fetching milestones:", error);
    }
  };

  const addMilestone = async () => {
    if (!projectId || !user || !newMilestone.name) return;
    setLoading(true);

    try {
      const { error } = await supabase.from("project_milestones").insert({
        project_id: projectId,
        user_id: user.id,
        name: newMilestone.name,
        description: newMilestone.description || null,
        due_date: newMilestone.due_date || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Milestone added");
      setNewMilestone({ name: "", description: "", due_date: "" });
      setShowForm(false);
      fetchMilestones();
    } catch (error) {
      console.error("Error adding milestone:", error);
      toast.error("Failed to add milestone");
    } finally {
      setLoading(false);
    }
  };

  const toggleMilestoneStatus = async (milestone: Milestone) => {
    const newStatus = milestone.status === "completed" ? "pending" : "completed";

    try {
      const { error } = await supabase
        .from("project_milestones")
        .update({
          status: newStatus,
          completed_at: newStatus === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", milestone.id);

      if (error) throw error;
      fetchMilestones();
    } catch (error) {
      console.error("Error updating milestone:", error);
      toast.error("Failed to update milestone");
    }
  };

  const deleteMilestone = async (id: string) => {
    try {
      const { error } = await supabase
        .from("project_milestones")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Milestone deleted");
      fetchMilestones();
    } catch (error) {
      console.error("Error deleting milestone:", error);
      toast.error("Failed to delete milestone");
    }
  };

  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const progress = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Milestones - {projectName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{completedCount}/{milestones.length} completed</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Add milestone button/form */}
          {!showForm ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          ) : (
            <div className="border rounded-lg p-4 space-y-3">
              <Input
                placeholder="Milestone name"
                value={newMilestone.name}
                onChange={(e) =>
                  setNewMilestone({ ...newMilestone, name: e.target.value })
                }
              />
              <Textarea
                placeholder="Description (optional)"
                value={newMilestone.description}
                onChange={(e) =>
                  setNewMilestone({ ...newMilestone, description: e.target.value })
                }
              />
              <Input
                type="date"
                value={newMilestone.due_date}
                onChange={(e) =>
                  setNewMilestone({ ...newMilestone, due_date: e.target.value })
                }
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addMilestone}
                  disabled={!newMilestone.name || loading}
                  className="flex-1"
                >
                  Add
                </Button>
              </div>
            </div>
          )}

          {/* Milestones list */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No milestones yet
              </p>
            ) : (
              milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg ${
                    milestone.status === "completed" ? "bg-muted/50" : ""
                  }`}
                >
                  <Checkbox
                    checked={milestone.status === "completed"}
                    onCheckedChange={() => toggleMilestoneStatus(milestone)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium ${
                        milestone.status === "completed"
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {milestone.name}
                    </p>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {milestone.description}
                      </p>
                    )}
                    {milestone.due_date && (
                      <div className="flex items-center gap-1 mt-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(milestone.due_date), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        milestone.status === "completed" ? "default" : "secondary"
                      }
                    >
                      {milestone.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMilestone(milestone.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
