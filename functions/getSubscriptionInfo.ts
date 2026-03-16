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
      return Response.json({ active: false });
    }

    const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
    console.log('Subscription retrieved:', subscription.id, 'status:', subscription.status);

    return Response.json({
      active: subscription.status === 'active',
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      interval: subscription.items.data[0]?.price?.recurring?.interval || 'month',
      created: subscription.created,
    });
  } catch (error) {
    console.error('Error getting subscription info:', error.message);
    return Response.json({ active: false, error: error.message });
  }
});