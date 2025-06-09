
<h1 align="center"> 
  <img src="https://readme-typing-svg.herokuapp.com/?font=Iosevka&size=30&color=d4af37&center=true&vCenter=true&width=800&height=60&lines=⚙️+RMI+Made+in+Italy+-+Back-end&repeat=false" alt="⚙️ RMI Made in Italy - Back-end"> 
</h1> 

**RMI Made in Italy Back-end** è un'API RESTful robusta e scalabile che alimenta l'applicazione di gestione per auto d'epoca italiane restaurate e modernizzate. Questo server Express.js fornisce tutti i servizi necessari per gestire il catalogo prodotti, l'autenticazione utenti, gli ordini e molto altro. 

<p align="center"> 
  <img src="./img/cover_a.mp4" alt="Cover" width="100%" /> 
</p> 

Questo progetto implementa un'architettura backend moderna basata su Node.js e MongoDB, con autenticazione JWT, integrazione di pagamenti e gestione completa delle risorse. Il codice è organizzato seguendo il pattern MVC per garantire manutenibilità e scalabilità. 

### Tecnologie Principali: 
- **Node.js**: Runtime JavaScript lato server 
- **Express.js**: Framework web veloce e minimalista 
- **MongoDB**: Database NoSQL flessibile e scalabile 
- **Mongoose**: ODM per modellazione dei dati 
- **JWT**: Autenticazione basata su token 
- **Passport.js**: Middleware per autenticazione 
- **Stripe**: Integrazione pagamenti 
- **SendGrid**: Servizio email transazionali 
- **Multer & Cloudinary**: Gestione upload file 

## 📊 Architettura API 

<p align="center"> 
  <img src="./img/cover_b.jpg" alt="API Architecture" width="100%" /> 
</p> 

--- 

## 📌 Funzionalità Principali 
- 🔐 **Autenticazione Completa**: JWT, Google OAuth, gestione sessioni 
- 📦 **Gestione Catalogo**: CRUD per marchi, restomods e pacchetti 
- 👤 **Profili Utente**: Registrazione, login, gestione profilo 
- 💾 **Persistenza Dati**: Modelli MongoDB ottimizzati 
- 📝 **Blog Engine**: API per gestione contenuti 
- 📅 **Sistema Appuntamenti**: Prenotazione test drive 
- 💼 **Gestione Lavori**: API per offerte di lavoro 
- 📨 **Newsletter**: Iscrizione e gestione comunicazioni 
- 📞 **Modulo Contatti**: Gestione richieste di contatto 
- 🛒 **Wishlist**: Salvataggio preferenze utente 

--- 

## 🔌 API Endpoints 

### Autenticazione e Utenti 
```javascript 
// Autenticazione 
POST   /api/auth/register         // Registrazione nuovo utente 
POST   /api/auth/login            // Login utente 
GET    /api/auth/profile          // Profilo utente corrente 
POST   /api/auth/logout           // Logout utente 
GET    /api/auth/google           // Autenticazione Google 
GET    /api/auth/google/callback  // Callback OAuth Google 
``` 

### Catalogo Prodotti 
```javascript 
// Marchi 
GET    /api/brands                // Lista tutti i marchi 
GET    /api/brands/:id            // Dettaglio singolo marchio 
POST   /api/brands                // Crea nuovo marchio (admin) 
PUT    /api/brands/:id            // Aggiorna marchio (admin) 
DELETE /api/brands/:id            // Elimina marchio (admin) 

// Restomods 
GET    /api/restomods             // Lista tutti i restomods 
GET    /api/restomods/:id         // Dettaglio singolo restomod 
POST   /api/restomods             // Crea nuovo restomod (admin) 
PUT    /api/restomods/:id         // Aggiorna restomod (admin) 
DELETE /api/restomods/:id         // Elimina restomod (admin) 
``` 

### Interazioni Utente 
```javascript 
// Wishlist 
GET    /api/wishlist              // Lista wishlist utente 
POST   /api/wishlist/:id          // Aggiungi item a wishlist 
DELETE /api/wishlist/:id          // Rimuovi item da wishlist 

// Test Drive 
POST   /api/test-drive            // Prenota test drive 
GET    /api/test-drive            // Lista prenotazioni (admin) 

// Richieste Personalizzate 
POST   /api/custom-request        // Invia richiesta personalizzata 
GET    /api/custom-request        // Lista richieste (admin) 
``` 

--- 

## 📂 Struttura del Progetto 
``` 
├── config/           # Configurazioni (database, auth, etc.) 
├── controllers/      # Controller per la logica di business 
├── data/             # Dati statici e seed 
├── middleware/       # Middleware personalizzati 
├── models/           # Modelli Mongoose 
├── routes/           # Definizione delle rotte API 
├── index.js          # Entry point dell'applicazione 
└── package.json      # Dipendenze e script 
``` 

## ⚙️ Modelli Dati 

### Principali Schemi: 
- **User**: Gestione utenti e autenticazione 
- **Brand**: Marchi automobilistici 
- **Restomod**: Veicoli restaurati e modificati 
- **TestDrive**: Prenotazioni test drive 
- **CustomRequest**: Richieste personalizzate 
- **Job**: Offerte di lavoro 
- **Package**: Pacchetti servizi 
- **Blog**: Articoli e contenuti 
- **Newsletter**: Iscrizioni newsletter 
- **Wishlist**: Lista desideri utente 

--- 

## 🚀 Setup Locale 
```bash 
# Clona il repository 
git clone https://github.com/henry8913/7_RMI-Made-in-Italy_Back-end.git 
cd 7_Capstone-Project_RMI-Made-in-Italy/Back-end 

# Installazione dipendenze 
npm install 

# Configurazione ambiente 
cp .env.example .env 
# Modifica il file .env con le tue configurazioni 

# Avvio server in modalità sviluppo 
npm run dev 

# Avvio server in produzione 
npm start 
``` 

## 🔧 Variabili d'Ambiente Richieste 
```env 
MONGODB_URL=mongodb://localhost:27017/rmi-made-in-italy 
JWT_SECRET=your_jwt_secret_key 
SESSION_SECRET=your_session_secret 
GOOGLE_CLIENT_ID=your_google_client_id 
GOOGLE_CLIENT_SECRET=your_google_client_secret 
SENDGRID_API_KEY=your_sendgrid_api_key 
STRIPE_SECRET_KEY=your_stripe_secret_key 
CLOUDINARY_CLOUD_NAME=your_cloudinary_name 
CLOUDINARY_API_KEY=your_cloudinary_api_key 
CLOUDINARY_API_SECRET=your_cloudinary_api_secret 
``` 

## ⚠️ Nota Importante 
Questo è un progetto dimostrativo. Le funzionalità di pagamento sono in modalità test e non processano transazioni reali. 

## 👤 Autore

Progetto creato da [Henry](https://github.com/henry8913).

## 📫 Contatti

<div align="center">

[![Website](https://img.shields.io/badge/-Website-000000?style=for-the-badge&logo=web&logoColor=white)](https://henrygdeveloper.com/)
[![LinkedIn](https://img.shields.io/badge/-LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/henry-k-grecchi-555454254)
[![Email](https://img.shields.io/badge/-Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:henry8913@hotmail.it)
[![WhatsApp](https://img.shields.io/badge/-WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://api.whatsapp.com/send/?phone=393926936916&text&type=phone_number&app_absent=0)

</div>

<img src="./img/h_cover.jpg" alt="Cover" width="100%" />

---

## 📄 Licenza

Questo progetto è rilasciato sotto licenza [GNU GPLv3](LICENSE.txt).
