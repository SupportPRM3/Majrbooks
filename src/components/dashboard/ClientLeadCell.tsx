import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "lucide-react";

interface ClientLeadCellProps {
  clientId: string;
  currentLead: string | null;
  teamMembers: string[];
  onLeadChange: (clientId: string, newLead: string) => void;
}

export const ClientLeadCell = ({ clientId, currentLead, teamMembers, onLeadChange }: ClientLeadCellProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLeadChange = async (newLead: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({ lead_accountant: newLead === "unassigned" ? null : newLead })
        .eq("id", clientId);

      if (error) throw error;

      onLeadChange(clientId, newLead);
      toast.success("Lead accountant updated");
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead accountant");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select
      value={currentLead || "unassigned"}
      onValueChange={handleLeadChange}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-[140px] h-8 text-sm border-0 bg-transparent hover:bg-accent focus:ring-0">
        <SelectValue placeholder="Assign lead">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="truncate">{currentLead || "Unassigned"}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-popover z-50">
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {teamMembers.map((member) => (
          <SelectItem key={member} value={member}>
            {member}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
