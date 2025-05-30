const CustomRequest = require('../models/CustomRequest');
const User = require('../models/User');
const sgMail = require('@sendgrid/mail');

// Configura SendGrid per l'invio di email
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Invia una nuova richiesta personalizzata
exports.inviaRichiesta = async (req, res) => {
  try {
    const { modelloBase, titolo, descrizione, budget, tempistiche, contatto } = req.body;
    
    const richiesta = await CustomRequest.create({
      utente: req.user.id,
      modelloBase,
      titolo,
      descrizione,
      budget,
      tempistiche,
      contatto,
      stato: 'inviata'
    });
    
    // Invia email di notifica agli admin se SendGrid è configurato
    if (process.env.SENDGRID_API_KEY && process.env.ADMIN_EMAIL) {
      const user = await User.findById(req.user.id);
      
      const msg = {
        to: process.env.ADMIN_EMAIL,
        from: process.env.EMAIL_FROM || 'info@restomod-madeinitaly.com',
        subject: 'Nuova richiesta personalizzata',
        text: `È stata ricevuta una nuova richiesta personalizzata da ${user.nome} (${user.email}).\n\nTitolo: ${titolo}\nDescrizione: ${descrizione}\nBudget: ${budget || 'Non specificato'}\nTempistiche: ${tempistiche || 'Non specificate'}\n\nAccedi al pannello di amministrazione per rispondere.`,
        html: `<p>È stata ricevuta una nuova richiesta personalizzata da <strong>${user.nome}</strong> (${user.email}).</p><p><strong>Titolo:</strong> ${titolo}<br><strong>Descrizione:</strong> ${descrizione}<br><strong>Budget:</strong> ${budget || 'Non specificato'}<br><strong>Tempistiche:</strong> ${tempistiche || 'Non specificate'}</p><p>Accedi al pannello di amministrazione per rispondere.</p>`
      };
      
      await sgMail.send(msg);
    }
    
    // Invia email di conferma all'utente
    if (process.env.SENDGRID_API_KEY) {
      const user = await User.findById(req.user.id);
      
      const msg = {
        to: user.email,
        from: process.env.EMAIL_FROM || 'info@restomod-madeinitaly.com',
        subject: 'Richiesta personalizzata ricevuta',
        text: `Gentile ${user.nome},\n\nLa tua richiesta personalizzata "${titolo}" è stata ricevuta con successo.\n\nTi contatteremo presto per discutere i dettagli.\n\nGrazie,\nTeam RESTOMOD Made in Italy`,
        html: `<p>Gentile ${user.nome},</p><p>La tua richiesta personalizzata "<strong>${titolo}</strong>" è stata ricevuta con successo.</p><p>Ti contatteremo presto per discutere i dettagli.</p><p>Grazie,<br>Team RESTOMOD Made in Italy</p>`
      };
      
      await sgMail.send(msg);
    }
    
    res.status(201).json({
      message: 'Richiesta inviata con successo',
      richiesta
    });
  } catch (error) {
    res.status(400).json({ message: 'Errore nell\'invio della richiesta', error: error.message });
  }
};

// Ottieni tutte le richieste personalizzate (solo admin)
exports.getAllRichieste = async (req, res) => {
  try {
    const richieste = await CustomRequest.find()
      .populate('utente', 'nome email')
      .populate('modelloBase', 'nome costruttore')
      .sort({ createdAt: -1 });
    
    res.status(200).json(richieste);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle richieste', error: error.message });
  }
};

// Ottieni le richieste personalizzate dell'utente corrente
exports.getUserRichieste = async (req, res) => {
  try {
    const richieste = await CustomRequest.find({ utente: req.user.id })
      .populate('modelloBase', 'nome costruttore immagini')
      .sort({ createdAt: -1 });
    
    res.status(200).json(richieste);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle richieste', error: error.message });
  }
};

// Ottieni una singola richiesta personalizzata
exports.getRichiesta = async (req, res) => {
  try {
    const richiesta = await CustomRequest.findById(req.params.id)
      .populate('utente', 'nome email')
      .populate('modelloBase');
    
    if (!richiesta) {
      return res.status(404).json({ message: 'Richiesta non trovata' });
    }
    
    // Verifica che l'utente sia autorizzato (admin o proprietario)
    if (req.user.ruolo !== 'admin' && richiesta.utente._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }
    
    res.status(200).json(richiesta);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero della richiesta', error: error.message });
  }
};

