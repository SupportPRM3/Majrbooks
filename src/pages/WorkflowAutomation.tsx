import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import CreateWorkflowDialog from "@/components/CreateWorkflowDialog";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  RefreshCw,
  Zap,
  MoreVertical,
  Play,
  Pause,
  Settings,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Workflow {
  id: string;
  name: string;
  trigger_type: string;
  action_type: string;
  status: string;
  runs_today: number;
  success_count: number;
  total_runs: number;
}

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

const WorkflowAutomation = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [checkingOverdue, setCheckingOverdue] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWorkflows();
      fetchExecutionHistory();
    }
  }, [user]);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setWorkflows(data);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      toast.error("Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutionHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("workflow_execution_history")
        .select("id, executed_at, trigger_data, action_result, status, error_message, workflow_id, workflows(name)")
        .eq("user_id", user?.id)
        .order("executed_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      if (data) setExecutionHistory(data);
    } catch (error) {
      console.error("Error fetching workflow history:", error);
      toast.error("Failed to load workflow history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const runOverdueCheck = async () => {
    setCheckingOverdue(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-overdue-invoices");

      if (error) throw error;

      if (data.processed > 0) {
        toast.success(`Processed ${data.processed} payment follow-ups for ${data.overdueCount} overdue invoices`);
      } else if (data.overdueCount > 0) {
        toast.info(`Found ${data.overdueCount} overdue invoices but no active payment follow-up workflows configured`);
      } else {
        toast.info("No overdue invoices found");
      }
      
      fetchWorkflows();
      fetchExecutionHistory();
    } catch (error) {
      console.error("Error checking overdue invoices:", error);
      toast.error("Failed to check overdue invoices");
    } finally {
      setCheckingOverdue(false);
    }
  };

  const templates: WorkflowTemplate[] = [
    {
      name: "Payment Follow-up",
      description: "Automatically follow up on overdue invoices",
      category: "Billing",
      triggerType: "invoice_overdue",
      actionType: "send_email",
      defaultConfig: {
        emailTo: "{client_email}",
        emailSubject: "Payment Reminder: Invoice {invoice_number} is overdue",
        emailBody: `Dear {client_name},

This is a friendly reminder that Invoice {invoice_number} for ${"{amount_due}"} is now {days_overdue} days overdue.

Original due date: {due_date}

Please arrange payment at your earliest convenience. If you have already made the payment, please disregard this reminder.

Thank you for your business.`,
      },
    },
    {
      name: "Payment Thank You",
      description: "Send thank you emails when payments are received",
      category: "Billing",
      triggerType: "payment_received",
      actionType: "send_email",
      defaultConfig: {
        emailTo: "{client_email}",
        emailSubject: "Thank You for Your Payment - Invoice {invoice_number}",
        emailBody: `Dear {client_name},

Thank you for your payment of ${"{payment_amount}"} received on {payment_date}.

Invoice: {invoice_number}
Payment Method: {payment_method}
Amount Paid: ${"{payment_amount}"}
Remaining Balance: ${"{remaining_balance}"}

We appreciate your prompt payment and continued business!

Best regards,
Your Team`,
      },
    },
    {
      name: "Task Assignment",
      description: "Assign tasks based on project stage",
      category: "Project Management",
      triggerType: "time_entry_submitted",
      actionType: "send_notification",
    },
    {
      name: "Document Reminder",
      description: "Remind clients to submit required documents",
      category: "Client Management",
      triggerType: "invoice_created",
      actionType: "send_email",
    },
    {
      name: "Expense Approval",
      description: "Route expenses for manager approval",
      category: "Expenses",
      triggerType: "timesheet_approved",
      actionType: "send_notification",
    },
  ];

  const activeWorkflowsCount = workflows.filter((w) => w.status === "active").length;
  const totalRunsToday = workflows.reduce((sum, w) => sum + w.runs_today, 0);
  const totalRuns = workflows.reduce((sum, w) => sum + w.total_runs, 0);
  const totalSuccess = workflows.reduce((sum, w) => sum + w.success_count, 0);
  const successRate = totalRuns > 0 ? ((totalSuccess / totalRuns) * 100).toFixed(1) : "100.0";

  const stats = [
    {
      label: "Active Workflows",
      value: activeWorkflowsCount.toString(),
      icon: Zap,
      color: "text-blue-600",
    },
    {
      label: "Runs Today",
      value: totalRunsToday.toString(),
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      label: "Total Runs",
      value: totalRuns.toString(),
      icon: Clock,
      color: "text-purple-600",
    },
    {
      label: "Success Rate",
      value: `${successRate}%`,
      icon: RefreshCw,
      color: "text-orange-600",
    },
  ];

  const toggleWorkflowStatus = async (id: string) => {
    const workflow = workflows.find((w) => w.id === id);
    if (!workflow) return;

    const newStatus = workflow.status === "active" ? "paused" : "active";

    try {
      const { error } = await supabase
        .from("workflows")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setWorkflows(
        workflows.map((w) =>
          w.id === id ? { ...w, status: newStatus } : w
        )
      );
      toast.success(`Workflow ${newStatus === "active" ? "activated" : "paused"}`);
    } catch (error) {
      console.error("Error toggling workflow:", error);
      toast.error("Failed to update workflow status");
    }
  };

  const runWorkflowNow = async (workflow: Workflow) => {
    try {
      toast.loading("Running workflow...");

      const { data, error } = await supabase.functions.invoke("execute-workflow", {
        body: {
          workflowId: workflow.id,
          triggerData: {},
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Workflow executed successfully");
        fetchWorkflows();
        fetchExecutionHistory();
      } else {
        toast.error(data.message || "Workflow execution failed");
      }
    } catch (error) {
      console.error("Error running workflow:", error);
      toast.error("Failed to run workflow");
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;

    try {
      const { error } = await supabase
        .from("workflows")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setWorkflows(workflows.filter((w) => w.id !== id));
      toast.success("Workflow deleted");
    } catch (error) {
      console.error("Error deleting workflow:", error);
      toast.error("Failed to delete workflow");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <RefreshCw className="h-8 w-8 text-primary" />
              Workflow Automation
            </h1>
            <p className="text-muted-foreground mt-1">
              Automate repetitive tasks and save time
            </p>
          </div>
          <CreateWorkflowDialog onWorkflowCreated={fetchWorkflows} />
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

        {/* Active Workflows */}
        <Card>
          <CardHeader>
            <CardTitle>Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Runs Today</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((workflow) => {
                  const successRate = workflow.total_runs > 0 
                    ? Math.round((workflow.success_count / workflow.total_runs) * 100)
                    : 100;
                  
                  return (
                    <TableRow key={workflow.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          {workflow.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {workflow.trigger_type}
                      </TableCell>
                      <TableCell className="text-sm">
                        {workflow.action_type}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{workflow.runs_today}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {successRate >= 95 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          )}
                          <span>{successRate}%</span>
                        </div>
                      </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={getStatusColor(workflow.status)}
                        >
                          {workflow.status}
                        </Badge>
                        <Switch
                          checked={workflow.status === "active"}
                          onCheckedChange={() =>
                            toggleWorkflowStatus(workflow.id)
                          }
                        />
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
                          <DropdownMenuItem onClick={() => runWorkflowNow(workflow)}>
                            <Play className="h-4 w-4 mr-2" />
                            Run Now
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteWorkflow(workflow.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Workflow Execution History */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Execution History</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <p className="text-muted-foreground text-sm">Loading history...</p>
            ) : executionHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No workflow runs recorded yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Executed At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trigger Data</TableHead>
                    <TableHead>Action Result</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executionHistory.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-medium">
                        {run.workflows?.name || "Unknown"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(run.executed_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            run.status === "success"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs text-xs text-muted-foreground">
                        <pre className="whitespace-pre-wrap break-words">
                          {JSON.stringify(run.trigger_data || {}, null, 2)}
                        </pre>
                      </TableCell>
                      <TableCell className="max-w-xs text-xs text-muted-foreground">
                        <pre className="whitespace-pre-wrap break-words">
                          {JSON.stringify(run.action_result || {}, null, 2)}
                        </pre>
                      </TableCell>
                      <TableCell className="max-w-xs text-xs text-destructive">
                        {run.error_message || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Workflow Templates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Workflow Templates</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runOverdueCheck}
              disabled={checkingOverdue}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              {checkingOverdue ? "Checking..." : "Run Overdue Check Now"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold">{template.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline">{template.category}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            {template.triggerType.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                      <CreateWorkflowDialog 
                        onWorkflowCreated={fetchWorkflows}
                        template={template}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default WorkflowAutomation;
