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
    const { customerId, amountEuros, invoiceNumber, description } = req.body || {};

    if (!customerId || !amountEuros) {
      return res.status(400).json({
        ok: false,
        error: 'customerId et amountEuros obligatoires'
      });
    }

    const amount = Math.round(Number(amountEuros) * 100);
    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ ok: false, error: 'Montant invalide' });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'sepa_debit'
    });

    const paymentMethod = paymentMethods.data?.[0];
    if (!paymentMethod) {
      return res.status(404).json({
        ok: false,
        error: 'Aucun mandat SEPA trouvé pour ce client Stripe'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      customer: customerId,
      payment_method: paymentMethod.id,
      payment_method_types: ['sepa_debit'],
      confirm: true,
      off_session: true,
      description: description || `Prélèvement facture ${invoiceNumber || ''}`.trim(),
      metadata: {
        invoiceNumber: invoiceNumber || '',
        source: 'Frenchy Leurres - prélèvement facture'
      }
    });

    return res.status(200).json({
      ok: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amountEuros: amount / 100
    });
  } catch (err) {
    console.error('Erreur charge-sepa:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Erreur serveur Stripe'
    });
  }
}
