const Blog = require('../models/Blog');
const User = require('../models/User');
const mongoose = require('mongoose');

// Ottieni tutti i post del blog (pubblico)
exports.getPosts = async (req, res) => {
  try {
    const filtro = {};
    
    // Filtri opzionali
    if (req.query.categoria) filtro.categoria = req.query.categoria;
    if (req.query.tag) filtro.tags = req.query.tag;
    if (req.query.autore) filtro.autore = req.query.autore;
    if (req.query.inEvidenza) filtro.inEvidenza = req.query.inEvidenza === 'true';
    
    // Per default mostriamo solo i post pubblicati
    if (!req.query.stato && (!req.user || req.user.ruolo !== 'admin')) {
      filtro.stato = 'pubblicato';
    } else if (req.query.stato && req.user && req.user.ruolo === 'admin') {
      filtro.stato = req.query.stato;
    }
    
    // Paginazione
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Ordinamento
    const sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      // Default: ordina per data di pubblicazione decrescente
      sort.dataPubblicazione = -1;
    }
    
    // Esegui la query
    let posts = await Blog.find(filtro)
      .populate('autore', 'nome email')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // Conta il totale dei post per la paginazione
    const totalPosts = await Blog.countDocuments(filtro);
    
    // Aggiungi informazioni sui commenti, mi piace e se l'utente corrente ha messo mi piace
    if (req.user) {
      posts = posts.map(post => {
        const postObj = post.toObject();
        postObj.commentiCount = post.commenti ? post.commenti.length : 0;
        postObj.miPiaceCount = post.miPiace ? post.miPiace.length : 0;
        postObj.userLiked = post.miPiace.some(userId => userId.toString() === req.user._id.toString());
        return postObj;
      });
    } else {
      posts = posts.map(post => {
        const postObj = post.toObject();
        postObj.commentiCount = post.commenti ? post.commenti.length : 0;
        postObj.miPiaceCount = post.miPiace ? post.miPiace.length : 0;
        postObj.userLiked = false;
        return postObj;
      });
    }
    
    res.status(200).json({
      posts,
      totalPosts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      hasMore: page < Math.ceil(totalPosts / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero dei post del blog', error: error.message });
  }
};

// Ottieni un singolo post del blog per ID o slug (pubblico)
exports.getPost = async (req, res) => {
  try {
    const query = {};
    
    // Cerca per ID o per slug
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query._id = req.params.id;
    } else {
      query.slug = req.params.id;
    }
    
    // Per default mostriamo solo i post pubblicati
    if (!req.user || req.user.ruolo !== 'admin') {
      query.stato = 'pubblicato';
    }
    
    const post = await Blog.findOne(query)
      .populate('autore', 'nome email')
      .populate('commenti.utente', 'nome email')
      .populate('miPiace', 'nome email');
    
    if (!post) {
      return res.status(404).json({ message: 'Post non trovato' });
    }
    
    // Incrementa il contatore delle visualizzazioni
    if (!req.query.noCount) {
      post.visualizzazioni += 1;
      await post.save();
    }
    
    // Verifica se l'utente corrente ha messo mi piace al post
    let userLiked = false;
    if (req.user) {
      userLiked = post.miPiace.some(userId => userId._id.toString() === req.user._id.toString());
    }
    
    // Converti il documento Mongoose in un oggetto JavaScript
    const postObj = post.toObject();
    
    // Aggiungi il campo userLiked
    postObj.userLiked = userLiked;
    
    res.status(200).json(postObj);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero del post', error: error.message });
  }
};

// Crea un nuovo post (solo admin)
exports.createPost = async (req, res) => {
  try {
    const { titolo, contenuto, immagineCopertina, categoria, tags, stato, inEvidenza, commentiAbilitati } = req.body;
    
    // Crea il nuovo post
    const post = new Blog({
      titolo,
      contenuto,
      immagineCopertina,
      autore: req.user._id,
      categoria,
      tags,
      stato,
      inEvidenza,
      commentiAbilitati
    });
    
    // Se il post è pubblicato, imposta la data di pubblicazione
    if (stato === 'pubblicato') {
      post.dataPubblicazione = Date.now();
    }
    
    await post.save();
    
    res.status(201).json({
      message: 'Post creato con successo',
      post
    });
  } catch (error) {
    res.status(400).json({ message: 'Errore nella creazione del post', error: error.message });
  }
};

// Aggiorna un post esistente (solo admin)
exports.updatePost = async (req, res) => {
  try {
    const { titolo, contenuto, immagineCopertina, categoria, tags, stato, inEvidenza, commentiAbilitati } = req.body;
    
    const post = await Blog.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post non trovato' });
    }
    
    // Aggiorna i campi
    if (titolo) post.titolo = titolo;
    if (contenuto) post.contenuto = contenuto;
    if (immagineCopertina) post.immagineCopertina = immagineCopertina;
    if (categoria) post.categoria = categoria;
    if (tags) post.tags = tags;
    if (inEvidenza !== undefined) post.inEvidenza = inEvidenza;
    if (commentiAbilitati !== undefined) post.commentiAbilitati = commentiAbilitati;
    
    // Se lo stato cambia a pubblicato e non era pubblicato prima
    if (stato && stato === 'pubblicato' && post.stato !== 'pubblicato') {
      post.dataPubblicazione = Date.now();
    }
    
    post.stato = stato || post.stato;
    post.dataModifica = Date.now();
    
    await post.save();
    
    res.status(200).json({
      message: 'Post aggiornato con successo',
      post
    });
  } catch (error) {
    res.status(400).json({ message: 'Errore nell\'aggiornamento del post', error: error.message });
  }
};

