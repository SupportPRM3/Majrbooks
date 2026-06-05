import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Lightbulb, Search, Plus, TrendingUp, Users, DollarSign, CheckCircle, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  id: string;
  product_name: string;
  description: string | null;
  price: number;
  category: string;
  is_active: boolean;
}

interface ClientRecommendation {
  id: string;
  recommendation_id: string;
  client_id: string | null;
  status: string;
  sent_at: string;
  converted_at: string | null;
  product_name?: string;
  client_name?: string;
}

const ProductRecommendations = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<ClientRecommendation[]>([]);
  const [clients, setClients] = useState<{ id: string; client_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addRecommendationOpen, setAddRecommendationOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [newProduct, setNewProduct] = useState({
    product_name: "",
    description: "",
    price: "",
    category: "addon",
  });

  const fetchProducts = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("product_recommendations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load products");
    } else {
      setProducts(data || []);
    }
  };

  const fetchRecommendations = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("client_recommendations")
      .select("*")
      .order("sent_at", { ascending: false });

    if (error) {
      toast.error("Failed to load recommendations");
    } else {
      // Enrich with product and client names
      const productIds = data?.map(r => r.recommendation_id).filter(Boolean) || [];
      const clientIds = data?.map(r => r.client_id).filter(Boolean) || [];
      
      const [productData, clientData] = await Promise.all([
        productIds.length > 0 ? supabase.from("product_recommendations").select("id, product_name").in("id", productIds) : { data: [] },
        clientIds.length > 0 ? supabase.from("clients").select("id, client_name").in("id", clientIds) : { data: [] },
      ]);
      
      const productMap = new Map((productData.data || []).map(p => [p.id, p.product_name]));
      const clientMap = new Map((clientData.data || []).map(c => [c.id, c.client_name]));
      
      const enrichedData = data?.map(r => ({
        ...r,
        product_name: productMap.get(r.recommendation_id) || "Unknown",
        client_name: r.client_id ? clientMap.get(r.client_id) || "Unknown" : "Unknown",
      }));
      
      setRecommendations(enrichedData || []);
    }
  };

  const fetchClients = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("clients")
      .select("id, client_name")
      .eq("status", "active");
    setClients(data || []);
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchProducts(), fetchRecommendations(), fetchClients()]).finally(() => setLoading(false));
    }
  }, [user]);

  const handleAddProduct = async () => {
    if (!user || !newProduct.product_name || !newProduct.price) {
      toast.error("Please fill required fields");
      return;
    }

    const { error } = await supabase
      .from("product_recommendations")
      .insert({
        user_id: user.id,
        product_name: newProduct.product_name,
        description: newProduct.description || null,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
      });

    if (error) {
      toast.error("Failed to create product");
    } else {
      toast.success("Product created successfully");
      setAddProductOpen(false);
      setNewProduct({ product_name: "", description: "", price: "", category: "addon" });
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase
      .from("product_recommendations")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete product");
    } else {
      toast.success("Product deleted");
      fetchProducts();
    }
  };

  const handleAddRecommendation = async () => {
    if (!user || !selectedProduct || !selectedClient) {
      toast.error("Please select both a product and client");
      return;
    }

    const { error } = await supabase
      .from("client_recommendations")
      .insert({
        user_id: user.id,
        recommendation_id: selectedProduct,
        client_id: selectedClient,
        status: "pending",
      });

    if (error) {
      toast.error("Failed to send recommendation");
    } else {
      toast.success("Recommendation sent successfully");
      setAddRecommendationOpen(false);
      setSelectedProduct("");
      setSelectedClient("");
      fetchRecommendations();
    }
  };

  const handleUpdateRecommendationStatus = async (id: string, status: string) => {
    const updateData: { status: string; converted_at?: string } = { status };
    if (status === "purchased") {
      updateData.converted_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("client_recommendations")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success("Status updated");
      fetchRecommendations();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "purchased": return "bg-green-100 text-green-800";
      case "viewed": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "declined": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const stats = {
    totalSent: recommendations.length,
    purchased: recommendations.filter(r => r.status === "purchased").length,
    totalRevenue: recommendations.filter(r => r.status === "purchased").reduce((sum, r) => {
      const product = products.find(p => p.id === r.recommendation_id);
      return sum + (product?.price || 0);
    }, 0),
    conversionRate: recommendations.length > 0 ? ((recommendations.filter(r => r.status === "purchased").length / recommendations.length) * 100).toFixed(1) : "0",
  };

  const filteredProducts = products.filter(p =>
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Lightbulb className="h-8 w-8 text-primary" />
              Product Recommendations
            </h1>
            <p className="text-muted-foreground mt-1">Upsell products to your clients</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAddProductOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
            <Button onClick={() => setAddRecommendationOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Send Recommendation
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recommendations Sent</p>
                  <p className="text-2xl font-bold">{stats.totalSent}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Purchased</p>
                  <p className="text-2xl font-bold">{stats.purchased}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Generated</p>
                  <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products */}
        <Card>
          <CardHeader>
            <CardTitle>Available Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No products found. Add your first product to get started.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{product.product_name}</h3>
                        <div className="flex gap-1">
                          <Badge variant="outline">{product.category}</Badge>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{product.description || "No description"}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendation History */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendation History</CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No recommendations sent yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendations.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-medium">{rec.product_name}</TableCell>
                      <TableCell>{rec.client_name}</TableCell>
                      <TableCell>{new Date(rec.sent_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(rec.status)}>{rec.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={rec.status} onValueChange={(v) => handleUpdateRecommendationStatus(rec.id, v)}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="viewed">Viewed</SelectItem>
                            <SelectItem value="purchased">Purchased</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Product Dialog */}
        <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input
                  value={newProduct.product_name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, product_name: e.target.value }))}
                  placeholder="e.g., Tax Planning Package"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the product..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newProduct.category} onValueChange={(v) => setNewProduct(prev => ({ ...prev, category: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="addon">Add-on</SelectItem>
                      <SelectItem value="tax">Tax</SelectItem>
                      <SelectItem value="bookkeeping">Bookkeeping</SelectItem>
                      <SelectItem value="payroll">Payroll</SelectItem>
                      <SelectItem value="advisory">Advisory</SelectItem>
                      <SelectItem value="audit">Audit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddProductOpen(false)}>Cancel</Button>
              <Button onClick={handleAddProduct}>Create Product</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Recommendation Dialog */}
        <Dialog open={addRecommendationOpen} onOpenChange={setAddRecommendationOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Product Recommendation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.product_name} - ${product.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select Client</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddRecommendationOpen(false)}>Cancel</Button>
              <Button onClick={handleAddRecommendation}>Send Recommendation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ProductRecommendations;