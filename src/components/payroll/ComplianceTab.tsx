import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  DollarSign,
  Clock,
  Coffee,
  FileText,
  FolderOpen,
  Shield,
  Scale,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: "compliant" | "warning" | "alert";
  alerts: string[];
  actions: string[];
}

const ComplianceTab = () => {
  const complianceItems: ComplianceItem[] = [
    {
      id: "employee-classification",
      title: "Employee Classification",
      description: "Verify worker classification as employee or contractor",
      icon: Users,
      status: "warning",
      alerts: [
        "2 contractors may meet employee criteria based on work patterns",
        "Review needed for John Doe - working 40+ hours/week for 6 months",
      ],
      actions: ["Review Classifications", "View IRS Guidelines"],
    },
    {
      id: "minimum-wage",
      title: "Minimum Wage Compliance",
      description: "Monitor federal and state minimum wage requirements",
      icon: DollarSign,
      status: "compliant",
      alerts: [],
      actions: ["View Wage Rates", "Check Employee Rates"],
    },
    {
      id: "overtime-rules",
      title: "Overtime Rules",
      description: "Track overtime calculations and exempt/non-exempt status",
      icon: Clock,
      status: "compliant",
      alerts: [],
      actions: ["Review Overtime Records", "Manage Exemptions"],
    },
    {
      id: "break-periods",
      title: "Break & Meal Period Requirements",
      description: "Monitor meal and break compliance in timecards",
      icon: Coffee,
      status: "alert",
      alerts: [
        "3 violations detected this week",
        "Employee Sarah Smith - missed lunch breaks on 3 days",
        "Repeated violation pattern for Team B",
      ],
      actions: ["View Violations", "Generate Report"],
    },
    {
      id: "payroll-tax",
      title: "Payroll Tax Compliance",
      description: "Track tax deadlines and filing requirements",
      icon: FileText,
      status: "warning",
      alerts: [
        "Quarterly filing due in 15 days",
        "State tax payment due next week",
      ],
      actions: ["View Tax Calendar", "Upcoming Deadlines"],
    },
    {
      id: "record-keeping",
      title: "Record-Keeping Requirements",
      description: "Maintain required employee records and documents",
      icon: FolderOpen,
      status: "warning",
      alerts: [
        "2 I-9 forms expiring within 30 days",
        "Missing W-4 for new employee hired last week",
      ],
      actions: ["View Document Status", "Upload Documents"],
    },
    {
      id: "workers-comp",
      title: "Workers' Compensation",
      description: "Verify coverage and track certificate status",
      icon: Shield,
      status: "compliant",
      alerts: [],
      actions: ["View Coverage", "Upload Certificate"],
    },
    {
      id: "fair-employment",
      title: "Anti-Discrimination & Fair Employment",
      description: "Monitor equal pay and maintain compliance postings",
      icon: Scale,
      status: "compliant",
      alerts: [],
      actions: ["Equal Pay Report", "View Required Postings"],
    },
  ];

  const getStatusColor = (status: ComplianceItem["status"]) => {
    switch (status) {
      case "compliant":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "warning":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "alert":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
    }
  };

  const getStatusIcon = (status: ComplianceItem["status"]) => {
    switch (status) {
      case "compliant":
        return <CheckCircle2 className="h-4 w-4" />;
      case "warning":
        return <AlertCircle className="h-4 w-4" />;
      case "alert":
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: ComplianceItem["status"]) => {
    switch (status) {
      case "compliant":
        return "Compliant";
      case "warning":
        return "Needs Attention";
      case "alert":
        return "Action Required";
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Alert */}
      <Alert className="border-yellow-500/50 bg-yellow-500/10">
        <AlertCircle className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
        <AlertDescription className="text-yellow-700 dark:text-yellow-400">
          You have 2 compliance areas requiring immediate attention and 3 areas that need review.
        </AlertDescription>
      </Alert>

      {/* Compliance Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {complianceItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.id} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {item.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`flex items-center gap-1 ${getStatusColor(item.status)}`}
                  >
                    {getStatusIcon(item.status)}
                    {getStatusText(item.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Alerts Section */}
                {item.alerts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Alerts</p>
                    <div className="space-y-2">
                      {item.alerts.map((alert, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-sm p-2 rounded-md bg-muted/50"
                        >
                          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{alert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions Section */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Actions</p>
                  <div className="flex flex-wrap gap-2">
                    {item.actions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        {action}
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Compliance Status Message */}
                {item.alerts.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 p-2 rounded-md bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>No issues detected - all requirements met</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ComplianceTab;
