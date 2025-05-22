const Brand = require('../models/Brand');

// Ottieni tutti i costruttori
exports.getCostruttori = async (req, res) => {
  try {
    const costruttori = await Brand.find()
      .select('nome logo sede')
      .sort({ nome: 1 });
      
    res.status(200).json(costruttori);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero dei costruttori', error: error.message });
  }
};

// Ottieni un singolo costruttore per ID
exports.getCostruttore = async (req, res) => {
  try {
    const costruttore = await Brand.findById(req.params.id)
      .populate('modelli');
      
    if (!costruttore) {
      return res.status(404).json({ message: 'Costruttore non trovato' });
    }
    
    res.status(200).json(costruttore);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero del costruttore', error: error.message });
  }
};

// Crea un nuovo costruttore (solo admin)
exports.createCostruttore = async (req, res) => {
  try {
    const {
      nome,
      descrizione,
      logo,
      storia,
      sede,
      annoFondazione,
      sito,
      contatti,
      immagini
    } = req.body;
    
    // Verifica se esiste già un costruttore con lo stesso nome
    const costruttoreEsistente = await Brand.findOne({ nome });
    if (costruttoreEsistente) {
      return res.status(400).json({ message: 'Esiste già un costruttore con questo nome' });
    }
    
    const nuovoCostruttore = await Brand.create({
      nome,
      descrizione,
      logo,
      storia,
      sede,
      annoFondazione,
      sito,
      contatti,
      immagini
    });
    
    res.status(201).json(nuovoCostruttore);
  } catch (error) {
    res.status(400).json({ message: 'Errore nella creazione del costruttore', error: error.message });
  }
};

// Aggiorna un costruttore esistente (solo admin)
exports.updateCostruttore = async (req, res) => {
  try {
    const {
      nome,
      descrizione,
      logo,
      storia,
      sede,
      annoFondazione,
      sito,
      contatti,
      immagini
    } = req.body;
    
    // Se viene aggiornato il nome, verifica che non esista già
    if (nome) {
      const costruttoreEsistente = await Brand.findOne({ nome, _id: { $ne: req.params.id } });
      if (costruttoreEsistente) {
        return res.status(400).json({ message: 'Esiste già un costruttore con questo nome' });
      }
    }
    
    const costruttoreAggiornato = await Brand.findByIdAndUpdate(
      req.params.id,
      {
        nome,
        descrizione,
        logo,
        storia,
        sede,
        annoFondazione,
        sito,
        contatti,
        immagini,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!costruttoreAggiornato) {
      return res.status(404).json({ message: 'Costruttore non trovato' });
    }
    
    res.status(200).json(costruttoreAggiornato);
  } catch (error) {
    res.status(400).json({ message: 'Errore nell\'aggiornamento del costruttore', error: error.message });
  }
};

// Elimina un costruttore (solo admin)
exports.deleteCostruttore = async (req, res) => {
  try {
    const costruttore = await Brand.findById(req.params.id);
    
    if (!costruttore) {
      return res.status(404).json({ message: 'Costruttore non trovato' });
    }
    
    // Verifica se ci sono modelli associati a questo costruttore
    if (costruttore.modelli && costruttore.modelli.length > 0) {
      return res.status(400).json({ 
        message: 'Impossibile eliminare il costruttore perché ha modelli associati. Rimuovi prima i modelli.' 
      });
    }
    
    await Brand.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Costruttore eliminato con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'eliminazione del costruttore', error: error.message });
  }
};