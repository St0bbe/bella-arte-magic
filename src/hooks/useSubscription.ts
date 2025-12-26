import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionData {
  subscribed: boolean;
  status: "active" | "trial" | "expired";
  subscription_end: string | null;
  plan: "monthly" | "yearly" | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSubscription(null);
        return;
      }

      const response = await supabase.functions.invoke("check-subscription");
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      setSubscription(response.data);
    } catch (err: any) {
      console.error("Error checking subscription:", err);
      setError(err.message);
      // Default to trial if there's an error
      setSubscription({
        subscribed: false,
        status: "trial",
        subscription_end: null,
        plan: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscription();

    // Re-check every minute
    const interval = setInterval(checkSubscription, 60000);

    // Listen for auth changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      clearInterval(interval);
      authSub.unsubscribe();
    };
  }, [checkSubscription]);

  const openCustomerPortal = async () => {
    try {
      const response = await supabase.functions.invoke("customer-portal");
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      const { url } = response.data;
      if (url) {
        window.open(url, "_blank");
      }
    } catch (err: any) {
      console.error("Error opening customer portal:", err);
      throw err;
    }
  };

  return {
    subscription,
    isLoading,
    error,
    checkSubscription,
    openCustomerPortal,
    isSubscribed: subscription?.subscribed ?? false,
    isExpired: subscription?.status === "expired",
    isTrial: subscription?.status === "trial",
  };
}
