const mongoose = require('mongoose');

const customRequestSchema = new mongoose.Schema({
  utente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modelloBase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restomod'
  },
  titolo: {
    type: String,
    required: [true, 'Il titolo della richiesta è obbligatorio'],
    trim: true
  },
  descrizione: {
    type: String,
    required: [true, 'La descrizione della personalizzazione è obbligatoria']
  },
  budget: {
    type: Number
  },
  tempistiche: {
    type: String
  },
  allegati: [{
    url: String,
    tipo: String,
    nome: String
  }],
  stato: {
    type: String,
    enum: ['inviata', 'in_revisione', 'preventivo_inviato', 'accettata', 'rifiutata', 'completata'],
    default: 'inviata'
  },
  rispostaAdmin: {
    testo: String,
    data: Date,
    preventivo: Number
  },
  contatto: {
    nome: String,
    email: String,
    telefono: String
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
customRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CustomRequest', customRequestSchema);