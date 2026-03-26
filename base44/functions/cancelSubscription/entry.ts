import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.stripe_subscription_id) {
      return Response.json({ error: 'Nenhuma assinatura encontrada' }, { status: 400 });
    }

    const { action } = await req.json();

    if (action === 'cancel') {
      // Cancel at end of period (not immediate)
      const subscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      console.log('Subscription set to cancel at period end:', subscription.id);
      return Response.json({ success: true, cancel_at_period_end: true });
    }

    if (action === 'reactivate') {
      // Reactivate a subscription that was set to cancel
      const subscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
        cancel_at_period_end: false,
      });
      console.log('Subscription reactivated:', subscription.id);
      return Response.json({ success: true, cancel_at_period_end: false });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Error managing subscription:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});