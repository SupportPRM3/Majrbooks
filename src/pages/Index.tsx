import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { ChatWidget } from "@/components/ChatWidget";
import { ContactForm } from "@/components/ContactForm";
import logoImage from "@/assets/logo-majr-books-new.jpg";

import {
  FileText, 
  Building2, 
  TrendingUp, 
  Shield, 
  Phone,
  Mail,
  MapPin,
  Check,
  DollarSign,
  Receipt,
  Star,
  Lock,
  Award,
  CreditCard
} from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);

  // Pricing data
  const pricingPlans = {
    starter: { monthly: 29 },
    professional: { monthly: 37 },
    enterprise: { monthly: 97 }
  };

  const calculatePrice = (monthlyPrice: number) => {
    if (isYearly) {
      // Yearly with 20% discount: monthly * 12 * 0.8
      const yearlyTotal = monthlyPrice * 12 * 0.8;
      return {
        display: Math.round(yearlyTotal),
        perMonth: (yearlyTotal / 12).toFixed(2)
      };
    }
    return {
      display: monthlyPrice,
      perMonth: monthlyPrice
    };
  };

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header navigate={navigate} />

      {/* Animated Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden pt-32" id="home">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            {/* Left Column - Text Content */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Business software that makes the hard part easy.
              </h1>
              
              <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed">
                Run your business smarter, not harder. Handle invoices, expenses, and reports effortlessly — all in one powerful platform.
              </p>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      size="lg" 
                      className="bg-primary hover:bg-primary/90 text-xl px-12 py-7 shadow-xl hover:shadow-primary/60 transition-all duration-300 font-semibold"
                      onClick={() => navigate("/auth")}
                    >
                      Get Started
                    </Button>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-lg px-8 py-7 shadow-lg border-2 border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-semibold"
                      asChild
                    >
                      <a href="tel:888-575-4776" className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Call Us Now
                      </a>
                    </Button>
                  </motion.div>
                </div>
                <p className="text-sm text-muted-foreground">
                  No setup fees • Cancel anytime
                </p>
              </div>
            </motion.div>

            {/* Right Column - Animated Dashboard */}
            <div className="relative h-[600px] hidden lg:block">
              {/* Floating Invoice Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="absolute top-0 right-0 w-80 bg-card rounded-2xl shadow-2xl p-6 border border-border/50"
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/20 p-2 rounded-lg">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-semibold">Invoice #1247</span>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, type: "spring" }}
                    className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-semibold"
                  >
                    Paid
                  </motion.div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Client</span>
                    <span className="font-medium">Acme Corp</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Due Date</span>
                    <span className="font-medium">Jan 15, 2025</span>
                  </div>
                  <div className="border-t border-border/50 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total</span>
                      <motion.span 
                        className="text-2xl font-bold text-primary"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.2, type: "spring" }}
                      >
                        $2,450.00
                      </motion.span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Dashboard Stats Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="absolute top-48 left-0 w-72 bg-card rounded-2xl shadow-2xl p-6 border border-border/50"
              >
                <h3 className="text-sm font-semibold text-muted-foreground mb-4">This Month</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/20 p-2 rounded-lg">
                        <DollarSign className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">Revenue</span>
                    </div>
                    <motion.span 
                      className="font-bold text-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                    >
                      $12,450
                    </motion.span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/20 p-2 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">Growth</span>
                    </div>
                    <motion.span 
                      className="font-bold text-lg text-primary"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.7 }}
                    >
                      +24%
                    </motion.span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/20 p-2 rounded-lg">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">Invoices</span>
                    </div>
                    <motion.span 
                      className="font-bold text-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.9 }}
                    >
                      28
                    </motion.span>
                  </div>
                </div>
              </motion.div>

              {/* Expense Report Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="absolute bottom-0 right-12 w-64 bg-card rounded-2xl shadow-2xl p-5 border border-border/50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold text-sm">Recent Expenses</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: "Office Supplies", amount: "$125" },
                    { name: "Software License", amount: "$89" },
                    { name: "Marketing Ads", amount: "$340" },
                  ].map((expense, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2 + i * 0.1 }}
                      className="flex justify-between items-center text-sm py-2 border-b border-border/30 last:border-0"
                    >
                      <span className="text-muted-foreground">{expense.name}</span>
                      <span className="font-semibold">{expense.amount}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Checkmark Animations */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 2.5, type: "spring", stiffness: 200 }}
                className="absolute top-24 left-20 bg-primary rounded-full p-3 shadow-lg"
              >
                <Check className="h-6 w-6 text-primary-foreground" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-12 bg-card/30 overflow-hidden">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold">Customers and businesses love MAJR Books</h2>
          </motion.div>
          
          <div className="relative">
            <motion.div
              className="flex gap-8"
              animate={{
                x: [0, -1200],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 20,
                  ease: "linear",
                },
              }}
            >
              {/* First set of reviews */}
              {[
                { name: "SoftwareAdvice", rating: 4.5 },
                { name: "G2", rating: 4.7 },
                { name: "Capterra", rating: 4.6 },
                { name: "TrustPilot", rating: 4.5 },
              ].map((review, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 min-w-[250px]"
                >
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className={`h-5 w-5 ${
                          starIndex < Math.floor(review.rating)
                            ? "fill-primary text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold">{review.rating}</span>
                  <span className="text-sm text-muted-foreground">{review.name}</span>
                </div>
              ))}
              
              {/* Duplicated set for seamless loop */}
              {[
                { name: "SoftwareAdvice", rating: 4.5 },
                { name: "G2", rating: 4.7 },
                { name: "Capterra", rating: 4.6 },
                { name: "TrustPilot", rating: 4.5 },
              ].map((review, i) => (
                <div
                  key={`duplicate-${i}`}
                  className="flex flex-col items-center gap-2 min-w-[250px]"
                >
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className={`h-5 w-5 ${
                          starIndex < Math.floor(review.rating)
                            ? "fill-primary text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold">{review.rating}</span>
                  <span className="text-sm text-muted-foreground">{review.name}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features / Benefits Section */}
      <section className="py-20 bg-card/30" id="features">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Why Choose MAJR Books</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your business finances with confidence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-card rounded-2xl p-8 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="bg-primary/10 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <FileText className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Easy Expense Tracking</h3>
              <p className="text-muted-foreground">
                Capture and organize expenses effortlessly with our intuitive interface 
                and smart categorization.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="bg-primary/10 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Quick Invoice Creation</h3>
              <p className="text-muted-foreground">
                Generate professional invoices in seconds and get paid faster with 
                automated reminders.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="bg-primary/10 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">AI-Assisted Categorization</h3>
              <div className="inline-block bg-primary/20 text-primary text-xs font-semibold px-2 py-1 rounded mb-2">
                Coming Soon
              </div>
              <p className="text-muted-foreground">
                Let AI suggest categories for your transactions, helping reduce 
                manual data entry time.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="bg-primary/10 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <TrendingUp className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Real-Time Financial Insights</h3>
              <p className="text-muted-foreground">
                View your financial performance at a glance with interactive dashboards 
                and custom reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">MAJR Books vs Traditional Bookkeeping</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how our modern platform compares to traditional bookkeeping methods
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-12">
            {/* Comparison Table */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-4 font-semibold">Feature</th>
                        <th className="text-center p-4 font-semibold bg-primary/10 text-primary">MAJR Books</th>
                        <th className="text-center p-4 font-semibold text-muted-foreground">Traditional</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/30">
                        <td className="p-4 text-sm">Real-time Dashboard</td>
                        <td className="p-4 text-center bg-primary/5">
                          <Check className="h-5 w-5 text-primary mx-auto" />
                        </td>
                        <td className="p-4 text-center text-muted-foreground">✕</td>
                      </tr>
                      <tr className="border-b border-border/30">
                        <td className="p-4 text-sm">Automated Categorization</td>
                        <td className="p-4 text-center bg-primary/5">
                          <Check className="h-5 w-5 text-primary mx-auto" />
                        </td>
                        <td className="p-4 text-center text-muted-foreground">✕</td>
                      </tr>
                      <tr className="border-b border-border/30">
                        <td className="p-4 text-sm">Instant Invoice Creation</td>
                        <td className="p-4 text-center bg-primary/5">
                          <Check className="h-5 w-5 text-primary mx-auto" />
                        </td>
                        <td className="p-4 text-center text-muted-foreground">Manual</td>
                      </tr>
                      <tr className="border-b border-border/30">
                        <td className="p-4 text-sm">Cloud Access 24/7</td>
                        <td className="p-4 text-center bg-primary/5">
                          <Check className="h-5 w-5 text-primary mx-auto" />
                        </td>
                        <td className="p-4 text-center text-muted-foreground">✕</td>
                      </tr>
                      <tr className="border-b border-border/30">
                        <td className="p-4 text-sm">Bank Integration</td>
                        <td className="p-4 text-center bg-primary/5">
                          <Check className="h-5 w-5 text-primary mx-auto" />
                        </td>
                        <td className="p-4 text-center text-muted-foreground">✕</td>
                      </tr>
                      <tr className="border-b border-border/30">
                        <td className="p-4 text-sm">Custom Reports</td>
                        <td className="p-4 text-center bg-primary/5">
                          <Check className="h-5 w-5 text-primary mx-auto" />
                        </td>
                        <td className="p-4 text-center text-muted-foreground">Limited</td>
                      </tr>
                      <tr className="border-b border-border/30">
                        <td className="p-4 text-sm">Mobile App Access</td>
                        <td className="p-4 text-center bg-primary/5">
                          <Check className="h-5 w-5 text-primary mx-auto" />
                        </td>
                        <td className="p-4 text-center text-muted-foreground">✕</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-semibold">Setup Time</td>
                        <td className="p-4 text-center bg-primary/5 font-semibold text-primary">5 minutes</td>
                        <td className="p-4 text-center text-muted-foreground font-semibold">Days/Weeks</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-card/30" id="pricing">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Choose the plan that fits your business needs. No setup fees, cancel anytime.
              </p>
            </motion.div>

            {/* Monthly/Yearly Toggle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex items-center justify-center gap-4 mb-12"
            >
              <span className={`text-lg font-medium transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsYearly(!isYearly)}
                className="relative w-16 h-8 rounded-full p-0 border-2 border-primary hover:bg-transparent"
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-primary transition-all duration-300 ${isYearly ? 'left-[calc(100%-1.5rem)]' : 'left-1'}`} />
              </Button>
              <span className={`text-lg font-medium transition-colors ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>Yearly</span>
              <span className="text-sm bg-primary/20 text-primary px-3 py-1 rounded-full font-semibold">Save 20%</span>
            </motion.div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-card rounded-2xl border border-border/50 p-8 hover:shadow-xl transition-all hover:-translate-y-2"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Starter</h3>
                <p className="text-muted-foreground mb-4">Perfect for freelancers</p>
                <div className="mb-4">
                  <span className="text-5xl font-bold">
                    ${calculatePrice(pricingPlans.starter.monthly).display}
                  </span>
                  <span className="text-muted-foreground">
                    {isYearly ? '/year' : '/month'}
                  </span>
                  {isYearly && (
                    <div className="text-sm text-muted-foreground mt-2">
                      ${calculatePrice(pricingPlans.starter.monthly).perMonth}/month billed yearly
                    </div>
                  )}
                </div>
                <Button 
                  className="w-full bg-card border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  size="lg"
                  onClick={() => navigate("/auth")}
                >
                  Get Started
                </Button>
              </div>
              <div className="space-y-4">
                {[
                  "Track income & expenses",
                  "Send unlimited custom invoices & quotes",
                  "Connect your bank",
                  "Track GST and VAT",
                  "Insights & reports",
                  "Progress invoicing",
                  "Up to 250 items in Chart of Accounts",
                  "For one user, plus your accountant"
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Professional Plan - Most Popular */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-card rounded-2xl border-2 border-primary p-8 hover:shadow-2xl transition-all hover:-translate-y-2 relative"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Professional</h3>
                <p className="text-muted-foreground mb-4">For growing businesses</p>
                <div className="mb-4">
                  <span className="text-5xl font-bold">
                    ${calculatePrice(pricingPlans.professional.monthly).display}
                  </span>
                  <span className="text-muted-foreground">
                    {isYearly ? '/year' : '/month'}
                  </span>
                  {isYearly && (
                    <div className="text-sm text-muted-foreground mt-2">
                      ${calculatePrice(pricingPlans.professional.monthly).perMonth}/month billed yearly
                    </div>
                  )}
                </div>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                  onClick={() => navigate("/auth")}
                >
                  Get Started
                </Button>
              </div>
              <div className="space-y-4">
                {[
                  "Everything in Starter, plus:",
                  "Manage bills & payments",
                  "Track employee time",
                  "Multi-currency",
                  "For three users, plus your accountant",
                  "Recurring transactions and bills",
                  "Track inventory",
                  "Manage budgets",
                  "Up to 40 classes and locations",
                  "For five users, plus your accountant"
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-card rounded-2xl border border-border/50 p-8 hover:shadow-xl transition-all hover:-translate-y-2"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <p className="text-muted-foreground mb-4">For established companies</p>
                <div className="mb-4">
                  <span className="text-5xl font-bold">
                    ${calculatePrice(pricingPlans.enterprise.monthly).display}
                  </span>
                  <span className="text-muted-foreground">
                    {isYearly ? '/year' : '/month'}
                  </span>
                  {isYearly && (
                    <div className="text-sm text-muted-foreground mt-2">
                      ${calculatePrice(pricingPlans.enterprise.monthly).perMonth}/month billed yearly
                    </div>
                  )}
                </div>
                <Button 
                  className="w-full bg-card border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  size="lg"
                  onClick={() => navigate("/auth")}
                >
                  Get Started
                </Button>
              </div>
              <div className="space-y-4">
                {[
                  "Everything in Professional, plus:",
                  "UNLIMITED items in Chart of Accounts",
                  "UNLIMITED classes and locations",
                  "Data sync with Excel",
                  "Customise role permissions",
                  "Manage users (up to 25)",
                  "Automate workflows",
                  "Custom reporting fields",
                  "Customise dashboards",
                  "Backup online & restore data",
                  "Manage revenue recognition"
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground font-semibold={feature.includes('UNLIMITED') ? true : undefined}">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12"
          >
            <p className="text-muted-foreground">
              All plans include free updates, 24/7 support, and bank-level security
            </p>
          </motion.div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Ready to Transform Your Bookkeeping?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of small businesses managing their finances with MAJR Books
            </p>
            <div className="flex flex-col items-center justify-center gap-2">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-xl px-12 py-7 shadow-xl hover:shadow-primary/60 transition-all duration-300 font-semibold"
                onClick={() => navigate("/auth")}
              >
                Get Started
              </Button>
              <p className="text-sm text-muted-foreground">
                No setup fees • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Trusted & Secure</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your data security is our top priority. We use industry-leading security standards.
            </p>
          </motion.div>

          {/* Security Badges */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-12"
          >
            <div className="bg-card border border-border/50 rounded-xl p-6 text-center hover:shadow-lg transition-all">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">256-bit SSL</h4>
              <p className="text-sm text-muted-foreground">Bank-level encryption</p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 text-center hover:shadow-lg transition-all">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">SOC 2 Certified</h4>
              <p className="text-sm text-muted-foreground">Industry compliance</p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 text-center hover:shadow-lg transition-all">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">GDPR Compliant</h4>
              <p className="text-sm text-muted-foreground">Data protection</p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 text-center hover:shadow-lg transition-all">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">PCI DSS Level 1</h4>
              <p className="text-sm text-muted-foreground">Payment security</p>
            </div>
          </motion.div>

          {/* Partner Logos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="border-t border-border/50 pt-12"
          >
            <p className="text-center text-sm text-muted-foreground mb-8">
              Trusted by thousands of businesses and integrated with leading platforms
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center max-w-4xl mx-auto">
              {["QuickBooks", "Xero", "Stripe", "PayPal"].map((partner, i) => (
                <div
                  key={i}
                  className="bg-card/50 border border-border/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors"
                >
                  <p className="font-semibold text-muted-foreground">{partner}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-card/30" id="contact">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Contact Us</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ready to transform your bookkeeping? Get in touch with our team today.
            </p>
          </motion.div>

          <ContactForm />
        </div>
      </section>

      {/* Chat Widget */}
      <ChatWidget />

      {/* Footer */}
      <footer className="bg-card/50 border-t border-border/50 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <img 
                  src={logoImage} 
                  alt="MAJR Books Logo" 
                  className="h-12 w-auto object-contain"
                />
              </div>
              <p className="text-muted-foreground text-sm">
                Professional accounting and tax services for small businesses.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#about" className="hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#services" className="hover:text-foreground transition-colors">Services</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#resources" className="hover:text-foreground transition-colors">Resources</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Tax Preparation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Bookkeeping</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Payroll Services</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Business Advisory</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact Info</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>888-575-4776</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>support@majrtaxsoftware.com</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-1" />
                  <span>6085 Raeford Rd Suite 110<br />Fayetteville, NC 28304</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 MAJR Books. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
