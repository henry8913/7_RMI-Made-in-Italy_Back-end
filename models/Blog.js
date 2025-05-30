const mongoose = require('mongoose');

const commentoSchema = new mongoose.Schema({
  utente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testo: {
    type: String,
    required: [true, 'Il testo del commento è obbligatorio'],
    trim: true,
    maxlength: [1000, 'Il commento non può superare i 1000 caratteri']
  },
  dataCreazione: {
    type: Date,
    default: Date.now
  },
  approvato: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: false
});

const blogSchema = new mongoose.Schema({
  titolo: {
    type: String,
    required: [true, 'Il titolo è obbligatorio'],
    trim: true,
    maxlength: [200, 'Il titolo non può superare i 200 caratteri']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  contenuto: {
    type: String,
    required: [true, 'Il contenuto è obbligatorio']
  },
  immagineCopertina: {
    type: String,
    default: ''
  },
  autore: {
    type: String,
    required: [true, 'L\'autore è obbligatorio'],
    trim: true
  },
  categoria: {
    type: String,
    required: [true, 'La categoria è obbligatoria'],
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  stato: {
    type: String,
    enum: ['bozza', 'pubblicato', 'archiviato'],
    default: 'bozza'
  },
  inEvidenza: {
    type: Boolean,
    default: false
  },
  dataCreazione: {
    type: Date,
    default: Date.now
  },
  dataPubblicazione: {
    type: Date,
    default: null
  },
  dataModifica: {
    type: Date,
    default: null
  },
  visualizzazioni: {
    type: Number,
    default: 0
  },
  commentiAbilitati: {
    type: Boolean,
    default: true
  },
  commenti: [commentoSchema],
  miPiace: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: false
});

// Metodo per generare uno slug dal titolo
blogSchema.pre('save', function(next) {
  if (!this.isModified('titolo') && this.slug) {
    return next();
  }
  
  // Genera slug dal titolo
  this.slug = this.titolo
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '-');
    
  // Aggiungi timestamp per garantire unicità
  this.slug = `${this.slug}-${Date.now().toString().slice(-6)}`;
  
  next();
});

// Aggiorna la data di modifica quando il post viene aggiornato
blogSchema.pre('save', function(next) {
  if (this.isModified() && this.stato === 'pubblicato') {
    this.dataModifica = Date.now();
  }
  
  // Se lo stato cambia da bozza a pubblicato, imposta la data di pubblicazione
  if (this.isModified('stato') && this.stato === 'pubblicato' && !this.dataPubblicazione) {
    this.dataPubblicazione = Date.now();
  }
  
  next();
});

module.exports = mongoose.model('Blog', blogSchema);