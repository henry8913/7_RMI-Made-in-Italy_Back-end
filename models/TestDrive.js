const mongoose = require('mongoose');

const testDriveSchema = new mongoose.Schema({
  utente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modello: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restomod',
    required: true
  },
  data: {
    type: Date,
    required: [true, 'La data del test drive è obbligatoria']
  },
  ora: {
    type: String,
    required: [true, "L'ora del test drive è obbligatoria"]
  },
  stato: {
    type: String,
    enum: ['richiesto', 'confermato', 'completato', 'annullato'],
    default: 'richiesto'
  },
  note: {
    type: String
  },
  luogo: {
    type: String,
    required: [true, 'Il luogo del test drive è obbligatorio']
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
testDriveSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TestDrive', testDriveSchema);