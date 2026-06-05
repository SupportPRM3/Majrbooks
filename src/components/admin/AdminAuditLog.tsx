import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Search,
  Filter,
  Download,
  Loader2,
  User,
  Settings,
  FileText,
  CreditCard,
  Shield,
  Clock,
  UserPlus,
  UserMinus,
  Edit,
  Trash,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";

const actionIcons: Record<string, any> = {
  login: Clock,
  logout: Clock,
  user_created: UserPlus,
  user_deleted: UserMinus,
  user_suspended: UserMinus,
  user_unsuspended: UserPlus,
  user_activated: UserPlus,
  user_deactivated: UserMinus,
  role_changed: Shield,
  invite_sent: UserPlus,
  invite_accepted: UserPlus,
  settings_changed: Settings,
  data_export: Download,
  data_view: Eye,
  record_created: FileText,
  record_updated: Edit,
  record_deleted: Trash,
  payment_processed: CreditCard,
};

const actionLabels: Record<string, string> = {
  login: "User Login",
  logout: "User Logout",
  user_created: "User Created",
  user_deleted: "User Deleted",
  user_suspended: "User Suspended",
  user_unsuspended: "User Unsuspended",
  user_activated: "User Activated",
  user_deactivated: "User Deactivated",
  role_changed: "Role Changed",
  invite_sent: "Invite Sent",
  invite_accepted: "Invite Accepted",
  settings_changed: "Settings Changed",
  data_export: "Data Exported",
  data_view: "Data Viewed",
  record_created: "Record Created",
  record_updated: "Record Updated",
  record_deleted: "Record Deleted",
  payment_processed: "Payment Processed",
};

interface AdminAuditLogProps {
  onBackToOverview?: () => void;
}

const AdminAuditLog = ({ onBackToOverview }: AdminAuditLogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Fetch all audit logs (admin has access to all)
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["admin-audit-logs", actionFilter, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      if (dateFilter !== "all") {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case "today":
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case "week":
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case "month":
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte("created_at", startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filteredLogs = auditLogs?.filter((log) =>
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.includes("deleted") || action.includes("suspended")) return "destructive";
    if (action.includes("created") || action.includes("activated")) return "default";
    return "secondary";
  };

  const exportLogs = () => {
    if (!filteredLogs) return;
    
    const csvContent = [
      ["Date", "Time", "Action", "Entity Type", "Entity ID", "Details"].join(","),
      ...filteredLogs.map((log) => [
        format(new Date(log.created_at), "yyyy-MM-dd"),
        format(new Date(log.created_at), "HH:mm:ss"),
        log.action,
        log.entity_type,
        log.entity_id || "",
        JSON.stringify(log.details || {}),
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Audit Log
            </CardTitle>
            <CardDescription>
              Complete history of all system actions and changes
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onBackToOverview && (
              <Button variant="outline" size="sm" onClick={onBackToOverview}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Overview
              </Button>
            )}
            <Button variant="outline" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="user_created">User Created</SelectItem>
              <SelectItem value="user_deleted">User Deleted</SelectItem>
              <SelectItem value="role_changed">Role Changed</SelectItem>
              <SelectItem value="user_activated">User Activated</SelectItem>
              <SelectItem value="user_deactivated">User Deactivated</SelectItem>
              <SelectItem value="invite_sent">Invite Sent</SelectItem>
              <SelectItem value="settings_changed">Settings Changed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Audit Table */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLogs && filteredLogs.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {format(new Date(log.created_at), "MMM d, yyyy")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "h:mm:ss a")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {actionLabels[log.action] || log.action.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{log.entity_type?.replace(/_/g, " ")}</span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {log.details ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {JSON.stringify(log.details)}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.ip_address || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No audit logs found</h3>
            <p className="text-muted-foreground">
              System activity will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAuditLog;