// Rispondi a una richiesta personalizzata (solo admin)
exports.rispondiRichiesta = async (req, res) => {
  try {
    const { testo, preventivo, stato } = req.body;
    
    if (!testo) {
      return res.status(400).json({ message: 'Il testo della risposta è obbligatorio' });
    }
    
    if (!['in_revisione', 'preventivo_inviato', 'accettata', 'rifiutata', 'completata'].includes(stato)) {
      return res.status(400).json({ message: 'Stato non valido' });
    }
    
    const richiesta = await CustomRequest.findByIdAndUpdate(
      req.params.id,
      {
        'rispostaAdmin.testo': testo,
        'rispostaAdmin.data': Date.now(),
        'rispostaAdmin.preventivo': preventivo,
        stato,
        updatedAt: Date.now()
      },
      { new: true }
    )
    .populate('utente', 'nome email')
    .populate('modelloBase', 'nome');
    
    if (!richiesta) {
      return res.status(404).json({ message: 'Richiesta non trovata' });
    }
    
    // Invia email di risposta all'utente se SendGrid è configurato
    if (process.env.SENDGRID_API_KEY) {
      let subject, text, html;
      
      switch (stato) {
        case 'preventivo_inviato':
          subject = 'Preventivo per la tua richiesta personalizzata';
          text = `Gentile ${richiesta.utente.nome},\n\nAbbiamo valutato la tua richiesta personalizzata "${richiesta.titolo}" e abbiamo preparato un preventivo.\n\nPreventivo: ${preventivo} €\n\nMessaggio: ${testo}\n\nPer accettare il preventivo o per ulteriori informazioni, accedi al tuo account.\n\nGrazie,\nTeam RESTOMOD Made in Italy`;
          html = `<p>Gentile ${richiesta.utente.nome},</p><p>Abbiamo valutato la tua richiesta personalizzata "<strong>${richiesta.titolo}</strong>" e abbiamo preparato un preventivo.</p><p><strong>Preventivo:</strong> ${preventivo} €</p><p><strong>Messaggio:</strong> ${testo}</p><p>Per accettare il preventivo o per ulteriori informazioni, accedi al tuo account.</p><p>Grazie,<br>Team RESTOMOD Made in Italy</p>`;
          break;
        case 'accettata':
          subject = 'Richiesta personalizzata accettata';
          text = `Gentile ${richiesta.utente.nome},\n\nSiamo lieti di informarti che la tua richiesta personalizzata "${richiesta.titolo}" è stata accettata.\n\nMessaggio: ${testo}\n\nTi contatteremo presto per i prossimi passi.\n\nGrazie,\nTeam RESTOMOD Made in Italy`;
          html = `<p>Gentile ${richiesta.utente.nome},</p><p>Siamo lieti di informarti che la tua richiesta personalizzata "<strong>${richiesta.titolo}</strong>" è stata accettata.</p><p><strong>Messaggio:</strong> ${testo}</p><p>Ti contatteremo presto per i prossimi passi.</p><p>Grazie,<br>Team RESTOMOD Made in Italy</p>`;
          break;
        case 'rifiutata':
          subject = 'Aggiornamento sulla tua richiesta personalizzata';
          text = `Gentile ${richiesta.utente.nome},\n\nGrazie per il tuo interesse nei nostri servizi personalizzati. Dopo un'attenta valutazione della tua richiesta "${richiesta.titolo}", dobbiamo informarti che non possiamo procedere con il progetto.\n\nMessaggio: ${testo}\n\nSiamo a disposizione per discutere alternative o altri progetti.\n\nGrazie,\nTeam RESTOMOD Made in Italy`;
          html = `<p>Gentile ${richiesta.utente.nome},</p><p>Grazie per il tuo interesse nei nostri servizi personalizzati. Dopo un'attenta valutazione della tua richiesta "<strong>${richiesta.titolo}</strong>", dobbiamo informarti che non possiamo procedere con il progetto.</p><p><strong>Messaggio:</strong> ${testo}</p><p>Siamo a disposizione per discutere alternative o altri progetti.</p><p>Grazie,<br>Team RESTOMOD Made in Italy</p>`;
          break;
        default:
          subject = 'Aggiornamento sulla tua richiesta personalizzata';
          text = `Gentile ${richiesta.utente.nome},\n\nCi sono aggiornamenti sulla tua richiesta personalizzata "${richiesta.titolo}".\n\nMessaggio: ${testo}\n\nStato attuale: ${stato.replace('_', ' ')}\n\nGrazie,\nTeam RESTOMOD Made in Italy`;
          html = `<p>Gentile ${richiesta.utente.nome},</p><p>Ci sono aggiornamenti sulla tua richiesta personalizzata "<strong>${richiesta.titolo}</strong>".</p><p><strong>Messaggio:</strong> ${testo}</p><p><strong>Stato attuale:</strong> ${stato.replace('_', ' ')}</p><p>Grazie,<br>Team RESTOMOD Made in Italy</p>`;
      }
      
      const msg = {
        to: richiesta.utente.email,
        from: process.env.EMAIL_FROM || 'info@restomod-madeinitaly.com',
        subject,
        text,
        html
      };
      
      await sgMail.send(msg);
    }
    
    res.status(200).json({
      message: 'Risposta inviata con successo',
      richiesta
    });
  } catch (error) {
    res.status(400).json({ message: 'Errore nell\'invio della risposta', error: error.message });
  }
};

