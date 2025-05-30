const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Il nome del costruttore è obbligatorio'],
    trim: true,
    unique: true
  },
  descrizione: {
    type: String,
    required: [true, 'La descrizione è obbligatoria']
  },
  logo: {
    type: String,
    required: [true, 'Il logo è obbligatorio']
  },
  storia: {
    type: String
  },
  sede: {
    type: String,
    required: [true, 'La sede è obbligatoria']
  },
  annoFondazione: {
    type: Number
  },
  sito: {
    type: String
  },
  contatti: {
    email: String,
    telefono: String
  },
  immagini: [{
    url: String,
    alt: String
  }],
  modelli: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restomod'
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
brandSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Brand', brandSchema);