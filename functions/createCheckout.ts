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

    const { priceId, successUrl, cancelUrl } = await req.json();

    console.log('Creating checkout session for:', user.email, 'priceId:', priceId);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || 'https://apexshield.com.br/Assinatura?status=success',
      cancel_url: cancelUrl || 'https://apexshield.com.br/Assinatura?status=cancel',
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        user_email: user.email,
        user_id: user.id,
      },
    });

    console.log('Checkout session created:', session.id);

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});