const Newsletter = require('../models/Newsletter');

// Iscrizione alla newsletter (pubblico)
exports.iscriviti = async (req, res) => {
  try {
    const { email, nome, preferenze } = req.body;
    
    // Verifica se l'email è già iscritta
    let iscrizione = await Newsletter.findOne({ email });
    
    if (iscrizione) {
      // Se l'utente si era disiscritto, lo reiscriviamo
      if (!iscrizione.iscritto) {
        iscrizione.iscritto = true;
        iscrizione.dataIscrizione = Date.now();
        iscrizione.dataDisiscrizione = null;
        iscrizione.preferenze = preferenze || iscrizione.preferenze;
        await iscrizione.save();
        
        return res.status(200).json({ 
          message: 'Iscrizione alla newsletter ripristinata con successo',
          token: iscrizione.token
        });
      }
      
      return res.status(400).json({ message: 'Email già iscritta alla newsletter' });
    }
    
    // Crea una nuova iscrizione
    iscrizione = new Newsletter({
      email,
      nome,
      preferenze,
      iscritto: true,
      dataIscrizione: Date.now()
    });
    
    // Genera token di disiscrizione
    const token = iscrizione.generaToken();
    await iscrizione.save();
    
    res.status(201).json({ 
      message: 'Iscrizione alla newsletter completata con successo',
      token
    });
  } catch (error) {
    res.status(400).json({ message: 'Errore durante l\'iscrizione alla newsletter', error: error.message });
  }
};

// Disiscrizione dalla newsletter (pubblico, tramite token)
exports.disiscrivi = async (req, res) => {
  try {
    const { token } = req.params;
    
    const iscrizione = await Newsletter.findOne({ token });
    
    if (!iscrizione) {
      return res.status(404).json({ message: 'Token non valido o iscrizione non trovata' });
    }
    
    if (!iscrizione.iscritto) {
      return res.status(400).json({ message: 'Questa email è già disiscritto dalla newsletter' });
    }
    
    iscrizione.iscritto = false;
    iscrizione.dataDisiscrizione = Date.now();
    await iscrizione.save();
    
    res.status(200).json({ message: 'Disiscrizione dalla newsletter completata con successo' });
  } catch (error) {
    res.status(400).json({ message: 'Errore durante la disiscrizione dalla newsletter', error: error.message });
  }
};

// Aggiorna preferenze newsletter (pubblico, tramite token)
exports.aggiornaPreferenze = async (req, res) => {
  try {
    const { token } = req.params;
    const { preferenze } = req.body;
    
    const iscrizione = await Newsletter.findOne({ token });
    
    if (!iscrizione) {
      return res.status(404).json({ message: 'Token non valido o iscrizione non trovata' });
    }
    
    if (!iscrizione.iscritto) {
      return res.status(400).json({ message: 'Questa email è disiscritto dalla newsletter' });
    }
    
    iscrizione.preferenze = {
      ...iscrizione.preferenze,
      ...preferenze
    };
    
    await iscrizione.save();
    
    res.status(200).json({ 
      message: 'Preferenze newsletter aggiornate con successo',
      preferenze: iscrizione.preferenze
    });
  } catch (error) {
    res.status(400).json({ message: 'Errore durante l\'aggiornamento delle preferenze', error: error.message });
  }
};

// Ottieni tutte le iscrizioni alla newsletter (solo admin)
exports.getIscrizioni = async (req, res) => {
  try {
    const iscrizioni = await Newsletter.find({ iscritto: true })
      .select('email nome preferenze dataIscrizione')
      .sort({ dataIscrizione: -1 });
    
    res.status(200).json(iscrizioni);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle iscrizioni alla newsletter', error: error.message });
  }
};

// Ottieni statistiche newsletter (solo admin)
exports.getStatistiche = async (req, res) => {
  try {
    const totaleIscritti = await Newsletter.countDocuments({ iscritto: true });
    const totaleDisiscritti = await Newsletter.countDocuments({ iscritto: false });
    
    const interessatiModelli = await Newsletter.countDocuments({ 
      iscritto: true,
      'preferenze.modelli': true 
    });
    
    const interessatiEventi = await Newsletter.countDocuments({ 
      iscritto: true,
      'preferenze.eventi': true 
    });
    
    const interessatiOfferte = await Newsletter.countDocuments({ 
      iscritto: true,
      'preferenze.offerte': true 
    });
    
    // Iscrizioni per mese negli ultimi 6 mesi
    const oggi = new Date();
    const seiMesiFa = new Date(oggi.getFullYear(), oggi.getMonth() - 6, 1);
    
    const iscrizioniPerMese = await Newsletter.aggregate([
      {
        $match: {
          dataIscrizione: { $gte: seiMesiFa },
          iscritto: true
        }
      },
      {
        $group: {
          _id: { 
            anno: { $year: "$dataIscrizione" },
            mese: { $month: "$dataIscrizione" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.anno": 1, "_id.mese": 1 } }
    ]);
    
    res.status(200).json({
      totaleIscritti,
      totaleDisiscritti,
      preferenze: {
        modelli: interessatiModelli,
        eventi: interessatiEventi,
        offerte: interessatiOfferte
      },
      iscrizioniPerMese: iscrizioniPerMese.map(item => ({
        anno: item._id.anno,
        mese: item._id.mese,
        iscrizioni: item.count
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle statistiche della newsletter', error: error.message });
  }
};

// Elimina un'iscrizione (solo admin)
exports.deleteIscrizione = async (req, res) => {
  try {
    const iscrizione = await Newsletter.findById(req.params.id);
    
    if (!iscrizione) {
      return res.status(404).json({ message: 'Iscrizione non trovata' });
    }
    
    await iscrizione.deleteOne();
    
    res.status(200).json({ message: 'Iscrizione eliminata con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'eliminazione dell\'iscrizione', error: error.message });
  }
};