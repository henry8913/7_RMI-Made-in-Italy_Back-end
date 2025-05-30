
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");


const app = express();
const PORT = process.env.PORT || 2025;

// Connessione al database MongoDB
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log("Connessione al database MongoDB stabilita"))
  .catch(err => console.error("Errore di connessione al database:", err));

app.use(cors());
app.use(express.json());
app.use(cookieParser());


app.get("/info", (req, res) => {
  res.status(200).send("Benvenuto! Il progetto è attualmente in fase di sviluppo. Presto sarà disponibile online con tutte le sue funzionalità.");
});

// Avvio del server
app.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
  console.log(`Server accessibile all'indirizzo: http://localhost:${PORT}`);
});