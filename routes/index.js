const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('./auth'); // Ajuste o caminho conforme necessário
const Cliente = require('../models/Cliente'); // Ajuste o caminho conforme necessário
const User = require('../models/User'); // Adicione esta linha se não estiver presente

// Redireciona a raiz para a página de login
router.get('/', (req, res) => {
    res.redirect('/login');
});

router.get('/index', ensureAuthenticated, async (req, res) => {
    try {
        // Popula o campo 'usuario' com o documento do usuário relacionado
        const clientes = await Cliente.find().populate('usuario').sort({ data: 1 });
        const users = await User.find(); // Obtém todos os usuários

        res.render('index', { 
            current_user: req.user,
            cliente: clientes,
            users: users, // Passando os usuários para a view
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar clientes.');
    }
});


module.exports = router;
