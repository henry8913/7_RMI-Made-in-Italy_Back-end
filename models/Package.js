const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Il nome del pacchetto è obbligatorio'],
    trim: true
  },
  descrizione: {
    type: String,
    required: [true, 'La descrizione del pacchetto è obbligatoria']
  },
  prezzo: {
    type: Number,
    required: [true, 'Il prezzo è obbligatorio']
  },
  valuta: {
    type: String,
    default: 'EUR'
  },
  caratteristiche: [{
    type: String
  }],
  immagine: {
    type: String
  },
  durata: {
    type: String
  },
  attivo: {
    type: Boolean,
    default: true
  },
  stripeProductId: {
    type: String
  },
  stripePriceId: {
    type: String
  },
  ordini: [{
    utente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dataAcquisto: {
      type: Date,
      default: Date.now
    },
    stripeSessionId: String,
    stato: {
      type: String,
      enum: ['in_attesa', 'completato', 'annullato', 'rimborsato'],
      default: 'in_attesa'
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
packageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Package', packageSchema);