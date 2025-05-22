const Job = require('../models/Job');
const User = require('../models/User');

// Ottieni tutti i lavori disponibili (pubblico)
exports.getJobs = async (req, res) => {
  try {
    const query = { attivo: true };
    
    // Filtraggio per tipo di lavoro
    if (req.query.tipo) {
      query.tipo = req.query.tipo;
    }
    
    // Filtraggio per azienda
    if (req.query.azienda) {
      query.azienda = req.query.azienda;
    }
    
    const jobs = await Job.find(query)
      .populate('azienda', 'nome logo')
      .select('-candidature')
      .sort({ createdAt: -1 });
      
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero dei lavori', error: error.message });
  }
};

// Ottieni un singolo lavoro per ID (pubblico)
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, attivo: true })
      .populate('azienda', 'nome logo sede contatti')
      .select('-candidature');
      
    if (!job) {
      return res.status(404).json({ message: 'Lavoro non trovato o non più disponibile' });
    }
    
    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero del lavoro', error: error.message });
  }
};

// Crea un nuovo lavoro (solo admin)
exports.createJob = async (req, res) => {
  try {
    const {
      titolo,
      azienda,
      descrizione,
      requisiti,
      tipo,
      luogo,
      remoto,
      salario,
      dataScadenza
    } = req.body;
    
    const job = await Job.create({
      titolo,
      azienda,
      descrizione,
      requisiti,
      tipo,
      luogo,
      remoto,
      salario,
      dataScadenza,
      attivo: true
    });
    
    res.status(201).json(job);
  } catch (error) {
    res.status(400).json({ message: 'Errore nella creazione del lavoro', error: error.message });
  }
};

// Aggiorna un lavoro esistente (solo admin)
exports.updateJob = async (req, res) => {
  try {
    const {
      titolo,
      azienda,
      descrizione,
      requisiti,
      tipo,
      luogo,
      remoto,
      salario,
      dataScadenza,
      attivo
    } = req.body;
    
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Lavoro non trovato' });
    }
    
    job.titolo = titolo || job.titolo;
    job.azienda = azienda || job.azienda;
    job.descrizione = descrizione || job.descrizione;
    job.requisiti = requisiti || job.requisiti;
    job.tipo = tipo || job.tipo;
    job.luogo = luogo || job.luogo;
    job.remoto = remoto !== undefined ? remoto : job.remoto;
    job.salario = salario || job.salario;
    job.dataScadenza = dataScadenza || job.dataScadenza;
    job.attivo = attivo !== undefined ? attivo : job.attivo;
    
    const updatedJob = await job.save();
    
    res.status(200).json(updatedJob);
  } catch (error) {
    res.status(400).json({ message: 'Errore nell\'aggiornamento del lavoro', error: error.message });
  }
};

// Elimina un lavoro (solo admin)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Lavoro non trovato' });
    }
    
    await job.remove();
    
    res.status(200).json({ message: 'Lavoro eliminato con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'eliminazione del lavoro', error: error.message });
  }
};

// Invia candidatura per un lavoro (utenti autenticati)
exports.inviaCandiatura = async (req, res) => {
  try {
    const { cv, lettera } = req.body;
    const userId = req.user._id;
    const jobId = req.params.id;
    
    const job = await Job.findOne({ _id: jobId, attivo: true });
    
    if (!job) {
      return res.status(404).json({ message: 'Lavoro non trovato o non più disponibile' });
    }
    
    // Verifica se l'utente ha già inviato una candidatura
    const candidaturaEsistente = job.candidature.find(
      candidatura => candidatura.candidato.toString() === userId.toString()
    );
    
    if (candidaturaEsistente) {
      return res.status(400).json({ message: 'Hai già inviato una candidatura per questo lavoro' });
    }
    
    // Aggiungi la candidatura
    job.candidature.push({
      candidato: userId,
      cv,
      lettera,
      stato: 'ricevuta',
      dataInvio: Date.now()
    });
    
    await job.save();
    
    res.status(201).json({ message: 'Candidatura inviata con successo' });
  } catch (error) {
    res.status(400).json({ message: 'Errore nell\'invio della candidatura', error: error.message });
  }
};

// Ottieni tutte le candidature per un lavoro (solo admin)
exports.getCandidature = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate({
        path: 'candidature.candidato',
        select: 'nome email'
      });
    
    if (!job) {
      return res.status(404).json({ message: 'Lavoro non trovato' });
    }
    
    res.status(200).json(job.candidature);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle candidature', error: error.message });
  }
};

// Aggiorna lo stato di una candidatura (solo admin)
exports.aggiornaStatoCandidatura = async (req, res) => {
  try {
    const { stato } = req.body;
    const { id, candidaturaId } = req.params;
    
    const job = await Job.findById(id);
    
    if (!job) {
      return res.status(404).json({ message: 'Lavoro non trovato' });
    }
    
    const candidatura = job.candidature.id(candidaturaId);
    
    if (!candidatura) {
      return res.status(404).json({ message: 'Candidatura non trovata' });
    }
    
    candidatura.stato = stato;
    await job.save();
    
    res.status(200).json({ message: 'Stato candidatura aggiornato con successo', candidatura });
  } catch (error) {
    res.status(400).json({ message: 'Errore nell\'aggiornamento dello stato della candidatura', error: error.message });
  }
};

// Ottieni le candidature dell'utente corrente
exports.getUserCandidature = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const jobs = await Job.find({ 'candidature.candidato': userId })
      .populate('azienda', 'nome logo')
      .select('titolo tipo luogo candidature');
    
    const candidature = jobs.map(job => {
      const candidaturaUtente = job.candidature.find(
        c => c.candidato.toString() === userId.toString()
      );
      
      return {
        job: {
          _id: job._id,
          titolo: job.titolo,
          tipo: job.tipo,
          luogo: job.luogo,
          azienda: job.azienda
        },
        candidatura: {
          _id: candidaturaUtente._id,
          stato: candidaturaUtente.stato,
          dataInvio: candidaturaUtente.dataInvio
        }
      };
    });
    
    res.status(200).json(candidature);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle candidature', error: error.message });
  }
};