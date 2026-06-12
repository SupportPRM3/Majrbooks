import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, User, Loader2, RefreshCw, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "How do I import bank transactions?",
  "Where can I find my invoices?",
  "How do I reconcile my bank account?",
  "How do I add a new client?",
  "How do I run a profit & loss report?",
];

const ClientSupport = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-support", {
        body: {
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;
      if (!data?.reply) throw new Error("Empty response from assistant");

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Support chat unavailable",
        description: "Please try again or contact support@prm3tax.com",
      });
      // Remove the user message so they can retry
      setMessages(messages);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
    textareaRef.current?.focus();
  };

  const formatMessage = (text: string) => {
    // Convert **bold** and numbered lists to simple JSX
    return text.split("\n").map((line, i) => {
      const boldified = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return (
        <p
          key={i}
          className={cn("leading-relaxed", line === "" ? "mt-2" : "")}
          dangerouslySetInnerHTML={{ __html: boldified }}
        />
      );
    });
  };

  return (
    <Layout>
      <div className="w-full max-w-3xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              MajrBooks Support
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Ask anything about the software — I'm here to help.
            </p>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              New chat
            </Button>
          )}
        </div>

        {/* Chat area */}
        <Card className="flex flex-col" style={{ height: "calc(100vh - 260px)", minHeight: 400 }}>
          <ScrollArea className="flex-1 px-4 pt-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 gap-6">
                <div className="bg-primary/10 p-5 rounded-full">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">How can I help you today?</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Ask me anything about MajrBooks features, billing, or bookkeeping.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-xs bg-muted hover:bg-muted/80 border rounded-full px-3 py-1.5 transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="bg-primary/10 p-1.5 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3 text-sm space-y-0.5",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted rounded-tl-sm"
                      )}
                    >
                      {formatMessage(msg.content)}
                    </div>
                    {msg.role === "user" && (
                      <div className="bg-secondary p-1.5 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="bg-primary/10 p-1.5 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-3 flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question… (Enter to send, Shift+Enter for new line)"
              className="resize-none text-sm min-h-[44px] max-h-32"
              rows={1}
              disabled={loading}
            />
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 h-11 w-11"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </Card>

        {/* Human escalation */}
        <Card className="bg-muted/30">
          <CardContent className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Need to speak with a human? Our team is ready to help.
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" asChild>
                <a href="mailto:support@prm3tax.com" className="gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="tel:888-575-4776" className="gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  888-575-4776
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ClientSupport;
