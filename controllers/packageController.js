const Package = require('../models/Package');
const User = require('../models/User');
const stripe = require('../config/stripeConfig');

// Verifica se Stripe è in modalità demo
const isDemoMode = process.env.STRIPE_DEMO_MODE === 'true';

// Ottieni tutti i pacchetti disponibili (pubblico)
exports.getPackages = async (req, res) => {
  try {
    const query = { attivo: true };
    
    const packages = await Package.find(query)
      .select('-ordini -stripeProductId -stripePriceId')
      .sort({ prezzo: 1 });
      
    res.status(200).json(packages);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero dei pacchetti', error: error.message });
  }
};

// Ottieni un singolo pacchetto per ID (pubblico)
exports.getPackage = async (req, res) => {
  try {
    const package = await Package.findOne({ _id: req.params.id, attivo: true })
      .select('-ordini -stripeProductId -stripePriceId');
      
    if (!package) {
      return res.status(404).json({ message: 'Pacchetto non trovato o non più disponibile' });
    }
    
    res.status(200).json(package);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero del pacchetto', error: error.message });
  }
};

// Crea un nuovo pacchetto (solo admin)
exports.createPackage = async (req, res) => {
  try {
    const {
      nome,
      descrizione,
      prezzo,
      valuta,
      caratteristiche,
      immagine,
      durata
    } = req.body;
    
    // Crea prodotto e prezzo su Stripe
    const stripeProduct = await stripe.products.create({
      name: nome,
      description: descrizione,
      images: immagine ? [immagine] : []
    });
    
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: prezzo * 100, // Stripe usa i centesimi
      currency: valuta.toLowerCase()
    });
    
    const package = await Package.create({
      nome,
      descrizione,
      prezzo,
      valuta,
      caratteristiche,
      immagine,
      durata,
      attivo: true,
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id
    });
    
    res.status(201).json(package);
  } catch (error) {
    res.status(400).json({ message: 'Errore nella creazione del pacchetto', error: error.message });
  }
};

// Aggiorna un pacchetto esistente (solo admin)
exports.updatePackage = async (req, res) => {
  try {
    const {
      nome,
      descrizione,
      prezzo,
      valuta,
      caratteristiche,
      immagine,
      durata,
      attivo
    } = req.body;
    
    const package = await Package.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({ message: 'Pacchetto non trovato' });
    }
    
    // Aggiorna i dati su Stripe se necessario
    if (package.stripeProductId) {
      await stripe.products.update(package.stripeProductId, {
        name: nome || package.nome,
        description: descrizione || package.descrizione,
        images: immagine ? [immagine] : undefined
      });
      
      // Se il prezzo è cambiato, crea un nuovo prezzo su Stripe
      if (prezzo && prezzo !== package.prezzo) {
        const newStripePrice = await stripe.prices.create({
          product: package.stripeProductId,
          unit_amount: prezzo * 100,
          currency: (valuta || package.valuta).toLowerCase()
        });
        
        package.stripePriceId = newStripePrice.id;
      }
    }
    
    // Aggiorna i dati nel database
    package.nome = nome || package.nome;
    package.descrizione = descrizione || package.descrizione;
    package.prezzo = prezzo || package.prezzo;
    package.valuta = valuta || package.valuta;
    package.caratteristiche = caratteristiche || package.caratteristiche;
    package.immagine = immagine || package.immagine;
    package.durata = durata || package.durata;
    package.attivo = attivo !== undefined ? attivo : package.attivo;
    
    const updatedPackage = await package.save();
    
    res.status(200).json(updatedPackage);
  } catch (error) {
    res.status(400).json({ message: 'Errore nell\'aggiornamento del pacchetto', error: error.message });
  }
};

// Elimina un pacchetto (solo admin)
exports.deletePackage = async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({ message: 'Pacchetto non trovato' });
    }
    
    // Disattiva il prodotto su Stripe invece di eliminarlo
    if (package.stripeProductId) {
      await stripe.products.update(package.stripeProductId, {
        active: false
      });
    }
    
    await package.remove();
    
    res.status(200).json({ message: 'Pacchetto eliminato con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'eliminazione del pacchetto', error: error.message });
  }
};

