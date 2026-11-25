import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface Subscription {
  status: 'trialing' | 'active' | 'canceled' | 'expired' | 'none';
  plan: string | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription>({
    status: 'none',
    plan: null,
    currentPeriodEnd: null,
    trialEnd: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({ status: 'none', plan: null, currentPeriodEnd: null, trialEnd: null });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        setSubscription({ status: 'none', plan: null, currentPeriodEnd: null, trialEnd: null });
      } else if (!data) {
        setSubscription({ status: 'none', plan: null, currentPeriodEnd: null, trialEnd: null });
      } else {
        // Check if subscription has expired
        const periodEnd = data.current_period_end ? new Date(data.current_period_end) : null;
        const trialEnd = data.trial_end ? new Date(data.trial_end) : null;
        const now = new Date();

        let status = data.status as Subscription['status'];

        // If active but period has ended, mark as expired
        if (status === 'active' && periodEnd && periodEnd < now) {
          status = 'expired';
        }
        // If trialing but trial has ended, mark as expired
        if (status === 'trialing' && trialEnd && trialEnd < now) {
          status = 'expired';
        }

        setSubscription({
          status,
          plan: data.plan,
          currentPeriodEnd: data.current_period_end,
          trialEnd: data.trial_end,
        });
      }
    } catch (err) {
      console.error('Subscription fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isPremium = subscription.status === 'active' || subscription.status === 'trialing';

  const createPayment = async (promoCode?: string) => {
    if (!user) throw new Error('Debes iniciar sesión');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Sesión expirada');

    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(promoCode ? { promoCode } : {}),
      }
    );

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || 'Error al crear pago');
    }

    const data = await resp.json();
    return data as { paymentUrl: string; commerceOrder: string; token: string; amount: number };
  };

  return {
    subscription,
    isPremium,
    loading,
    createPayment,
    refresh: fetchSubscription,
  };
}
