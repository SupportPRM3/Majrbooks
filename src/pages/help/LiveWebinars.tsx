import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Video, 
  Calendar, 
  Clock, 
  Users,
  Play,
  CheckCircle,
  Star,
  CalendarPlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LiveWebinars = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [registeredWebinars, setRegisteredWebinars] = useState<string[]>([]);

  const upcomingWebinars = [
    {
      id: "1",
      title: "Getting Started with MAJR Books",
      description: "A comprehensive introduction for new users. Learn to set up your account, connect banks, and navigate the dashboard.",
      date: "December 15, 2024",
      time: "2:00 PM EST",
      duration: "45 min",
      host: "Sarah Johnson",
      hostRole: "Customer Success Manager",
      attendees: 156,
      level: "Beginner",
      topics: ["Account Setup", "Dashboard Navigation", "Bank Connections", "First Invoice"]
    },
    {
      id: "2",
      title: "Mastering Invoice Automation",
      description: "Learn how to set up recurring invoices, automate reminders, and streamline your billing workflow.",
      date: "December 18, 2024",
      time: "1:00 PM EST",
      duration: "60 min",
      host: "Michael Chen",
      hostRole: "Product Specialist",
      attendees: 89,
      level: "Intermediate",
      topics: ["Recurring Invoices", "Payment Reminders", "Invoice Templates", "Workflow Automation"]
    },
    {
      id: "3",
      title: "Year-End Tax Preparation Workshop",
      description: "Prepare for tax season with expert tips on organizing your financials, generating reports, and maximizing deductions.",
      date: "December 20, 2024",
      time: "11:00 AM EST",
      duration: "90 min",
      host: "David Martinez, CPA",
      hostRole: "Tax Advisor",
      attendees: 234,
      level: "All Levels",
      topics: ["Tax Reports", "Deduction Tracking", "1099 Preparation", "Year-End Close"]
    },
    {
      id: "4",
      title: "Advanced Reporting & Analytics",
      description: "Dive deep into MAJR Books reporting capabilities. Create custom reports, analyze trends, and make data-driven decisions.",
      date: "January 8, 2025",
      time: "3:00 PM EST",
      duration: "60 min",
      host: "Lisa Park",
      hostRole: "Analytics Lead",
      attendees: 67,
      level: "Advanced",
      topics: ["Custom Reports", "Data Visualization", "Trend Analysis", "Export Options"]
    },
    {
      id: "5",
      title: "Payroll Management Essentials",
      description: "Everything you need to know about running payroll, managing employees, and staying compliant.",
      date: "January 12, 2025",
      time: "2:00 PM EST",
      duration: "75 min",
      host: "Amanda Roberts",
      hostRole: "Payroll Specialist",
      attendees: 112,
      level: "Intermediate",
      topics: ["Employee Setup", "Pay Runs", "Tax Compliance", "Benefits Management"]
    }
  ];

  const pastWebinars = [
    {
      id: "p1",
      title: "Introduction to Expense Tracking",
      date: "November 28, 2024",
      duration: "45 min",
      views: "1.2k",
      rating: 4.8
    },
    {
      id: "p2",
      title: "Bank Reconciliation Made Easy",
      date: "November 21, 2024",
      duration: "50 min",
      views: "890",
      rating: 4.9
    },
    {
      id: "p3",
      title: "Multi-Client Management for Accountants",
      date: "November 14, 2024",
      duration: "60 min",
      views: "2.1k",
      rating: 4.7
    },
    {
      id: "p4",
      title: "Chart of Accounts Best Practices",
      date: "November 7, 2024",
      duration: "40 min",
      views: "756",
      rating: 4.6
    },
    {
      id: "p5",
      title: "Contractor Management & 1099 Filing",
      date: "October 31, 2024",
      duration: "55 min",
      views: "1.5k",
      rating: 4.9
    }
  ];

  const handleRegister = (webinarId: string, title: string) => {
    if (registeredWebinars.includes(webinarId)) {
      toast({
        title: "Already registered",
        description: "You're already registered for this webinar.",
      });
      return;
    }
    
    setRegisteredWebinars([...registeredWebinars, webinarId]);
    toast({
      title: "Registration successful!",
      description: `You're registered for "${title}". Check your email for details.`,
    });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "Intermediate":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "Advanced":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header navigate={navigate} />

      <section className="pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-5xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/resources")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Resources
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-primary/10 p-4 rounded-xl">
                <Video className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Live Training Webinars</h1>
                <p className="text-muted-foreground mt-2">
                  Join our weekly live sessions to learn new features and get your questions answered
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="text-center p-4">
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Monthly Sessions</div>
              </Card>
              <Card className="text-center p-4">
                <div className="text-2xl font-bold text-primary">10k+</div>
                <div className="text-sm text-muted-foreground">Attendees</div>
              </Card>
              <Card className="text-center p-4">
                <div className="text-2xl font-bold text-primary">4.8★</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </Card>
            </div>

            <Tabs defaultValue="upcoming" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="upcoming" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Upcoming
                </TabsTrigger>
                <TabsTrigger value="recordings" className="gap-2">
                  <Play className="h-4 w-4" />
                  Recordings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                <div className="space-y-4">
                  {upcomingWebinars.map((webinar) => (
                    <Card key={webinar.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={getLevelColor(webinar.level)}>
                                {webinar.level}
                              </Badge>
                              {registeredWebinars.includes(webinar.id) && (
                                <Badge className="bg-primary/10 text-primary border-primary/20">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Registered
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{webinar.title}</h3>
                            <p className="text-muted-foreground mb-3">{webinar.description}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              {webinar.topics.map((topic, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {webinar.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {webinar.time} ({webinar.duration})
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {webinar.attendees} registered
                              </span>
                            </div>
                            <p className="text-sm mt-2">
                              <span className="text-muted-foreground">Hosted by </span>
                              <span className="font-medium">{webinar.host}</span>
                              <span className="text-muted-foreground">, {webinar.hostRole}</span>
                            </p>
                          </div>
                          
                          <div className="lg:text-right">
                            <Button
                              onClick={() => handleRegister(webinar.id, webinar.title)}
                              disabled={registeredWebinars.includes(webinar.id)}
                              className="gap-2"
                            >
                              {registeredWebinars.includes(webinar.id) ? (
                                <>
                                  <CheckCircle className="h-4 w-4" />
                                  Registered
                                </>
                              ) : (
                                <>
                                  <CalendarPlus className="h-4 w-4" />
                                  Register Free
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="recordings">
                <div className="grid md:grid-cols-2 gap-4">
                  {pastWebinars.map((webinar) => (
                    <Card key={webinar.id} className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <Play className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            <span className="font-medium">{webinar.rating}</span>
                          </div>
                        </div>
                        <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                          {webinar.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{webinar.date}</span>
                          <span>{webinar.duration}</span>
                          <span>{webinar.views} views</span>
                        </div>
                        <Button variant="link" className="p-0 h-auto mt-3 gap-1">
                          Watch Recording <Play className="h-3 w-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="text-center mt-8">
                  <Button variant="outline" size="lg">
                    View All Recordings
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Newsletter Signup */}
            <Card className="mt-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-2">Never Miss a Webinar</h3>
                <p className="text-muted-foreground mb-6">
                  Subscribe to get notified about upcoming training sessions and new recordings.
                </p>
                <div className="flex justify-center gap-4">
                  <Button 
                    onClick={() => toast({
                      title: "Subscribed!",
                      description: "You'll receive notifications about upcoming webinars.",
                    })}
                  >
                    Subscribe to Updates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LiveWebinars;
