const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['package', 'restomod'],
    required: true
  },
  prodotto: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'tipo',
    required: true
  },
  nome: {
    type: String,
    required: true
  },
  prezzo: {
    type: Number,
    required: true
  },
  quantita: {
    type: Number,
    default: 1
  },
  immagine: String
});

const orderSchema = new mongoose.Schema({
  utente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totale: {
    type: Number,
    required: true
  },
  stato: {
    type: String,
    enum: ['in_attesa', 'completato', 'annullato'],
    default: 'completato'
  },
  infoCliente: {
    nome: String,
    cognome: String,
    email: String,
    indirizzo: String,
    citta: String,
    cap: String,
    paese: String,
    metodoPagamento: String
  },
  dataCreazione: {
    type: Date,
    default: Date.now
  }
});

// Metodo per calcolare il totale dell'ordine
orderSchema.methods.calcolaTotale = function() {
  return this.items.reduce((total, item) => {
    return total + (item.prezzo * item.quantita);
  }, 0);
};

module.exports = mongoose.model('Order', orderSchema);