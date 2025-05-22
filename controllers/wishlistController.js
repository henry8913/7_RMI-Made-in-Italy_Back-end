const Wishlist = require('../models/Wishlist');
const Restomod = require('../models/Restomod');

// Ottieni la wishlist dell'utente corrente
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ utente: req.user.id })
      .populate({
        path: 'modelli',
        populate: { path: 'costruttore', select: 'nome logo' }
      });
    
    if (!wishlist) {
      // Se l'utente non ha ancora una wishlist, ne creiamo una vuota
      wishlist = await Wishlist.create({
        utente: req.user.id,
        modelli: []
      });
      return res.status(200).json({ modelli: [] });
    }
    
    res.status(200).json({ modelli: wishlist.modelli });
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero della wishlist', error: error.message });
  }
};

// Aggiungi un modello alla wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const modelId = req.params.modelId;
    
    // Verifica che il modello esista
    const modello = await Restomod.findById(modelId);
    if (!modello) {
      return res.status(404).json({ message: 'Modello non trovato' });
    }
    
    // Trova o crea la wishlist dell'utente
    let wishlist = await Wishlist.findOne({ utente: req.user.id });
    
    if (!wishlist) {
      wishlist = await Wishlist.create({
        utente: req.user.id,
        modelli: [modelId]
      });
      return res.status(201).json({ message: 'Modello aggiunto alla wishlist' });
    }
    
    // Aggiungi il modello se non è già presente
    if (wishlist.modelli.includes(modelId)) {
      return res.status(400).json({ message: 'Il modello è già nella wishlist' });
    }
    
    wishlist.modelli.push(modelId);
    await wishlist.save();
    
    res.status(200).json({ message: 'Modello aggiunto alla wishlist' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'aggiunta alla wishlist', error: error.message });
  }
};

// Rimuovi un modello dalla wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const modelId = req.params.modelId;
    
    // Trova la wishlist dell'utente
    const wishlist = await Wishlist.findOne({ utente: req.user.id });
    
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist non trovata' });
    }
    
    // Rimuovi il modello dalla wishlist
    if (!wishlist.modelli.includes(modelId)) {
      return res.status(400).json({ message: 'Il modello non è presente nella wishlist' });
    }
    
    wishlist.modelli = wishlist.modelli.filter(
      id => id.toString() !== modelId
    );
    
    await wishlist.save();
    
    res.status(200).json({ message: 'Modello rimosso dalla wishlist' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nella rimozione dalla wishlist', error: error.message });
  }
};