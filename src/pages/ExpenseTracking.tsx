import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { 
  Brain, 
  Camera, 
  RefreshCw, 
  FileText, 
  TrendingUp, 
  Calculator, 
  Clock,
  Star
} from "lucide-react";

const ExpenseTracking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta Tags */}
      <title>Easy Expense Tracking | MAJR Books - Automate Expenses & Business Bookkeeping</title>
      
      <Header navigate={navigate} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Track Expenses Effortlessly — 
                <span className="text-primary"> Save Time and Stay Organized</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground">
                Capture and categorize every expense automatically with smart AI tools — perfect for business owners, freelancers, and bookkeepers.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-lg"
                  onClick={() => navigate("/auth")}
                >
                  Start Managing My Expenses
                </Button>
              </div>
            </div>

            {/* Right Column - Hero Image/Visual */}
            <div className="relative">
              <Card className="p-6 bg-card/50 backdrop-blur border-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <h3 className="font-semibold text-lg">Expense Dashboard</h3>
                    <span className="text-sm text-muted-foreground">This Month</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-primary/10">
                      <p className="text-sm text-muted-foreground">Office Supplies</p>
                      <p className="text-2xl font-bold text-primary">$1,245</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/10">
                      <p className="text-sm text-muted-foreground">Travel</p>
                      <p className="text-2xl font-bold text-secondary">$3,890</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/10">
                      <p className="text-sm text-muted-foreground">Utilities</p>
                      <p className="text-2xl font-bold">$567</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Marketing</p>
                      <p className="text-2xl font-bold">$2,340</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Expenses</span>
                      <span className="text-2xl font-bold">$8,042</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Key Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features for Smart Expense Management
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to track, organize, and analyze your business expenses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Categorization</h3>
              <p className="text-muted-foreground">
                Automatically tags expenses based on merchant or amount using AI-powered intelligence.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Receipt Upload</h3>
              <p className="text-muted-foreground">
                Snap photos or upload receipts — instantly organized and digitally stored for easy access.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Sync Accounts</h3>
              <p className="text-muted-foreground">
                Connect bank or card accounts for real-time expense imports and automatic reconciliation.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Reports</h3>
              <p className="text-muted-foreground">
                Generate summaries for tax filing or business analysis with just a few clicks.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 2: Benefits Snapshot */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Business Owners Love Our Expense Tracking
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <Card className="p-8 text-center hover:scale-105 transition-transform bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Stay on Top of Your Cash Flow</h3>
              <p className="text-muted-foreground">
                Real-time tracking gives you instant visibility into where your money is going.
              </p>
            </Card>

            {/* Benefit 2 */}
            <Card className="p-8 text-center hover:scale-105 transition-transform bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
                <Calculator className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Simplify Tax Time</h3>
              <p className="text-muted-foreground">
                Accurate records mean stress-free tax filing with all receipts and categorizations ready.
              </p>
            </Card>

            {/* Benefit 3 */}
            <Card className="p-8 text-center hover:scale-105 transition-transform bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Reduce Manual Entry by 80%</h3>
              <p className="text-muted-foreground">
                Automation handles the heavy lifting so you can focus on growing your business.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 3: Testimonial/Trust */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              ))}
            </div>
            
            <blockquote className="text-xl md:text-2xl text-center font-medium mb-6">
              "Saved me 5 hours a week on bookkeeping! The automatic categorization is spot-on, 
              and I love being able to snap receipts on the go. This tool has transformed how I manage my business finances."
            </blockquote>
            
            <div className="text-center">
              <p className="font-semibold text-lg">Sarah Martinez</p>
              <p className="text-muted-foreground">Freelance Marketing Consultant</p>
            </div>
          </Card>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Simplify Your Business Finances Today
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Join thousands of business owners who've streamlined their expense tracking
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg"
              onClick={() => navigate("/auth")}
            >
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              onClick={() => navigate("/auth")}
            >
              Book a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-12 px-4 border-t">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2025 MAJR Books. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ExpenseTracking;
