import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Zap, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface WorkflowTemplate {
  name: string;
  description: string;
  category: string;
  triggerType: string;
  actionType: string;
  defaultConfig?: {
    emailTo?: string;
    emailSubject?: string;
    emailBody?: string;
  };
}

interface CreateWorkflowDialogProps {
  onWorkflowCreated: () => void;
  template?: WorkflowTemplate;
}

export default function CreateWorkflowDialog({ onWorkflowCreated, template }: CreateWorkflowDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("");
  const [actionType, setActionType] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Pre-fill form when dialog opens with a template
  useEffect(() => {
    if (open && template) {
      setName(template.name);
      setDescription(template.description);
      setTriggerType(template.triggerType);
      setActionType(template.actionType);
      if (template.defaultConfig) {
        setEmailTo(template.defaultConfig.emailTo || "");
        setEmailSubject(template.defaultConfig.emailSubject || "");
        setEmailBody(template.defaultConfig.emailBody || "");
      }
    }
  }, [open, template]);

  const triggers = [
    { value: "invoice_created", label: "Invoice Created" },
    { value: "invoice_overdue", label: "Invoice Overdue" },
    { value: "payment_received", label: "Payment Received" },
    { value: "time_entry_submitted", label: "Time Entry Submitted" },
    { value: "timesheet_approved", label: "Timesheet Approved" },
  ];

  const actions = [
    { value: "send_email", label: "Send Email" },
    { value: "send_notification", label: "Send Notification" },
    { value: "update_status", label: "Update Status" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !name || !triggerType || !actionType) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const actionConfig: any = {};
      
      if (actionType === "send_email") {
        if (!emailTo || !emailSubject || !emailBody) {
          toast.error("Please fill in all email fields");
          setLoading(false);
          return;
        }
        actionConfig.email_to = emailTo;
        actionConfig.email_subject = emailSubject;
        actionConfig.email_body = emailBody;
      }

      const { error } = await supabase.from("workflows").insert({
        user_id: user.id,
        name,
        description,
        trigger_type: triggerType,
        action_type: actionType,
        trigger_config: {},
        action_config: actionConfig,
        status: "active",
      });

      if (error) throw error;

      toast.success("Workflow created successfully");
      setOpen(false);
      resetForm();
      onWorkflowCreated();
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast.error("Failed to create workflow");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setTriggerType("");
    setActionType("");
    setEmailTo("");
    setEmailSubject("");
    setEmailBody("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {template ? (
          <Button size="sm" variant="outline" className="gap-1">
            Use
            <ArrowRight className="h-3 w-3" />
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Workflow
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Create New Workflow
          </DialogTitle>
          <DialogDescription>
            Set up an automated workflow with a trigger and action
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workflow Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Send invoice reminders"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this workflow does"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger">When this happens (Trigger) *</Label>
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a trigger" />
              </SelectTrigger>
              <SelectContent>
                {triggers.map((trigger) => (
                  <SelectItem key={trigger.value} value={trigger.value}>
                    {trigger.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="action">Do this (Action) *</Label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger>
                <SelectValue placeholder="Select an action" />
              </SelectTrigger>
              <SelectContent>
                {actions.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {actionType === "send_email" && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium">Email Configuration</h4>
              
              <div className="space-y-2">
                <Label htmlFor="emailTo">Send To *</Label>
                <Input
                  id="emailTo"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="email@example.com or use {client_email}"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use {`{client_email}`} to send to the related client
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailSubject">Subject *</Label>
                <Input
                  id="emailSubject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailBody">Message *</Label>
                <Textarea
                  id="emailBody"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Email message body"
                  rows={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {`{invoice_number}`}, {`{client_name}`}, {`{client_email}`}, {`{amount}`}, {`{amount_due}`}, {`{due_date}`}, {`{days_overdue}`}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Workflow"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
