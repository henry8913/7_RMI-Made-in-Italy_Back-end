const Restomod = require('../models/Restomod');
const Brand = require('../models/Brand');

// Ottieni tutti i modelli RESTOMOD
exports.getModelli = async (req, res) => {
  try {
    const filtro = {};
    
    // Filtri opzionali
    if (req.query.stato) filtro.stato = req.query.stato;
    if (req.query.costruttore) filtro.costruttore = req.query.costruttore;
    if (req.query.inEvidenza) filtro.inEvidenza = req.query.inEvidenza === 'true';
    
    const modelli = await Restomod.find(filtro)
      .populate('costruttore', 'nome logo')
      .sort({ createdAt: -1 });
      
    res.status(200).json(modelli);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero dei modelli', error: error.message });
  }
};

// Ottieni un singolo modello RESTOMOD per ID
exports.getModello = async (req, res) => {
  try {
    const modello = await Restomod.findById(req.params.id)
      .populate('costruttore');
      
    if (!modello) {
      return res.status(404).json({ message: 'Modello non trovato' });
    }
    
    res.status(200).json(modello);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero del modello', error: error.message });
  }
};

// Crea un nuovo modello RESTOMOD (solo admin)
exports.createModello = async (req, res) => {
  try {
    const {
      nome,
      costruttore,
      descrizione,
      anno,
      prezzo,
      stato,
      specifiche,
      immagini,
      caratteristiche,
      inEvidenza
    } = req.body;
    
    // Verifica che il costruttore esista
    const brandEsistente = await Brand.findById(costruttore);
    if (!brandEsistente) {
      return res.status(400).json({ message: 'Costruttore non valido' });
    }
    
    const nuovoModello = await Restomod.create({
      nome,
      costruttore,
      descrizione,
      anno,
      prezzo,
      stato,
      specifiche,
      immagini,
      caratteristiche,
      inEvidenza
    });
    
    // Aggiorna il costruttore con il riferimento al nuovo modello
    await Brand.findByIdAndUpdate(costruttore, {
      $push: { modelli: nuovoModello._id }
    });
    
    res.status(201).json(nuovoModello);
  } catch (error) {
    res.status(400).json({ message: 'Errore nella creazione del modello', error: error.message });
  }
};

// Aggiorna un modello RESTOMOD esistente (solo admin)
exports.updateModello = async (req, res) => {
  try {
    const {
      nome,
      costruttore,
      descrizione,
      anno,
      prezzo,
      stato,
      specifiche,
      immagini,
      caratteristiche,
      inEvidenza
    } = req.body;
    
    // Se viene fornito un nuovo costruttore, verifica che esista
    if (costruttore) {
      const brandEsistente = await Brand.findById(costruttore);
      if (!brandEsistente) {
        return res.status(400).json({ message: 'Costruttore non valido' });
      }
    }
    
    const modelloAggiornato = await Restomod.findByIdAndUpdate(
      req.params.id,
      {
        nome,
        costruttore,
        descrizione,
        anno,
        prezzo,
        stato,
        specifiche,
        immagini,
        caratteristiche,
        inEvidenza,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!modelloAggiornato) {
      return res.status(404).json({ message: 'Modello non trovato' });
    }
    
    res.status(200).json(modelloAggiornato);
  } catch (error) {
    res.status(400).json({ message: 'Errore nell\'aggiornamento del modello', error: error.message });
  }
};

// Elimina un modello RESTOMOD (solo admin)
exports.deleteModello = async (req, res) => {
  try {
    const modello = await Restomod.findById(req.params.id);
    
    if (!modello) {
      return res.status(404).json({ message: 'Modello non trovato' });
    }
    
    // Rimuovi il riferimento al modello dal costruttore
    await Brand.findByIdAndUpdate(modello.costruttore, {
      $pull: { modelli: modello._id }
    });
    
    await Restomod.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Modello eliminato con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'eliminazione del modello', error: error.message });
  }
};

// Aggiorna lo stato di un modello RESTOMOD (solo admin)
exports.updateStato = async (req, res) => {
  try {
    const { stato } = req.body;
    
    if (!['available', 'reserved', 'sold'].includes(stato)) {
      return res.status(400).json({ message: 'Stato non valido' });
    }
    
    const modelloAggiornato = await Restomod.findByIdAndUpdate(
      req.params.id,
      { stato, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!modelloAggiornato) {
      return res.status(404).json({ message: 'Modello non trovato' });
    }
    
    res.status(200).json(modelloAggiornato);
  } catch (error) {
    res.status(400).json({ message: 'Errore nell\'aggiornamento dello stato', error: error.message });
  }
};