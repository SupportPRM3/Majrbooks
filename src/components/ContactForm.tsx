import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  phone: z
    .string()
    .trim()
    .min(1, { message: "Phone is required" })
    .max(20, { message: "Phone must be less than 20 characters" }),
  message: z
    .string()
    .trim()
    .min(1, { message: "Message is required" })
    .max(1000, { message: "Message must be less than 1000 characters" }),
});

type ContactFormData = z.infer<typeof contactSchema>;

export const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: response, error } = await supabase.functions.invoke("send-contact-form", {
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message,
        },
      });

      if (error) throw error;
      
      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24 hours.",
      });
      
      form.reset();
    } catch (error: any) {
      console.error("Contact form error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
      {/* Contact Information */}
      <div className="space-y-8">
        <div>
          <h3 className="text-3xl font-bold mb-4">Get in Touch</h3>
          <p className="text-lg text-muted-foreground">
            Have questions? We're here to help. Reach out to our team and we'll respond as soon as possible.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 rounded-full p-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Email Us</h4>
              <a 
                href="mailto:support@majrtaxsoftware.com" 
                className="text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                support@majrtaxsoftware.com
              </a>
              <p className="text-sm text-muted-foreground">We'll reply within 24 hours</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-primary/10 rounded-full p-3">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Call Us</h4>
              <a 
                href="tel:888-575-4776" 
                className="text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                888-575-4776
              </a>
              <div className="text-sm text-muted-foreground space-y-1 mt-1">
                <p>Mon - Fri (10:00 am - 5:00 pm)</p>
                <p>Saturday (Appointment Only)</p>
                <p>Sunday (Closed)</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-primary/10 rounded-full p-3">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Visit Us</h4>
              <p className="text-muted-foreground">
                6085 Raeford Rd Suite 110<br />
                Fayetteville, North Carolina 28304
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-card border border-border/50 rounded-2xl p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us how we can help..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};