// Aggiorna lo stato di una richiesta personalizzata (utente)
exports.aggiornaStatoRichiesta = async (req, res) => {
  try {
    const { stato } = req.body;
    
    if (!['accettata', 'rifiutata'].includes(stato)) {
      return res.status(400).json({ message: 'Stato non valido' });
    }
    
    const richiesta = await CustomRequest.findById(req.params.id);
    
    if (!richiesta) {
      return res.status(404).json({ message: 'Richiesta non trovata' });
    }
    
    // Verifica che l'utente sia il proprietario della richiesta
    if (richiesta.utente.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }
    
    // Verifica che la richiesta sia in stato 'preventivo_inviato'
    if (richiesta.stato !== 'preventivo_inviato') {
      return res.status(400).json({ message: 'Impossibile aggiornare lo stato della richiesta' });
    }
    
    richiesta.stato = stato;
    richiesta.updatedAt = Date.now();
    await richiesta.save();
    
    // Invia email di notifica agli admin se SendGrid è configurato
    if (process.env.SENDGRID_API_KEY && process.env.ADMIN_EMAIL) {
      const user = await User.findById(req.user.id);
      
      const msg = {
        to: process.env.ADMIN_EMAIL,
        from: process.env.EMAIL_FROM || 'info@restomod-madeinitaly.com',
        subject: `Preventivo ${stato === 'accettata' ? 'accettato' : 'rifiutato'} da ${user.nome}`,
        text: `${user.nome} (${user.email}) ha ${stato === 'accettata' ? 'accettato' : 'rifiutato'} il preventivo per la richiesta personalizzata "${richiesta.titolo}".\n\nAccedi al pannello di amministrazione per visualizzare i dettagli.`,
        html: `<p><strong>${user.nome}</strong> (${user.email}) ha ${stato === 'accettata' ? 'accettato' : 'rifiutato'} il preventivo per la richiesta personalizzata "<strong>${richiesta.titolo}</strong>".</p><p>Accedi al pannello di amministrazione per visualizzare i dettagli.</p>`
      };
      
      await sgMail.send(msg);
    }
    
    res.status(200).json({
      message: `Stato della richiesta aggiornato a '${stato}'`,
      richiesta
    });
  } catch (error) {
    res.status(400).json({ message: 'Errore nell\'aggiornamento dello stato', error: error.message });
  }
};

// Elimina una richiesta personalizzata (solo admin)
exports.deleteRichiesta = async (req, res) => {
  try {
    const richiesta = await CustomRequest.findById(req.params.id);
    
    if (!richiesta) {
      return res.status(404).json({ message: 'Richiesta non trovata' });
    }
    
    await CustomRequest.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Richiesta eliminata con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'eliminazione della richiesta', error: error.message });
  }
};