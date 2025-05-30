const TestDrive = require('../models/TestDrive');
const Restomod = require('../models/Restomod');
const User = require('../models/User');
const sgMail = require('@sendgrid/mail');

// Configura SendGrid per l'invio di email
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Prenota un test drive
exports.prenotaTestDrive = async (req, res) => {
  try {
    const { modello, data, ora, luogo, note, contatto } = req.body;
    
    // Verifica che il modello esista
    const modelloDoc = await Restomod.findById(modello);
    if (!modelloDoc) {
      return res.status(404).json({ message: 'Modello non trovato' });
    }
    
    
    // Verifica che il modello sia disponibile
    if (['sold'].includes(modelloDoc.stato)) {
      return res.status(400).json({ message: 'Il modello non è disponibile per un test drive' });
    }
    
    
    // Crea la prenotazione
    const testDrive = await TestDrive.create({
      utente: req.user.id,
      modello: modelloDoc._id,
      data,
      ora,
      luogo,
      note,
      contatto,
      stato: 'richiesto'
    });
    
    // Invia email di conferma se SendGrid è configurato
    if (process.env.SENDGRID_API_KEY) {
      const user = await User.findById(req.user.id);
      
      const msg = {
        to: user.email,
        from: process.env.EMAIL_FROM || 'info@restomod-madeinitaly.com',
        subject: 'Conferma prenotazione Test Drive',
        text: `Gentile ${user.nome},\n\nLa tua richiesta di test drive per il modello ${modello.nome} è stata ricevuta con successo.\nData: ${new Date(data).toLocaleDateString('it-IT')}\nOra: ${ora}\nLuogo: ${luogo}\n\nTi contatteremo presto per confermare la tua prenotazione.\n\nGrazie,\nTeam RESTOMOD Made in Italy`,
        html: `<p>Gentile ${user.nome},</p><p>La tua richiesta di test drive per il modello <strong>${modello.nome}</strong> è stata ricevuta con successo.</p><p><strong>Data:</strong> ${new Date(data).toLocaleDateString('it-IT')}<br><strong>Ora:</strong> ${ora}<br><strong>Luogo:</strong> ${luogo}</p><p>Ti contatteremo presto per confermare la tua prenotazione.</p><p>Grazie,<br>Team RESTOMOD Made in Italy</p>`
      };
      
      await sgMail.send(msg);
    }
    
    res.status(201).json({
      message: 'Test drive prenotato con successo',
      testDrive
    });
  } catch (error) {
    res.status(400).json({ message: 'Errore nella prenotazione del test drive', error: error.message });
  }
};

// Ottieni tutti i test drive (solo admin)
exports.getAllTestDrive = async (req, res) => {
  try {
    const testDrives = await TestDrive.find()
      .populate('utente', 'nome email')
      .populate('modello', 'nome costruttore')
      .populate({
        path: 'modello',
        populate: { path: 'costruttore', select: 'nome' }
      })
      .sort({ data: 1 });
    
    res.status(200).json(testDrives);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero dei test drive', error: error.message });
  }
};

// Ottieni i test drive dell'utente corrente
exports.getUserTestDrive = async (req, res) => {
  try {
    const testDrives = await TestDrive.find({ utente: req.user.id })
      .populate('modello', 'nome costruttore immagini')
      .populate({
        path: 'modello',
        populate: { path: 'costruttore', select: 'nome' }
      })
      .sort({ data: 1 });
    
    res.status(200).json(testDrives);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero dei test drive', error: error.message });
  }
};

// Ottieni un singolo test drive
exports.getTestDrive = async (req, res) => {
  try {
    const testDrive = await TestDrive.findById(req.params.id)
      .populate('utente', 'nome email')
      .populate('modello')
      .populate({
        path: 'modello',
        populate: { path: 'costruttore' }
      });
    
    if (!testDrive) {
      return res.status(404).json({ message: 'Test drive non trovato' });
    }
    
    // Verifica che l'utente sia autorizzato (admin o proprietario)
    if (req.user.ruolo !== 'admin' && testDrive.utente._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }
    
    res.status(200).json(testDrive);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero del test drive', error: error.message });
  }
};

