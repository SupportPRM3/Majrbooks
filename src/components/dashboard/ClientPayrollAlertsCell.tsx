import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, FileWarning } from "lucide-react";

interface PayrollAlert {
  type: "no_alerts" | "pending_payroll" | "missing_timesheets" | "late_filing";
  count?: number;
}

interface ClientPayrollAlertsCellProps {
  clientId: string;
  alert: PayrollAlert;
}

export const ClientPayrollAlertsCell = ({ clientId, alert }: ClientPayrollAlertsCellProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (alert.type !== "no_alerts") {
      navigate(`/payroll?client=${clientId}`);
    }
  };

  const getAlertDisplay = () => {
    switch (alert.type) {
      case "pending_payroll":
        return (
          <Badge 
            variant="outline" 
            className="bg-yellow-50 text-yellow-700 border-yellow-200 cursor-pointer hover:bg-yellow-100"
            onClick={handleClick}
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending Payroll
          </Badge>
        );
      case "missing_timesheets":
        return (
          <Badge 
            variant="outline" 
            className="bg-orange-50 text-orange-700 border-orange-200 cursor-pointer hover:bg-orange-100"
            onClick={handleClick}
          >
            <FileWarning className="h-3 w-3 mr-1" />
            Missing Timesheets
          </Badge>
        );
      case "late_filing":
        return (
          <Badge 
            variant="outline" 
            className="bg-red-50 text-red-700 border-red-200 cursor-pointer hover:bg-red-100"
            onClick={handleClick}
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Late Filing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            No Alerts
          </Badge>
        );
    }
  };

  return <div>{getAlertDisplay()}</div>;
};
