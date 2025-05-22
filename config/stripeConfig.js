/**
 * Configurazione di Stripe per l'ambiente di sviluppo e produzione
 * Questo file gestisce la configurazione di Stripe in base all'ambiente
 */

const isDemoMode = process.env.STRIPE_DEMO_MODE === 'true';

// Implementazione di un client Stripe fittizio per la modalità demo
class StripeDemo {
  constructor() {
    this.products = {
      create: async (data) => ({
        id: `prod_demo_${Date.now()}`,
        name: data.name,
        description: data.description,
        images: data.images || []
      }),
      update: async (id, data) => ({
        id,
        name: data.name,
        description: data.description,
        images: data.images || []
      })
    };

    this.prices = {
      create: async (data) => ({
        id: `price_demo_${Date.now()}`,
        product: data.product,
        unit_amount: data.unit_amount,
        currency: data.currency
      })
    };

    this.checkout = {
      sessions: {
        create: async (data) => ({
          id: `cs_demo_${Date.now()}`,
          url: `${process.env.FRONTEND_URL}/checkout/demo?session_id=cs_demo_${Date.now()}`,
          payment_status: 'paid'
        })
      }
    };

    this.webhooks = {
      constructEvent: (payload, signature, secret) => ({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: `cs_demo_${Date.now()}`,
            payment_status: 'paid',
            client_reference_id: payload.client_reference_id || 'demo_user',
            metadata: payload.metadata || {}
          }
        }
      })
    };
  }
}

// Esporta il client Stripe appropriato in base alla modalità
let stripeClient;

if (isDemoMode) {
  console.log('⚠️ Stripe in modalità DEMO - Nessuna transazione reale verrà effettuata');
  stripeClient = new StripeDemo();
} else {
  // Utilizza il client Stripe reale con la chiave API
  const stripe = require('stripe');
  stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
}

module.exports = stripeClient;