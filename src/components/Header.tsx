import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/logo-majr-books-themed.png";

interface HeaderProps {
  navigate: (path: string) => void;
}

export const Header = ({ navigate }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <div className="flex items-center space-x-2">
              <img 
                src={logoImage} 
                alt="MAJR Books Logo" 
                className="h-20 w-auto object-contain rounded-lg"
              />
            </div>
            
            {/* Navigation Menu */}
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList className="flex items-center gap-6">
                <NavigationMenuItem>
                  <a href="#home" className="text-sm font-medium hover:text-primary transition-colors">
                    Home
                  </a>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-accent">
                    Features
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid grid-cols-4 gap-8 p-6 w-[800px] bg-background">
                      {/* Column 1: Bill & Get Paid */}
                      <div>
                        <h3 className="font-bold text-sm mb-3 text-foreground">Bill & Get Paid</h3>
                        <ul className="space-y-2">
                          <li>
                            <a href="#" className="text-sm text-primary hover:underline">
                              Invoicing
                            </a>
                          </li>
                          <li>
                            <a href="#" className="text-sm text-primary hover:underline">
                              Payments
                            </a>
                          </li>
                          <li>
                            <a href="#" className="text-sm text-primary hover:underline">
                              Time Tracking
                            </a>
                          </li>
                        </ul>
                      </div>

                      {/* Column 2: Accounting & Taxes */}
                      <div>
                        <h3 className="font-bold text-sm mb-3 text-foreground">Accounting & Taxes</h3>
                        <ul className="space-y-2">
                          <li>
                            <a href="#" className="text-sm text-primary hover:underline">
                              Accounting
                            </a>
                          </li>
                          <li>
                            <a href="#" className="text-sm text-primary hover:underline">
                              Expenses and Receipts
                            </a>
                          </li>
                          <li>
                            <a href="#" className="text-sm text-primary hover:underline">
                              Reports
                            </a>
                          </li>
                          <li>
                            <a href="#" className="text-sm text-primary hover:underline">
                              Mileage Tracking App
                            </a>
                          </li>
                          <li>
                            <a href="#" className="text-sm text-primary hover:underline">
                              Bookkeeping
                            </a>
                          </li>
                        </ul>
                      </div>

                      {/* Column 3: Client Communication */}
                      <div>
                        <h3 className="font-bold text-sm mb-3 text-foreground">Client Communication</h3>
                        <ul className="space-y-2">
                          <li>
                            <a href="#" className="text-sm text-primary hover:underline">
                              Projects
                            </a>
                          </li>
                          <li>
                            <a href="#" className="text-sm text-primary hover:underline">
                              Proposals
                            </a>
                          </li>
                          <li>
                            <a href="#" className="text-sm text-primary hover:underline">
                              Estimates
                            </a>
                          </li>
                          <li>
                            <a href="#" className="text-sm text-primary hover:underline">
                              Clients
                            </a>
                          </li>
                        </ul>
                      </div>

                      {/* Column 4: Enable Your Team */}
                      <div>
                        <h3 className="font-bold text-sm mb-3 text-foreground">Enable Your Team</h3>
                        <ul className="space-y-2">
                          <li>
                            <a href="#" className="text-sm text-primary hover:underline">
                              Payroll
                            </a>
                          </li>
                          <li>
                            <a href="#" className="text-sm text-primary hover:underline">
                              Time Management
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
                    Pricing
                  </a>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <a href="/resources" className="text-sm font-medium hover:text-primary transition-colors">
                    Resources
                  </a>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">
                    Contact Us
                  </a>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")} className="hidden sm:flex">
              Login
            </Button>
            <Button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
              Try for Free
            </Button>
            <Button 
              variant="outline" 
              className="border-2 border-foreground text-foreground hover:bg-foreground hover:text-background hidden md:flex"
              onClick={() => navigate("/auth")}
            >
              Buy Now & Save
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