// Elimina un post (solo admin)
exports.deletePost = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post non trovato' });
    }
    
    await post.deleteOne();
    
    res.status(200).json({ message: 'Post eliminato con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore nell\'eliminazione del post', error: error.message });
  }
};

// Aggiorna lo stato di un post (solo admin)
exports.updatePostStatus = async (req, res) => {
  try {
    const { stato } = req.body;
    
    if (!['bozza', 'pubblicato', 'archiviato'].includes(stato)) {
      return res.status(400).json({ message: 'Stato non valido' });
    }
    
    const post = await Blog.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post non trovato' });
    }
    
    // Se lo stato cambia a pubblicato e non era pubblicato prima
    if (stato === 'pubblicato' && post.stato !== 'pubblicato') {
      post.dataPubblicazione = Date.now();
    }
    
    post.stato = stato;
    post.dataModifica = Date.now();
    
    await post.save();
    
    res.status(200).json({
      message: `Stato del post aggiornato a "${stato}"`,
      post
    });
  } catch (error) {
    res.status(400).json({ message: 'Errore nell\'aggiornamento dello stato del post', error: error.message });
  }
};

// Ottieni post in evidenza (pubblico)
exports.getFeaturedPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const posts = await Blog.find({ 
      stato: 'pubblicato',
      inEvidenza: true 
    })
    .populate('autore', 'nome email')
    .sort({ dataPubblicazione: -1 })
    .limit(limit);
    
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero dei post in evidenza', error: error.message });
  }
};

// Ottieni post correlati (pubblico)
exports.getRelatedPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 3;
    
    const post = await Blog.findById(id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post non trovato' });
    }
    
    // Trova post con la stessa categoria o tag simili
    const relatedPosts = await Blog.find({
      _id: { $ne: id },
      stato: 'pubblicato',
      $or: [
        { categoria: post.categoria },
        { tags: { $in: post.tags } }
      ]
    })
    .populate('autore', 'nome email')
    .sort({ dataPubblicazione: -1 })
    .limit(limit);
    
    res.status(200).json(relatedPosts);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero dei post correlati', error: error.message });
  }
};

// Aggiungi un commento a un post (utenti autenticati)
exports.addComment = async (req, res) => {
  try {
    const { testo } = req.body;
    
    if (!testo || testo.trim() === '') {
      return res.status(400).json({ message: 'Il testo del commento è obbligatorio' });
    }
    
    const post = await Blog.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post non trovato' });
    }
    
    if (!post.commentiAbilitati) {
      return res.status(403).json({ message: 'I commenti sono disabilitati per questo post' });
    }
    
    if (post.stato !== 'pubblicato') {
      return res.status(403).json({ message: 'Non è possibile commentare un post non pubblicato' });
    }
    
    const commento = {
      utente: req.user._id,
      testo,
      dataCreazione: Date.now(),
      approvato: true // Per default i commenti sono approvati automaticamente
    };
    
    post.commenti.push(commento);
    await post.save();
    
    // Popola i dati dell'utente per la risposta
    const commentoConUtente = await Blog.findById(post._id)
      .populate('commenti.utente', 'nome email')
      .select('commenti')
      .then(doc => doc.commenti[doc.commenti.length - 1]);
    
    res.status(201).json({
      message: 'Commento aggiunto con successo',
      commento: commentoConUtente
    });
  } catch (error) {
    res.status(400).json({ message: 'Errore nell\'aggiunta del commento', error: error.message });
  }
};

