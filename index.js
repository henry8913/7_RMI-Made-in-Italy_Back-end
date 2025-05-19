
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 404;

// Connessione al database MongoDB
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log("Connessione al database MongoDB stabilita"))
  .catch(err => console.error("Errore di connessione al database:", err));

// Middleware
app.use(cors());
app.use(express.json());

// Info route
app.get("/info", (req, res) => {
  res.status(200).send("Benvenuto! Il progetto è attualmente in fase di sviluppo. Presto sarà disponibile online con tutte le sue funzionalità.");
});

// Test route per verificare la connessione al database
app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "API funzionante correttamente", database: "Connesso" });
});

// Rotte di autenticazione
app.use('/api/auth', authRoutes);

// API route di base
app.get("/api", (req, res) => {
  res.status(200).json({
    message: "Benvenuto alle API di RMI Made in Italy",
    status: "online",
    endpoints: [
      { path: "/info", description: "Informazioni sul progetto" },
      { path: "/api/test", description: "Test della connessione al database" },
      { path: "/api/auth/register", description: "Registrazione utente" },
      { path: "/api/auth/login", description: "Login utente" },
      { path: "/api/auth/profile", description: "Profilo utente (richiede autenticazione)" },
      { path: "/api/auth/admin", description: "Area admin (richiede ruolo admin)" }
    ]
  });
});

// Avvio del server
app.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
  console.log(`Server accessibile all'indirizzo: http://localhost:${PORT}`);
});