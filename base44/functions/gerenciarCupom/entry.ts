import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { action, codigo, desconto_percentual, max_usos, data_expiracao, duracao, duracao_meses, cupom_id } = await req.json();

    // CREATE coupon
    if (action === 'create') {
      console.log('Creating Stripe coupon:', codigo, desconto_percentual + '%');

      const couponParams = {
        percent_off: desconto_percentual,
        duration: duracao || 'once',
        name: `${codigo} - ${desconto_percentual}% OFF`,
      };

      if (duracao === 'repeating' && duracao_meses) {
        couponParams.duration_in_months = duracao_meses;
      }

      const stripeCoupon = await stripe.coupons.create(couponParams);
      console.log('Stripe coupon created:', stripeCoupon.id);

      // Create promotion code (user-facing code)
      const promoCodeParams = {
        coupon: stripeCoupon.id,
        code: codigo.toUpperCase(),
      };

      if (max_usos && max_usos > 0) {
        promoCodeParams.max_redemptions = max_usos;
      }

      if (data_expiracao) {
        promoCodeParams.expires_at = Math.floor(new Date(data_expiracao + 'T23:59:59').getTime() / 1000);
      }

      const promoCode = await stripe.promotionCodes.create(promoCodeParams);
      console.log('Stripe promotion code created:', promoCode.id, promoCode.code);

      return Response.json({
        success: true,
        stripe_coupon_id: stripeCoupon.id,
        stripe_promotion_code_id: promoCode.id,
      });
    }

    // DEACTIVATE coupon
    if (action === 'deactivate') {
      console.log('Deactivating coupon:', cupom_id);

      // Deactivate the promotion code in Stripe
      const cupons = await base44.asServiceRole.entities.CupomDesconto.filter({ id: cupom_id });
      if (cupons.length > 0 && cupons[0].stripe_promotion_code_id) {
        await stripe.promotionCodes.update(cupons[0].stripe_promotion_code_id, { active: false });
        console.log('Stripe promo code deactivated');
      }

      return Response.json({ success: true });
    }

    // ACTIVATE coupon
    if (action === 'activate') {
      console.log('Activating coupon:', cupom_id);

      const cupons = await base44.asServiceRole.entities.CupomDesconto.filter({ id: cupom_id });
      if (cupons.length > 0 && cupons[0].stripe_promotion_code_id) {
        await stripe.promotionCodes.update(cupons[0].stripe_promotion_code_id, { active: true });
        console.log('Stripe promo code activated');
      }

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing coupon:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});