// Rimuovi un commento (proprietario del commento o admin)
exports.removeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    
    const post = await Blog.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post non trovato' });
    }
    
    const commento = post.commenti.id(commentId);
    
    if (!commento) {
      return res.status(404).json({ message: 'Commento non trovato' });
    }
    
    // Verifica che l'utente sia il proprietario del commento o un admin
    if (commento.utente.toString() !== req.user._id.toString() && req.user.ruolo !== 'admin') {
      return res.status(403).json({ message: 'Non sei autorizzato a eliminare questo commento' });
    }
    
    commento.deleteOne();
    await post.save();
    
    res.status(200).json({ message: 'Commento eliminato con successo' });
  } catch (error) {
    res.status(400).json({ message: 'Errore nella rimozione del commento', error: error.message });
  }
};

// Aggiungi/rimuovi mi piace a un post (utenti autenticati)
exports.toggleLike = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post non trovato' });
    }
    
    if (post.stato !== 'pubblicato') {
      return res.status(403).json({ message: 'Non è possibile mettere mi piace a un post non pubblicato' });
    }
    
    const userId = req.user._id;
    const userLikedIndex = post.miPiace.findIndex(id => id.toString() === userId.toString());
    
    // Toggle like
    if (userLikedIndex === -1) {
      // Aggiungi mi piace
      post.miPiace.push(userId);
    } else {
      // Rimuovi mi piace
      post.miPiace.splice(userLikedIndex, 1);
    }
    
    await post.save();
    
    res.status(200).json({
      message: userLikedIndex === -1 ? 'Mi piace aggiunto' : 'Mi piace rimosso',
      liked: userLikedIndex === -1,
      likeCount: post.miPiace.length
    });
  } catch (error) {
    res.status(400).json({ message: 'Errore nell\'aggiornamento del mi piace', error: error.message });
  }
};

// Ottieni statistiche del blog (solo admin)
exports.getBlogStats = async (req, res) => {
  try {
    const totalPosts = await Blog.countDocuments();
    const publishedPosts = await Blog.countDocuments({ stato: 'pubblicato' });
    const draftPosts = await Blog.countDocuments({ stato: 'bozza' });
    const archivedPosts = await Blog.countDocuments({ stato: 'archiviato' });
    
    // Post per categoria
    const postsByCategory = await Blog.aggregate([
      { $match: { stato: 'pubblicato' } },
      { $group: { _id: '$categoria', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Post più visti
    const mostViewedPosts = await Blog.find({ stato: 'pubblicato' })
      .select('titolo slug visualizzazioni dataPubblicazione')
      .sort({ visualizzazioni: -1 })
      .limit(5);
    
    // Post per mese negli ultimi 6 mesi
    const oggi = new Date();
    const seiMesiFa = new Date(oggi.getFullYear(), oggi.getMonth() - 6, 1);
    
    const postsByMonth = await Blog.aggregate([
      {
        $match: {
          dataPubblicazione: { $gte: seiMesiFa },
          stato: 'pubblicato'
        }
      },
      {
        $group: {
          _id: { 
            anno: { $year: "$dataPubblicazione" },
            mese: { $month: "$dataPubblicazione" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.anno": 1, "_id.mese": 1 } }
    ]);
    
    // Post con più commenti
    const mostCommentedPosts = await Blog.find({ stato: 'pubblicato' })
      .select('titolo slug commenti')
      .sort({ 'commenti.length': -1 })
      .limit(5)
      .then(posts => posts.map(post => ({
        _id: post._id,
        titolo: post.titolo,
        slug: post.slug,
        commenti: post.commenti.length
      })));
    
    // Post con più mi piace
    const mostLikedPosts = await Blog.find({ stato: 'pubblicato' })
      .select('titolo slug miPiace')
      .sort({ 'miPiace.length': -1 })
      .limit(5)
      .then(posts => posts.map(post => ({
        _id: post._id,
        titolo: post.titolo,
        slug: post.slug,
        miPiace: post.miPiace.length
      })));
    
    res.status(200).json({
      totalPosts,
      publishedPosts,
      draftPosts,
      archivedPosts,
      postsByCategory: postsByCategory.map(item => ({
        categoria: item._id,
        count: item.count
      })),
      mostViewedPosts,
      mostCommentedPosts,
      mostLikedPosts,
      postsByMonth: postsByMonth.map(item => ({
        anno: item._id.anno,
        mese: item._id.mese,
        posts: item.count
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle statistiche del blog', error: error.message });
  }
};