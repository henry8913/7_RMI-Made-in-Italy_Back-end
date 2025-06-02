const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Funzione per generare il token JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Registrazione utente
exports.register = async (req, res) => {
  try {
    const { nome, email, password, adminSecretKey } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      if (userExists.authProvider === 'google') {
        return res.status(400).json({ 
          message: 'Utente già registrato con questa email tramite Google. Utilizza il pulsante "Accedi con Google"',
          isGoogleAccount: true 
        });
      }
      return res.status(400).json({ message: 'Utente già registrato con questa email' });
    }
    
    const userData = {
      nome,
      email,
      password,
      authProvider: 'local'
    };
    
    if (adminSecretKey) {
      if (adminSecretKey === process.env.ADMIN_SECRET_KEY) {
        userData.ruolo = 'admin';
      } else {
        return res.status(403).json({ message: 'Codice segreto non valido per la registrazione come admin' });
      }
    }
    
    const user = await User.create(userData);
    
    const token = generateToken(user._id);
    
    res.status(201).json({
      _id: user._id,
      nome: user.nome,
      email: user.email,
      ruolo: user.ruolo,
      authProvider: user.authProvider,
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
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email o password non validi' });
    }
    
    if (user.authProvider === 'google') {
      const token = generateToken(user._id);
      
      return res.status(200).json({
        _id: user._id,
        nome: user.nome,
        email: user.email,
        ruolo: user.ruolo,
        authProvider: user.authProvider,
        token
      });
    }
    
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email o password non validi' });
    }
    
    const token = generateToken(user._id);
    
    res.status(200).json({
      _id: user._id,
      nome: user.nome,
      email: user.email,
      ruolo: user.ruolo,
      authProvider: user.authProvider,
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
    res.status(200).json({
      _id: user._id,
      nome: user.nome,
      email: user.email,
      ruolo: user.ruolo,
      authProvider: user.authProvider,
      googleId: user.googleId
    });
  } catch (error) {
    console.error('Errore durante il recupero del profilo:', error);
    res.status(500).json({ message: 'Errore durante il recupero del profilo', error: error.message });
  }
};

// Callback per l'autenticazione Google
exports.googleAuthCallback = (req, res) => {
  try {
    // L'utente è già autenticato da passport a questo punto
    const token = generateToken(req.user._id);
    
    // Reindirizza al frontend con il token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/google/success?token=${token}`);
  } catch (error) {
    console.error('Errore durante il callback Google:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
};

// Login con Google
exports.googleLogin = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email, authProvider: 'google' });
    if (!user) {
      return res.status(401).json({ 
        message: 'Nessun account Google trovato con questa email. Effettua prima la registrazione con Google.',
        isGoogleAccount: false
      });
    }
    
    // Nota: questo endpoint non verrà mai raggiunto direttamente,
    // poiché il frontend dovrebbe reindirizzare direttamente a /api/auth/google
    res.status(200).json({ 
      message: 'Utilizza il pulsante "Accedi con Google" per effettuare il login',
      redirectTo: '/api/auth/google'
    });
  } catch (error) {
    console.error('Errore durante il login con Google:', error);
    res.status(500).json({ message: 'Errore durante il login con Google', error: error.message });
  }
};

// Ottieni tutti gli utenti (solo per admin)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Errore durante il recupero degli utenti:', error);
    res.status(500).json({ message: 'Errore durante il recupero degli utenti', error: error.message });
  }
};

// Aggiorna un utente (solo per admin)
exports.updateUser = async (req, res) => {
  try {
    const { nome, email, ruolo } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { nome, email, ruolo },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dell\'utente:', error);
    res.status(500).json({ message: 'Errore durante l\'aggiornamento dell\'utente', error: error.message });
  }
};

// Elimina un utente (solo per admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    
    res.status(200).json({ message: 'Utente eliminato con successo' });
  } catch (error) {
    console.error('Errore durante l\'eliminazione dell\'utente:', error);
    res.status(500).json({ message: 'Errore durante l\'eliminazione dell\'utente', error: error.message });
  }
};