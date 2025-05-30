const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Il nome è obbligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'L\'email è obbligatoria'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Formato email non valido']
  },
  password: {
    type: String,
    required: [true, 'La password è obbligatoria'],
    minlength: [6, 'La password deve contenere almeno 6 caratteri']
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  ruolo: {
    type: String,
    enum: ['client', 'admin'],
    default: 'client'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware per hashare la password prima del salvataggio
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(Number(process.env.SALT_ROUNDS) || 10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Metodo per confrontare le password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;