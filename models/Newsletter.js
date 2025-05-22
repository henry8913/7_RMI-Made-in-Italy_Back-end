const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'L\'email è obbligatoria'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Formato email non valido']
  },
  nome: {
    type: String,
    trim: true
  },
  iscritto: {
    type: Boolean,
    default: true
  },
  dataIscrizione: {
    type: Date,
    default: Date.now
  },
  dataDisiscrizione: {
    type: Date
  },
  preferenze: {
    modelli: {
      type: Boolean,
      default: true
    },
    eventi: {
      type: Boolean,
      default: true
    },
    offerte: {
      type: Boolean,
      default: true
    }
  },
  token: {
    type: String
  }
});

// Metodo per generare token di disiscrizione
newsletterSchema.methods.generaToken = function() {
  const token = Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
  this.token = token;
  return token;
};

module.exports = mongoose.model('Newsletter', newsletterSchema);