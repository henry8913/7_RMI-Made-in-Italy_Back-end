const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  titolo: {
    type: String,
    required: [true, 'Il titolo della posizione è obbligatorio'],
    trim: true
  },
  azienda: {
    type: String,
    required: [true, 'L\'azienda è obbligatoria'],
    trim: true
  },
  descrizione: {
    type: String,
    required: [true, 'La descrizione della posizione è obbligatoria']
  },
  requisiti: [{
    type: String
  }],
  tipo: {
    type: String,
    enum: ['full-time', 'part-time', 'stage', 'freelance'],
    required: true
  },
  luogo: {
    type: String,
    required: [true, 'Il luogo di lavoro è obbligatorio']
  },
  remoto: {
    type: Boolean,
    default: false
  },
  salario: {
    min: Number,
    max: Number,
    valuta: {
      type: String,
      default: 'EUR'
    }
  },
  dataScadenza: {
    type: Date
  },
  attivo: {
    type: Boolean,
    default: true
  },
  candidature: [{
    candidato: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cv: String,
    lettera: String,
    stato: {
      type: String,
      enum: ['ricevuta', 'in_revisione', 'colloquio', 'accettata', 'rifiutata'],
      default: 'ricevuta'
    },
    dataInvio: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Aggiorna la data di modifica prima del salvataggio
jobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Job', jobSchema);