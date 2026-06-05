import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, Search, Check, Star, Zap, Shield, Clock } from "lucide-react";
import { toast } from "sonner";

interface AddOn {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  billingType: "monthly" | "one-time" | "yearly";
  category: string;
  features: string[];
  popular?: boolean;
  purchased?: boolean;
}

const mockAddOns: AddOn[] = [
  {
    id: "a1",
    name: "Advanced Analytics",
    description: "Deep insights into your financial data",
    longDescription: "Get comprehensive analytics with custom dashboards, trend analysis, and predictive insights to make better business decisions.",
    price: 79,
    billingType: "monthly",
    category: "Analytics",
    features: ["Custom dashboards", "Trend analysis", "Predictive insights", "Export reports"],
    popular: true,
  },
  {
    id: "a2",
    name: "Multi-Currency Support",
    description: "Handle transactions in multiple currencies",
    longDescription: "Seamlessly manage international transactions with automatic currency conversion and multi-currency reporting.",
    price: 49,
    billingType: "monthly",
    category: "International",
    features: ["50+ currencies", "Auto conversion", "FX reports", "Multi-currency invoicing"],
  },
  {
    id: "a3",
    name: "API Access",
    description: "Integrate with your existing tools",
    longDescription: "Full API access to build custom integrations with your existing business tools and workflows.",
    price: 199,
    billingType: "monthly",
    category: "Developer",
    features: ["RESTful API", "Webhooks", "SDK access", "Priority support"],
  },
  {
    id: "a4",
    name: "White Label Reports",
    description: "Custom branded reports for clients",
    longDescription: "Generate professional reports with your own branding for a seamless client experience.",
    price: 299,
    billingType: "one-time",
    category: "Branding",
    features: ["Custom logo", "Color themes", "Report templates", "PDF export"],
    purchased: true,
  },
  {
    id: "a5",
    name: "Priority Support",
    description: "24/7 dedicated support team",
    longDescription: "Get priority access to our support team with faster response times and dedicated account management.",
    price: 149,
    billingType: "monthly",
    category: "Support",
    features: ["24/7 availability", "Priority response", "Dedicated manager", "Phone support"],
    popular: true,
  },
  {
    id: "a6",
    name: "Document Storage",
    description: "Unlimited cloud storage for documents",
    longDescription: "Store all your financial documents securely in the cloud with unlimited storage and easy retrieval.",
    price: 29,
    billingType: "monthly",
    category: "Storage",
    features: ["Unlimited storage", "OCR scanning", "Auto-categorization", "Secure sharing"],
  },
];

const DiscoverMore = () => {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    setTimeout(() => {
      setAddOns(mockAddOns);
      setLoading(false);
    }, 500);
  }, []);

  const handlePurchase = (addOn: AddOn) => {
    setAddOns(prev => prev.map(a => a.id === addOn.id ? { ...a, purchased: true } : a));
    toast.success(`Successfully added ${addOn.name}!`);
    setDetailsOpen(false);
  };

  const categories = ["all", ...Array.from(new Set(addOns.map(a => a.category)))];

  const filteredAddOns = addOns.filter(addOn => {
    const matchesSearch = addOn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addOn.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || addOn.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Analytics": return <Zap className="h-5 w-5" />;
      case "Support": return <Shield className="h-5 w-5" />;
      case "Storage": return <Clock className="h-5 w-5" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Discover More
            </h1>
            <p className="text-muted-foreground mt-1">Explore add-ons and upgrades to enhance your experience</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search add-ons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter(cat)}
                    className="capitalize"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add-ons Grid */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading add-ons...</div>
        ) : filteredAddOns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No add-ons found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAddOns.map((addOn) => (
              <Card key={addOn.id} className={`relative ${addOn.popular ? "ring-2 ring-primary" : ""}`}>
                {addOn.popular && (
                  <Badge className="absolute -top-2 -right-2 bg-primary">Popular</Badge>
                )}
                {addOn.purchased && (
                  <Badge className="absolute -top-2 -left-2 bg-green-600">Purchased</Badge>
                )}
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {getCategoryIcon(addOn.category)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{addOn.name}</h3>
                      <Badge variant="outline" className="mt-1">{addOn.category}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{addOn.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold">${addOn.price}</span>
                      <span className="text-sm text-muted-foreground">/{addOn.billingType === "one-time" ? "one-time" : addOn.billingType === "monthly" ? "mo" : "yr"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => { setSelectedAddOn(addOn); setDetailsOpen(true); }}
                    >
                      View Details
                    </Button>
                    {addOn.purchased ? (
                      <Button disabled className="flex-1 gap-2">
                        <Check className="h-4 w-4" /> Added
                      </Button>
                    ) : (
                      <Button className="flex-1" onClick={() => handlePurchase(addOn)}>
                        Add Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Details Modal */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedAddOn?.name}</DialogTitle>
              <DialogDescription>{selectedAddOn?.description}</DialogDescription>
            </DialogHeader>
            {selectedAddOn && (
              <div className="space-y-4">
                <p className="text-muted-foreground">{selectedAddOn.longDescription}</p>
                <div>
                  <h4 className="font-semibold mb-2">Features included:</h4>
                  <ul className="space-y-2">
                    {selectedAddOn.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-bold">${selectedAddOn.price}</span>
                      <span className="text-muted-foreground">/{selectedAddOn.billingType === "one-time" ? "one-time" : selectedAddOn.billingType}</span>
                    </div>
                    <Badge variant="outline">{selectedAddOn.category}</Badge>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>Cancel</Button>
              {selectedAddOn && !selectedAddOn.purchased && (
                <Button onClick={() => handlePurchase(selectedAddOn)}>Purchase Now</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default DiscoverMore;
