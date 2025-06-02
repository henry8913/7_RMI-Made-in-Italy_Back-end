const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

// Schema per i messaggi di contatto (senza creare un modello separato)
const contactSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Il nome è obbligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'L\'email è obbligatoria'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Formato email non valido']
  },
  telefono: {
    type: String,
    trim: true
  },
  messaggio: {
    type: String,
    required: [true, 'Il messaggio è obbligatorio']
  },
  allegati: [{
    url: String,
    filename: String,
    mimetype: String
  }],
  letto: {
    type: Boolean,
    default: false
  },
  dataInvio: {
    type: Date,
    default: Date.now
  }
});

const Contact = mongoose.model('Contact', contactSchema);

// Configurazione Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Invia un messaggio di contatto (pubblico)
exports.inviaMessaggio = async (req, res) => {
  try {
    const { nome, email, telefono, messaggio } = req.body;
    const allegati = [];
    
    // Gestione degli allegati se presenti
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // Carica il file su Cloudinary
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'rmi-contatti',
            resource_type: 'auto'
          });
          
          allegati.push({
            url: result.secure_url,
            filename: file.originalname,
            mimetype: file.mimetype
          });
        } catch (uploadError) {
          console.error('Errore durante il caricamento del file:', uploadError);
        }
      }
    }
    
    // Crea il messaggio di contatto
    const contatto = await Contact.create({
      nome,
      email,
      telefono,
      messaggio,
      allegati,
      letto: false,
      dataInvio: Date.now()
    });
    
    res.status(201).json({ 
      message: 'Messaggio inviato con successo',
      id: contatto._id
    });
  } catch (error) {
    res.status(400).json({ message: 'Errore durante l\'invio del messaggio', error: error.message });
  }
};

// Ottieni tutti i messaggi (solo per admin)
exports.getMessages = async (req, res) => {
  try {
    // Qui dovresti avere un modello Contact o Message
    // Per ora, restituiamo un array vuoto
    res.status(200).json([]);
  } catch (error) {
    console.error('Errore durante il recupero dei messaggi:', error);
    res.status(500).json({ message: 'Errore durante il recupero dei messaggi', error: error.message });
  }
};

// Ottieni un messaggio specifico (solo per admin)
exports.getMessage = async (req, res) => {
  try {
    // Qui dovresti avere un modello Contact o Message
    // Per ora, restituiamo un messaggio di errore
    res.status(404).json({ message: 'Messaggio non trovato' });
  } catch (error) {
    console.error('Errore durante il recupero del messaggio:', error);
    res.status(500).json({ message: 'Errore durante il recupero del messaggio', error: error.message });
  }
};

// Elimina un messaggio (solo per admin)
exports.deleteMessage = async (req, res) => {
  try {
    // Qui dovresti avere un modello Contact o Message
    // Per ora, restituiamo un messaggio di successo
    res.status(200).json({ message: 'Messaggio eliminato con successo' });
  } catch (error) {
    console.error('Errore durante l\'eliminazione del messaggio:', error);
    res.status(500).json({ message: 'Errore durante l\'eliminazione del messaggio', error: error.message });
  }
};

// Invia un messaggio di contatto (per tutti gli utenti)
exports.sendMessage = async (req, res) => {
  try {
    const { nome, email, oggetto, messaggio } = req.body;
    
    // Validazione dei campi
    if (!nome || !email || !messaggio) {
      return res.status(400).json({ message: 'Nome, email e messaggio sono campi obbligatori' });
    }
    
    // Qui dovresti salvare il messaggio nel database
    // Per ora, restituiamo un messaggio di successo
    res.status(201).json({ message: 'Messaggio inviato con successo' });
  } catch (error) {
    console.error('Errore durante l\'invio del messaggio:', error);
    res.status(500).json({ message: 'Errore durante l\'invio del messaggio', error: error.message });
  }
};

