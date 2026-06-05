import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, History, UserPlus, UserMinus, Settings, Mail, LogIn, ShieldCheck } from "lucide-react";

const actionIcons: Record<string, React.ReactNode> = {
  invite_sent: <Mail className="h-4 w-4" />,
  invite_accepted: <UserPlus className="h-4 w-4" />,
  role_changed: <ShieldCheck className="h-4 w-4" />,
  permissions_updated: <Settings className="h-4 w-4" />,
  user_deactivated: <UserMinus className="h-4 w-4" />,
  user_activated: <UserPlus className="h-4 w-4" />,
  user_login: <LogIn className="h-4 w-4" />,
};

const actionLabels: Record<string, string> = {
  invite_sent: "Invite Sent",
  invite_accepted: "Invite Accepted",
  role_changed: "Role Changed",
  permissions_updated: "Permissions Updated",
  user_deactivated: "User Deactivated",
  user_activated: "User Activated",
  user_login: "User Login",
};

const AuditLogPanel = () => {
  const { user } = useAuth();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          team_members:team_member_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Activity Log
        </CardTitle>
        <CardDescription>
          Recent user access and permission changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {logs && logs.length > 0 ? (
            <div className="space-y-4">
              {logs.map((log) => {
                const details = log.details as Record<string, any> || {};
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      {actionIcons[log.action] || <Settings className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {actionLabels[log.action] || log.action}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm mt-1">
                        {log.team_members ? (
                          <>
                            <span className="font-medium">
                              {(log.team_members as any).first_name} {(log.team_members as any).last_name}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}({(log.team_members as any).email})
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            {details.email || 'Unknown user'}
                          </span>
                        )}
                      </p>
                      {details.role && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Role: <span className="capitalize">{details.role}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No activity recorded yet</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AuditLogPanel;
