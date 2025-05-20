const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware per verificare il token JWT e proteggere le rotte
exports.authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    if (!token) {
      return res.status(401).json({ message: 'Accesso negato. Token non fornito.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Token non valido o utente non trovato' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Errore di autenticazione:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token non valido' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token scaduto' });
    }
    res.status(500).json({ message: 'Errore durante l\'autenticazione', error: error.message });
  }
};

// Middleware per verificare il ruolo dell'utente
exports.checkRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Utente non autenticato' });
    }
    
    if (req.user.ruolo !== role) {
      return res.status(403).json({ 
        message: `Accesso negato. È richiesto il ruolo '${role}' per accedere a questa risorsa.` 
      });
    }
    
    next();
  };
};