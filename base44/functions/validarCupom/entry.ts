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

    const { codigo } = await req.json();

    if (!codigo || !codigo.trim()) {
      return Response.json({ valid: false, message: 'Código não informado' });
    }

    console.log('Validating coupon code:', codigo);

    // Search Stripe promotion codes by code
    const promoCodes = await stripe.promotionCodes.list({
      code: codigo.toUpperCase(),
      active: true,
      limit: 1,
    });

    if (promoCodes.data.length === 0) {
      console.log('Coupon not found or inactive:', codigo);
      return Response.json({ valid: false, message: 'Cupom inválido ou expirado' });
    }

    const promoCode = promoCodes.data[0];
    const coupon = promoCode.coupon;

    // Check if max redemptions reached
    if (promoCode.max_redemptions && promoCode.times_redeemed >= promoCode.max_redemptions) {
      console.log('Coupon max uses reached:', codigo);
      return Response.json({ valid: false, message: 'Cupom esgotado' });
    }

    // Check expiration
    if (promoCode.expires_at && promoCode.expires_at < Math.floor(Date.now() / 1000)) {
      console.log('Coupon expired:', codigo);
      return Response.json({ valid: false, message: 'Cupom expirado' });
    }

    console.log('Coupon valid:', codigo, coupon.percent_off + '% off');

    return Response.json({
      valid: true,
      desconto: coupon.percent_off,
      promotion_code_id: promoCode.id,
      duracao: coupon.duration,
      message: `Cupom válido! ${coupon.percent_off}% de desconto`,
    });
  } catch (error) {
    console.error('Error validating coupon:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});