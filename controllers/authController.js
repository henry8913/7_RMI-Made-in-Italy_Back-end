const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Funzione per generare il token JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d' // Il token scade dopo 30 giorni
  });
};

// Registrazione utente
exports.register = async (req, res) => {
  try {
    const { nome, email, password, adminSecretKey } = req.body;
    
    // Verifica se l'utente esiste già
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Utente già registrato con questa email' });
    }
    
    // Prepara i dati utente
    const userData = {
      nome,
      email,
      password
    };
    
    // Verifica se l'utente sta tentando di registrarsi come admin
    if (adminSecretKey) {
      // Verifica che il codice segreto sia corretto
      if (adminSecretKey === process.env.ADMIN_SECRET_KEY) {
        userData.ruolo = 'admin';
      } else {
        return res.status(403).json({ message: 'Codice segreto non valido per la registrazione come admin' });
      }
    }
    
    // Crea il nuovo utente
    const user = await User.create(userData);
    
    // Genera il token JWT
    const token = generateToken(user._id);
    
    // Restituisci i dati dell'utente (esclusa la password) e il token
    res.status(201).json({
      _id: user._id,
      nome: user.nome,
      email: user.email,
      ruolo: user.ruolo,
      token
    });
  } catch (error) {
    console.error('Errore durante la registrazione:', error);
    res.status(500).json({ message: 'Errore durante la registrazione', error: error.message });
  }
};

// Login utente
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Trova l'utente tramite email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email o password non validi' });
    }
    
    // Verifica la password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email o password non validi' });
    }
    
    // Genera il token JWT
    const token = generateToken(user._id);
    
    // Restituisci i dati dell'utente (esclusa la password) e il token
    res.status(200).json({
      _id: user._id,
      nome: user.nome,
      email: user.email,
      ruolo: user.ruolo,
      token
    });
  } catch (error) {
    console.error('Errore durante il login:', error);
    res.status(500).json({ message: 'Errore durante il login', error: error.message });
  }
};

// Ottieni profilo utente corrente
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Errore durante il recupero del profilo:', error);
    res.status(500).json({ message: 'Errore durante il recupero del profilo', error: error.message });
  }
};