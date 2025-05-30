const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const User = require('../models/User');

// Configurazione della strategia Google OAuth 2.0
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:404/api/auth/google/callback",
    passReqToCallback: true
  },
  async function(request, accessToken, refreshToken, profile, done) {
    try {
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        user = await User.create({
          nome: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          password: 'google-auth-' + Math.random().toString(36).substring(2),
          authProvider: 'google'
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serializzazione e deserializzazione dell'utente
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;