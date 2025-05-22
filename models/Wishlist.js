const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  utente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
wishlistSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Metodo per aggiungere un modello alla wishlist
wishlistSchema.methods.aggiungiModello = async function(modelloId) {
  if (!this.modelli.includes(modelloId)) {
    this.modelli.push(modelloId);
    await this.save();
    return true;
  }
  return false;
};

// Metodo per rimuovere un modello dalla wishlist
wishlistSchema.methods.rimuoviModello = async function(modelloId) {
  if (this.modelli.includes(modelloId)) {
    this.modelli = this.modelli.filter(id => id.toString() !== modelloId.toString());
    await this.save();
    return true;
  }
  return false;
};

module.exports = mongoose.model('Wishlist', wishlistSchema);