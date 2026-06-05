import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { getTierByProductId, SubscriptionTier, TRIAL_DURATION_DAYS } from "@/lib/subscriptionTiers";

type AppRole = 'admin' | 'user' | 'client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  subscriptionTier: SubscriptionTier | null;
  subscribed: boolean;
  subscriptionEnd: string | null;
  isTrial: boolean;
  isStripeTrial: boolean;
  trialDaysRemaining: number | null;
  canCancel: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, businessName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [isTrial, setIsTrial] = useState(false);
  const [isStripeTrial, setIsStripeTrial] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const [canCancel, setCanCancel] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('app_user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    const userRole = (!error && data) ? data.role as AppRole : 'user';
    setRole(userRole);
  };

  const checkSubscription = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      
      // Admin users get full access from the backend
      if (data.is_admin) {
        setSubscribed(true);
        setSubscriptionTier('enterprise');
        setIsTrial(false);
        setIsStripeTrial(false);
        setTrialDaysRemaining(null);
        setSubscriptionEnd(null);
        setCanCancel(false);
        return;
      }
      
      setSubscribed(data.subscribed || false);
      setIsTrial(data.is_trial || false);
      setIsStripeTrial(data.is_stripe_trial || false);
      setCanCancel(data.can_cancel || false);
      
      if (data.is_trial || data.is_stripe_trial) {
        // During free trial, give full access (trial tier has all features)
        setSubscriptionTier('trial');
        
        const trialEndDate = data.trial_ends_at || data.subscription_end;
        setSubscriptionEnd(trialEndDate || null);
        
        // Calculate days remaining
        if (trialEndDate) {
          const endDate = new Date(trialEndDate);
          const now = new Date();
          const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          setTrialDaysRemaining(Math.max(0, daysRemaining));
        }
      } else if (data.subscribed && data.product_id) {
        // Active paid subscription - features based on their chosen plan
        setSubscriptionTier(getTierByProductId(data.product_id));
        setSubscriptionEnd(data.subscription_end || null);
        setTrialDaysRemaining(null);
      } else {
        // No active subscription and trial expired - no tier access
        setSubscriptionTier(null);
        setSubscriptionEnd(null);
        setTrialDaysRemaining(null);
      }
    } catch (err) {
      console.error('Failed to check subscription:', err);
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Failed to open customer portal:', err);
    }
  };

  const sendLoginNotification = async (email: string, fullName: string | undefined, eventType: 'login' | 'signup') => {
    try {
      await supabase.functions.invoke('send-login-notification', {
        body: {
          email,
          fullName,
          eventType,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('Failed to send login notification:', err);
    }
  };

  const startFreeTrial = async (userId: string) => {
    try {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DURATION_DAYS);
      
      const { error } = await supabase
        .from('profiles')
        .update({ trial_ends_at: trialEndDate.toISOString() })
        .eq('id', userId);
      
      if (error) {
        console.error('Failed to start free trial:', error);
      }
    } catch (err) {
      console.error('Error starting free trial:', err);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setSubscribed(false);
          setSubscriptionTier(null);
          setSubscriptionEnd(null);
          setIsTrial(false);
          setTrialDaysRemaining(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check subscription when session changes
  useEffect(() => {
    if (session) {
      checkSubscription();
    }
  }, [session]);

  // Periodic subscription check every 60 seconds
  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(() => {
      checkSubscription();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [session]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.user) {
      // Send login notification
      sendLoginNotification(email, data.user.user_metadata?.full_name, 'login');
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, businessName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: fullName,
          business_name: businessName,
        },
      },
    });
    
    if (!error && data.user) {
      // Start free trial for new users
      await startFreeTrial(data.user.id);
      
      // Send signup notification
      sendLoginNotification(email, fullName, 'signup');
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setSubscribed(false);
    setSubscriptionTier(null);
    setSubscriptionEnd(null);
    setIsTrial(false);
    setIsStripeTrial(false);
    setTrialDaysRemaining(null);
    setCanCancel(false);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      role,
      subscriptionTier,
      subscribed,
      subscriptionEnd,
      isTrial,
      isStripeTrial,
      trialDaysRemaining,
      canCancel,
      signIn, 
      signUp, 
      signOut,
      checkSubscription,
      openCustomerPortal,
      loading,
      isAdmin: role === 'admin',
      isClient: role === 'client'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
