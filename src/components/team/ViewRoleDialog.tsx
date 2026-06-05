import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ViewRoleDialogProps {
  role: any;
  onOpenChange: (open: boolean) => void;
}

export const ViewRoleDialog = ({ role, onOpenChange }: ViewRoleDialogProps) => {
  if (!role) return null;

  return (
    <Dialog open={!!role} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{role.role_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{role.description}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Role Type</h4>
            <p className="text-sm text-muted-foreground capitalize">{role.role_type}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Custom Role</h4>
            <p className="text-sm text-muted-foreground">{role.is_custom ? "Yes" : "No"}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
