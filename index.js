
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const session = require("express-session");

// Importazione delle rotte
const authRoutes = require('./routes/authRoutes');
const brandRoutes = require('./routes/brandRoutes');
const restomodRoutes = require('./routes/restomodRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const testDriveRoutes = require('./routes/testDriveRoutes');
const customRequestRoutes = require('./routes/customRequestRoutes');
const jobRoutes = require('./routes/jobRoutes');
const packageRoutes = require('./routes/packageRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const contactRoutes = require('./routes/contactRoutes');
const blogRoutes = require('./routes/blogRoutes');

require('./config/passport');

const app = express();
const PORT = process.env.PORT || 404;

// Connessione al database MongoDB
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log("Connessione al database MongoDB stabilita"))
  .catch(err => console.error("Errore di connessione al database:", err));

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Configurazione delle sessioni
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Inizializzazione di Passport
app.use(passport.initialize());
app.use(passport.session());


app.get("/info", (req, res) => {
  res.status(200).send("Benvenuto! Il progetto è attualmente in fase di sviluppo. Presto sarà disponibile online con tutte le sue funzionalità.");
});

app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "API funzionante correttamente", database: "Connesso" });
});

// Configurazione delle rotte API
app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/restomods', restomodRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/test-drive', testDriveRoutes);
app.use('/api/custom-requests', customRequestRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/blog', blogRoutes);

// Rotta per il webhook di Stripe (deve essere prima del middleware express.json)
app.post('/api/packages/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const packageController = require('./controllers/packageController');
  // Passa la richiesta al controller che gestirà la modalità demo o reale
  packageController.handleStripeWebhook(req, res);
});

// Rotta di test per simulare un webhook di Stripe in modalità demo
app.get('/api/packages/webhook/test', (req, res) => {
  // Imposta una flag per indicare che è una richiesta di test
  req.isTestWebhook = true;
  const packageController = require('./controllers/packageController');
  // Lascia che sia il controller a gestire la risposta
  packageController.handleStripeWebhook(req, res);
});

app.get("/api", (req, res) => {
  res.status(200).json({
    message: "Benvenuto alle API di RMI Made in Italy",
    status: "online",
    endpoints: [
      { path: "/info", description: "Informazioni sul progetto" },
      { path: "/api/test", description: "Test della connessione al database" },
      { path: "/api/auth", description: "Autenticazione e gestione utenti" },
      { path: "/api/brands", description: "Gestione costruttori" },
      { path: "/api/restomods", description: "Gestione modelli restomod" },
      { path: "/api/wishlist", description: "Gestione wishlist utente" },
      { path: "/api/test-drive", description: "Prenotazione test drive" },
      { path: "/api/custom-requests", description: "Richieste personalizzate" },
      { path: "/api/jobs", description: "Offerte di lavoro" },
      { path: "/api/packages", description: "Pacchetti extra e pagamenti" },
      { path: "/api/newsletter", description: "Gestione newsletter" },
      { path: "/api/contacts", description: "Contatti e upload file" },
      { path: "/api/blog", description: "Gestione blog e articoli" }
    ]
  });
});

// Avvio del server
app.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
  console.log(`Server accessibile all'indirizzo: http://localhost:${PORT}`);
});