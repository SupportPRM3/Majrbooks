import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Lock, HelpCircle, Heart } from "lucide-react";

interface ClientWelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ClientWelcomeModal = ({ open, onOpenChange }: ClientWelcomeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            👋 Welcome to MajrBooks
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Welcome! We're glad to have you onboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Intro Text */}
          <p className="text-muted-foreground">
            MajrBooks is designed to give you clear, easy-to-understand visibility into your 
            bookkeeping, without overwhelming you with technical details.
          </p>

          {/* What You Can View */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              What You Can View
            </h3>
            <p className="text-sm text-muted-foreground ml-7 mb-2">
              As a client, you'll have access to:
            </p>
            <ul className="space-y-2 text-muted-foreground ml-7">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>High-level financial summaries</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Key reports such as Profit & Loss</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Categorized expenses and income</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Documents you've uploaded</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Important updates related to your account</span>
              </li>
            </ul>
          </div>

          {/* What's Handled by Our Team */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              What's Handled by Our Team
            </h3>
            <p className="text-sm text-muted-foreground ml-7 mb-2">
              Behind the scenes, our team manages:
            </p>
            <ul className="space-y-2 text-muted-foreground ml-7">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Detailed bookkeeping work</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Reviews and reconciliations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Internal notes and analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Compliance checks and advisory insights</span>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground ml-7 mt-2">
              This ensures accuracy while keeping your experience simple and stress-free.
            </p>
          </div>

          {/* Need Help */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Need Help or Have Questions?
            </h3>
            <p className="text-muted-foreground ml-7">
              If you'd like clarification, additional reports, or support, you can request 
              assistance directly through the platform. Our team is here to help.
            </p>
          </div>

          {/* Thank You */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
            <p className="text-muted-foreground flex items-start gap-2">
              <Heart className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span>
                Thank you for trusting MajrBooks. We look forward to supporting you with 
                clear, reliable bookkeeping year-round.
              </span>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientWelcomeModal;
