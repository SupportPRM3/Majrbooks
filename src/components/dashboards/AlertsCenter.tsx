import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAlerts } from '@/hooks/useDashboardData';
import { 
  AlertTriangle, 
  BellRing, 
  CreditCard, 
  FileText, 
  Calendar, 
  Receipt, 
  Wallet,
  X,
  Check,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const alertIcons: Record<string, typeof AlertTriangle> = {
  bank_sync_error: RefreshCw,
  overdue_invoice: FileText,
  overdue_bill: CreditCard,
  tax_deadline: Calendar,
  payroll_reminder: BellRing,
  missing_receipt: Receipt,
  low_cash_balance: Wallet
};

const severityColors: Record<string, string> = {
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  critical: 'bg-red-600/10 text-red-600 border-red-600/20'
};

export function AlertsCenter() {
  const { alerts, loading, error, markAsRead, dismissAlert } = useAlerts();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load alerts: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>Alerts Center</CardTitle>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {unreadCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Check className="h-12 w-12 mb-2 text-emerald-500" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">No alerts at this time</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {alerts.map((alert) => {
                const Icon = alertIcons[alert.alert_type] || AlertTriangle;
                
                return (
                  <div 
                    key={alert.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                      !alert.is_read ? 'bg-muted/50' : ''
                    } ${severityColors[alert.severity]}`}
                  >
                    <div className={`p-2 rounded-full ${severityColors[alert.severity]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{alert.title}</p>
                          {alert.message && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {alert.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!alert.is_read && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => markAsRead(alert.id)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => dismissAlert(alert.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