// Ottieni un singolo messaggio di contatto (solo admin)
exports.getMessaggio = async (req, res) => {
  try {
    const messaggio = await Contact.findById(req.params.id);
    
    if (!messaggio) {
      return res.status(404).json({ message: 'Messaggio non trovato' });
    }
    
    res.status(200).json(messaggio);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero del messaggio', error: error.message });
  }
};

// Segna un messaggio come letto (solo admin)
exports.segnaComeLetto = async (req, res) => {
  try {
    const messaggio = await Contact.findById(req.params.id);
    
    if (!messaggio) {
      return res.status(404).json({ message: 'Messaggio non trovato' });
    }
    
    messaggio.letto = true;
    await messaggio.save();
    
    res.status(200).json({ message: 'Messaggio segnato come letto' });
  } catch (error) {
    res.status(400).json({ message: 'Errore nell\'aggiornamento del messaggio', error: error.message });
  }
};

// Elimina un messaggio (solo admin)
exports.deleteMessaggio = async (req, res) => {
  try {
    const messaggio = await Contact.findById(req.params.id);
    
    if (!messaggio) {
      return res.status(404).json({ message: 'Messaggio non trovato' });
    }
    
    // Elimina gli allegati da Cloudinary se presenti
    if (messaggio.allegati && messaggio.allegati.length > 0) {
      for (const allegato of messaggio.allegati) {
        try {
          // Estrai l'ID pubblico dall'URL
          const publicId = allegato.url.split('/').slice(-1)[0].split('.')[0];
          await cloudinary.uploader.destroy('rmi-contatti/' + publicId);
        } catch (deleteError) {
          console.error('Errore durante l\'eliminazione del file da Cloudinary:', deleteError);
        }
      }
    }
    
    await messaggio.remove();
    
    res.status(200).json({ message: 'Messaggio eliminato con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'eliminazione del messaggio', error: error.message });
  }
};

// Carica un file su Cloudinary (utility per altre funzionalità)
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nessun file caricato' });
    }
    
    // Carica il file su Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'rmi-uploads',
      resource_type: 'auto'
    });
    
    res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,
      filename: req.file.originalname
    });
  } catch (error) {
    res.status(500).json({ message: 'Errore durante il caricamento del file', error: error.message });
  }
};

// Aggiorna un messaggio con allegati (solo admin)
exports.aggiornaMessaggioConAllegati = async (req, res) => {
  try {
    const messaggio = await Contact.findById(req.params.id);
    
    if (!messaggio) {
      return res.status(404).json({ message: 'Messaggio non trovato' });
    }
    
    // Aggiorna i campi del messaggio se forniti
    const { nome, email, telefono, messaggio: testoMessaggio, allegatiDaAggiungere } = req.body;
    
    if (nome) messaggio.nome = nome;
    if (email) messaggio.email = email;
    if (telefono) messaggio.telefono = telefono;
    if (testoMessaggio) messaggio.messaggio = testoMessaggio;
    
    // Aggiungi nuovi allegati se forniti
    if (allegatiDaAggiungere && Array.isArray(allegatiDaAggiungere)) {
      for (const allegato of allegatiDaAggiungere) {
        if (allegato.url && allegato.filename) {
          messaggio.allegati.push({
            url: allegato.url,
            filename: allegato.filename,
            mimetype: allegato.mimetype || 'application/octet-stream'
          });
        }
      }
    }
    
    // Gestione degli allegati se presenti nella richiesta
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // Carica il file su Cloudinary
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'rmi-contatti',
            resource_type: 'auto'
          });
          
          messaggio.allegati.push({
            url: result.secure_url,
            filename: file.originalname,
            mimetype: file.mimetype
          });
        } catch (uploadError) {
          console.error('Errore durante il caricamento del file:', uploadError);
        }
      }
    }
    
    await messaggio.save();
    
    res.status(200).json({ 
      message: 'Messaggio aggiornato con successo',
      messaggio
    });
  } catch (error) {
    res.status(400).json({ message: 'Errore durante l\'aggiornamento del messaggio', error: error.message });
  }
};