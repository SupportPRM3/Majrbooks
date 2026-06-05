import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Circle, Clock, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";

type TaxReturnStatus = "not_filed" | "preparing" | "filed" | "rejected" | "needs_info" | "draft" | "in_progress" | "completed" | "pending_review";

interface TaxReturn {
  id: string;
  status: string;
  tax_year: number;
  filing_type: string;
  deadline: string;
  created_at?: string;
}

interface ClientTaxReturnsCellProps {
  clientId: string;
  taxReturn: TaxReturn | null;
}

export const ClientTaxReturnsCell = ({ clientId, taxReturn }: ClientTaxReturnsCellProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/tax-returns?client=${clientId}`);
  };

  const getStatusDisplay = () => {
    if (!taxReturn) {
      return (
        <Badge 
          variant="outline" 
          className="bg-gray-50 text-gray-600 border-gray-200 cursor-pointer hover:bg-gray-100"
          onClick={handleClick}
        >
          <Circle className="h-3 w-3 mr-1" />
          Not Filed
        </Badge>
      );
    }

    const status = taxReturn.status.toLowerCase().replace(/\s+/g, '_') as TaxReturnStatus;

    switch (status) {
      case "preparing":
      case "draft":
      case "in_progress":
        return (
          <Badge 
            variant="outline" 
            className="bg-blue-50 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100"
            onClick={handleClick}
          >
            <Clock className="h-3 w-3 mr-1" />
            Preparing
          </Badge>
        );
      case "filed":
      case "completed":
        return (
          <div className="flex flex-col gap-1 cursor-pointer" onClick={handleClick}>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
              <CheckCircle className="h-3 w-3 mr-1" />
              Filed
            </Badge>
            {taxReturn.created_at && (
              <span className="text-xs text-muted-foreground">
                {new Date(taxReturn.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        );
      case "rejected":
        return (
          <Badge 
            variant="outline" 
            className="bg-red-50 text-red-700 border-red-200 cursor-pointer hover:bg-red-100"
            onClick={handleClick}
          >
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "needs_info":
      case "pending_review":
        return (
          <Badge 
            variant="outline" 
            className="bg-yellow-50 text-yellow-700 border-yellow-200 cursor-pointer hover:bg-yellow-100"
            onClick={handleClick}
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Needs Info
          </Badge>
        );
      default:
        return (
          <Badge 
            variant="outline" 
            className="bg-gray-50 text-gray-600 border-gray-200 cursor-pointer hover:bg-gray-100"
            onClick={handleClick}
          >
            <FileText className="h-3 w-3 mr-1" />
            {taxReturn.status}
          </Badge>
        );
    }
  };

  return <div>{getStatusDisplay()}</div>;
};
