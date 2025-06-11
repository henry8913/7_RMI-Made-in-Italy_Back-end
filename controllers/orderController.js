const Order = require('../models/Order');
const User = require('../models/User');
const Package = require('../models/Package');
const Restomod = require('../models/Restomod');

// Crea un nuovo ordine
exports.createOrder = async (req, res) => {
  try {
    const { items, totale, infoCliente } = req.body;
    const userId = req.user._id;

    // Verifica che ci siano elementi nell'ordine
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'L\'ordine deve contenere almeno un elemento' });
    }

    // Crea un nuovo ordine
    const nuovoOrdine = new Order({
      utente: userId,
      items: items.map(item => ({
        tipo: item.type === 'restomod' ? 'restomod' : 'package',
        prodotto: item.id,
        nome: item.name,
        prezzo: item.price,
        quantita: item.quantity || 1,
        immagine: item.image
      })),
      totale,
      infoCliente,
      stato: 'completato' // Per semplicità, impostiamo lo stato come completato
    });

    // Salva l'ordine
    await nuovoOrdine.save();

    // Se ci sono restomods nell'ordine, aggiorna il loro stato a 'sold'
    for (const item of items) {
      if (item.type === 'restomod') {
        await Restomod.findByIdAndUpdate(item.id, { stato: 'sold' });
      }
    }

    res.status(201).json(nuovoOrdine);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella creazione dell\'ordine', error: error.message });
  }
};

// Ottieni gli ordini dell'utente corrente
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Trova tutti gli ordini dell'utente
    const ordini = await Order.find({ utente: userId })
      .sort({ dataCreazione: -1 });
    
    res.status(200).json(ordini);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero degli ordini', error: error.message });
  }
};

// Ottieni un singolo ordine per ID
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user._id;
    
    // Trova l'ordine specifico dell'utente
    const ordine = await Order.findOne({ _id: orderId, utente: userId });
    
    if (!ordine) {
      return res.status(404).json({ message: 'Ordine non trovato' });
    }
    
    res.status(200).json(ordine);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero dell\'ordine', error: error.message });
  }
};

// Ottieni tutti gli ordini (solo admin)
exports.getAllOrders = async (req, res) => {
  try {
    // Trova tutti gli ordini e popola le informazioni dell'utente
    const ordini = await Order.find({})
      .populate('utente', 'nome email')
      .sort({ dataCreazione: -1 });
    
    res.status(200).json(ordini);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero degli ordini', error: error.message });
  }
};