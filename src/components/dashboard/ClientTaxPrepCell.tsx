import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { FileText, Circle, Clock, CheckCircle, Eye } from "lucide-react";

type TaxPrepStatus = "not_started" | "in_progress" | "ready_for_review" | "completed";

interface ClientTaxPrepCellProps {
  clientId: string;
  clientName: string;
  status: TaxPrepStatus;
  onStatusChange: (clientId: string, status: TaxPrepStatus) => void;
}

const taxPrepChecklist = [
  { id: "w2_collected", label: "W-2 Forms Collected" },
  { id: "1099_collected", label: "1099 Forms Collected" },
  { id: "income_verified", label: "Income Verified" },
  { id: "deductions_reviewed", label: "Deductions Reviewed" },
  { id: "documents_organized", label: "Documents Organized" },
  { id: "calculations_complete", label: "Calculations Complete" },
];

export const ClientTaxPrepCell = ({ clientId, clientName, status, onStatusChange }: ClientTaxPrepCellProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const getStatusDisplay = () => {
    switch (status) {
      case "not_started":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 cursor-pointer hover:bg-gray-100">
            <Circle className="h-3 w-3 mr-1" />
            Not Started
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case "ready_for_review":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 cursor-pointer hover:bg-yellow-100">
            <Eye className="h-3 w-3 mr-1" />
            Ready for Review
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 cursor-pointer hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
    }
  };

  const progress = (checkedItems.length / taxPrepChecklist.length) * 100;

  const handleCheckItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setCheckedItems([...checkedItems, itemId]);
    } else {
      setCheckedItems(checkedItems.filter(id => id !== itemId));
    }
  };

  return (
    <>
      <div className="cursor-pointer" onClick={() => setIsModalOpen(true)}>
        {getStatusDisplay()}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tax Preparation Checklist
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Client: {clientName}</p>
              <div className="flex items-center gap-2">
                <Progress value={progress} className="flex-1" />
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
            </div>
            <div className="space-y-3">
              {taxPrepChecklist.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={item.id}
                    checked={checkedItems.includes(item.id)}
                    onCheckedChange={(checked) => handleCheckItem(item.id, checked as boolean)}
                  />
                  <label
                    htmlFor={item.id}
                    className={`text-sm cursor-pointer ${
                      checkedItems.includes(item.id) ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Status will automatically update based on checklist completion.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
