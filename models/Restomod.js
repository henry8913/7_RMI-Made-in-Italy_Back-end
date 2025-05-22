const mongoose = require('mongoose');

const restomodSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Il nome del modello è obbligatorio'],
    trim: true
  },
  costruttore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, 'Il costruttore è obbligatorio']
  },
  descrizione: {
    type: String,
    required: [true, 'La descrizione è obbligatoria']
  },
  anno: {
    type: Number,
    required: [true, 'L\'anno è obbligatorio']
  },
  prezzo: {
    type: Number,
    required: [true, 'Il prezzo è obbligatorio']
  },
  stato: {
    type: String,
    enum: ['available', 'reserved', 'sold'],
    default: 'available'
  },
  specifiche: {
    motore: String,
    potenza: String,
    trasmissione: String,
    accelerazione: String,
    velocitaMax: String
  },
  immagini: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  caratteristiche: [String],
  inEvidenza: {
    type: Boolean,
    default: false
  },
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
restomodSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Restomod', restomodSchema);