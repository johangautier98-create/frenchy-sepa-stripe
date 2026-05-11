import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  }

  try {
    const { company, email, contactName } = req.body || {};

    if (!company || !email) {
      return res.status(400).json({
        ok: false,
        error: 'Entreprise et email obligatoires'
      });
    }

    const publicUrl = process.env.PUBLIC_URL || `https://${req.headers.host}`;

    const customer = await stripe.customers.create({
      email,
      name: company,
      metadata: {
        company,
        contactName: contactName || '',
        source: 'Frenchy Leurres - Activation mandat SEPA'
      }
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customer.id,
      payment_method_types: ['sepa_debit'],
      success_url: `${publicUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${publicUrl}/cancel.html`,
      locale: 'fr',
      metadata: {
        company,
        email,
        contactName: contactName || ''
      }
    });

    return res.status(200).json({
      ok: true,
      url: session.url,
      customerId: customer.id,
      sessionId: session.id
    });
  } catch (err) {
    console.error('Erreur create-sepa-setup:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Erreur serveur Stripe'
    });
  }
}
