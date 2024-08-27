const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/User');
const flash = require('connect-flash');
const path = require('path');

require('dotenv').config();  // Carrega as variáveis de ambiente do .env

const app = express();

// Configurações
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));

// Conectando ao MongoDB
mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.u6bk12m.mongodb.net/site`)
    .then(() => console.log('Conectado ao MongoDB'))
    .catch(err => console.error('Erro ao conectar ao MongoDB', err));

// Configuração de Sessão com MongoDB Store
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.u6bk12m.mongodb.net/site` }),
}));

// Configuração do flash    
app.use(flash());

// Passport.js Configuração
app.use(passport.initialize());
app.use(passport.session());

// Middleware para mensagens de sucesso e erro
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// Rotas
const authRoutes = require('./routes/auth').router;
const indexRoutes = require('./routes/index');
const clienteRoutes = require('./routes/cliente');

app.use('/', authRoutes);
app.use('/', indexRoutes);
app.use('/', clienteRoutes);

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