// Aggiorna lo stato di un test drive (solo admin)
exports.updateTestDriveStatus = async (req, res) => {
  try {
    const { stato } = req.body;
    
    if (!['richiesto', 'confermato', 'completato', 'annullato'].includes(stato)) {
      return res.status(400).json({ message: 'Stato non valido' });
    }
    
    const testDrive = await TestDrive.findByIdAndUpdate(
      req.params.id,
      { stato, updatedAt: Date.now() },
      { new: true }
    )
    .populate('utente', 'nome email')
    .populate('modello', 'nome');
    
    if (!testDrive) {
      return res.status(404).json({ message: 'Test drive non trovato' });
    }
    
    // Invia email di aggiornamento stato se SendGrid è configurato
    if (process.env.SENDGRID_API_KEY) {
      let subject, text, html;
      
      switch (stato) {
        case 'confermato':
          subject = 'Test Drive Confermato';
          text = `Gentile ${testDrive.utente.nome},\n\nIl tuo test drive per il modello ${testDrive.modello.nome} è stato confermato.\nData: ${new Date(testDrive.data).toLocaleDateString('it-IT')}\nOra: ${testDrive.ora}\nLuogo: ${testDrive.luogo}\n\nGrazie,\nTeam RESTOMOD Made in Italy`;
          html = `<p>Gentile ${testDrive.utente.nome},</p><p>Il tuo test drive per il modello <strong>${testDrive.modello.nome}</strong> è stato confermato.</p><p><strong>Data:</strong> ${new Date(testDrive.data).toLocaleDateString('it-IT')}<br><strong>Ora:</strong> ${testDrive.ora}<br><strong>Luogo:</strong> ${testDrive.luogo}</p><p>Grazie,<br>Team RESTOMOD Made in Italy</p>`;
          break;
        case 'annullato':
          subject = 'Test Drive Annullato';
          text = `Gentile ${testDrive.utente.nome},\n\nCi dispiace informarti che il tuo test drive per il modello ${testDrive.modello.nome} è stato annullato.\nTi preghiamo di contattarci per maggiori informazioni o per riprogrammare.\n\nGrazie,\nTeam RESTOMOD Made in Italy`;
          html = `<p>Gentile ${testDrive.utente.nome},</p><p>Ci dispiace informarti che il tuo test drive per il modello <strong>${testDrive.modello.nome}</strong> è stato annullato.</p><p>Ti preghiamo di contattarci per maggiori informazioni o per riprogrammare.</p><p>Grazie,<br>Team RESTOMOD Made in Italy</p>`;
          break;
        default:
          subject = 'Aggiornamento Test Drive';
          text = `Gentile ${testDrive.utente.nome},\n\nIl tuo test drive per il modello ${testDrive.modello.nome} è stato aggiornato.\nNuovo stato: ${stato}\n\nGrazie,\nTeam RESTOMOD Made in Italy`;
          html = `<p>Gentile ${testDrive.utente.nome},</p><p>Il tuo test drive per il modello <strong>${testDrive.modello.nome}</strong> è stato aggiornato.</p><p><strong>Nuovo stato:</strong> ${stato}</p><p>Grazie,<br>Team RESTOMOD Made in Italy</p>`;
      }
      
      const msg = {
        to: testDrive.utente.email,
        from: process.env.EMAIL_FROM || 'info@restomod-madeinitaly.com',
        subject,
        text,
        html
      };
      
      await sgMail.send(msg);
    }
    
    res.status(200).json(testDrive);
  } catch (error) {
    res.status(400).json({ message: 'Errore nell\'aggiornamento del test drive', error: error.message });
  }
};

// Elimina un test drive (solo admin)
exports.deleteTestDrive = async (req, res) => {
  try {
    const testDrive = await TestDrive.findById(req.params.id);
    
    if (!testDrive) {
      return res.status(404).json({ message: 'Test drive non trovato' });
    }
    
    await TestDrive.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Test drive eliminato con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'eliminazione del test drive', error: error.message });
  }
};