// Crea una sessione di checkout Stripe per l'acquisto di un pacchetto
exports.createCheckoutSession = async (req, res) => {
  try {
    const { packageId } = req.params;
    const userId = req.user._id;
    
    const package = await Package.findOne({ _id: packageId, attivo: true });
    
    if (!package) {
      return res.status(404).json({ message: 'Pacchetto non trovato o non più disponibile' });
    }
    
    if (!isDemoMode && !package.stripePriceId) {
      return res.status(400).json({ message: 'Questo pacchetto non è configurato per l\'acquisto online' });
    }
    
    let session;
    
    if (isDemoMode) {
      // In modalità demo, crea una sessione di checkout simulata
      console.log('⚠️ Creazione sessione di checkout Stripe in modalità DEMO');
      const demoSessionId = `cs_demo_${Date.now()}`;
      session = {
        id: demoSessionId,
        url: `${process.env.FRONTEND_URL}/checkout/success?session_id=${demoSessionId}`,
        payment_status: 'paid'
      };
    } else {
      // Modalità normale con Stripe reale
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: package.stripePriceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
        client_reference_id: userId.toString(),
        metadata: {
          packageId: packageId.toString()
        }
      });
    }
    
    // Aggiungi l'ordine al pacchetto
    package.ordini.push({
      utente: userId,
      stripeSessionId: session.id,
      stato: isDemoMode ? 'completato' : 'in_attesa' // In modalità demo, imposta subito come completato
    });
    
    await package.save();
    
    res.status(200).json({ sessionId: session.id, url: session.url });
    
    // In modalità demo, simula un webhook di pagamento completato
    if (isDemoMode) {
      console.log('⚠️ Simulazione pagamento completato in modalità DEMO');
      // Aggiorna lo stato dell'ordine come se fosse arrivato un webhook
      await Package.updateOne(
        { 
          'ordini.stripeSessionId': session.id 
        },
        {
          $set: { 'ordini.$.stato': 'completato' }
        }
      );
    }
  } catch (error) {
    res.status(500).json({ message: 'Errore nella creazione della sessione di pagamento', error: error.message });
  }
};

// Webhook per gestire gli eventi di Stripe
exports.handleStripeWebhook = async (req, res) => {
  // Verifica se è una richiesta di test
  const isTestRequest = req.isTestWebhook === true;
  
  // Se è una richiesta di test in modalità demo, invia una risposta specifica
  if (isTestRequest && isDemoMode) {
    console.log('⚠️ Test webhook Stripe in modalità DEMO');
    return res.status(200).json({ message: 'Test webhook eseguito con successo in modalità demo' });
  }
  
  let event;
  
  if (isDemoMode) {
    // In modalità demo, simula un evento di pagamento completato
    console.log('⚠️ Webhook Stripe in modalità DEMO');
    event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: `cs_demo_${Date.now()}`,
          client_reference_id: 'demo_user',
          metadata: { packageId: req.query.packageId || 'demo_package' }
        }
      }
    };
  } else {
    // Modalità normale con verifica della firma
    const sig = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
  
  try {
    // Gestisci l'evento
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Aggiorna lo stato dell'ordine
        await Package.updateOne(
          { 
            'ordini.stripeSessionId': session.id 
          },
          {
            $set: { 'ordini.$.stato': 'completato' }
          }
        );
        break;
        
      case 'checkout.session.expired':
        const expiredSession = event.data.object;
        
        // Aggiorna lo stato dell'ordine
        await Package.updateOne(
          { 
            'ordini.stripeSessionId': expiredSession.id 
          },
          {
            $set: { 'ordini.$.stato': 'annullato' }
          }
        );
        break;
    }
    
    // Invia la risposta solo se non è già stata inviata
    if (!res.headersSent) {
      return res.status(200).json({ received: true });
    }
  } catch (error) {
    console.error('Errore nella gestione del webhook:', error);
    // Invia la risposta di errore solo se non è già stata inviata
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Errore nella gestione del webhook' });
    }
  }
};

// Ottieni gli ordini dell'utente corrente
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const packages = await Package.find({ 'ordini.utente': userId })
      .select('nome descrizione prezzo valuta immagine ordini');
    
    const ordini = packages.flatMap(package => {
      const ordiniUtente = package.ordini.filter(
        ordine => ordine.utente.toString() === userId.toString()
      );
      
      return ordiniUtente.map(ordine => ({
        _id: ordine._id,
        package: {
          _id: package._id,
          nome: package.nome,
          descrizione: package.descrizione,
          prezzo: package.prezzo,
          valuta: package.valuta,
          immagine: package.immagine
        },
        dataAcquisto: ordine.dataAcquisto,
        stato: ordine.stato
      }));
    });
    
    res.status(200).json(ordini);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero degli ordini', error: error.message });
  }
};

// Ottieni tutti gli ordini (solo admin)
exports.getAllOrders = async (req, res) => {
  try {
    const packages = await Package.find({ 'ordini.0': { $exists: true } })
      .select('nome prezzo valuta ordini')
      .populate('ordini.utente', 'nome email');
    
    const ordini = packages.flatMap(package => {
      return package.ordini.map(ordine => ({
        _id: ordine._id,
        package: {
          _id: package._id,
          nome: package.nome,
          prezzo: package.prezzo,
          valuta: package.valuta
        },
        utente: ordine.utente,
        dataAcquisto: ordine.dataAcquisto,
        stato: ordine.stato,
        stripeSessionId: ordine.stripeSessionId
      }));
    });
    
    res.status(200).json(ordini);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero degli ordini', error: error.message });
  }
};