const express = require('express');
const Cliente = require('../models/Cliente');
const User = require('../models/User'); // Adicione esta linha
const { ensureAuthenticated } = require('../routes/auth');

const router = express.Router();

router.get('/add', ensureAuthenticated, (req, res) => {
    res.render('add', { current_user: req.user });
});

router.post('/add', ensureAuthenticated, async (req, res) => {
    const { nome_cliente, tipo, data, horas, preco } = req.body;
    const novoCliente = new Cliente({
        nome_cliente,
        tipo,
        data: new Date(data),
        horas,
        preco: `R$${preco}`,
        usuario: req.user._id
    });
    await novoCliente.save();
    req.flash('success_msg', 'Agendamento Concluído!');
    res.redirect('/index');
});


router.get('/edit/:id', ensureAuthenticated, async (req, res) => {
    const cliente = await Cliente.findById(req.params.id);
    res.render('edit', { cliente, current_user: req.user });
});

router.post('/edit/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { nome_cliente, tipo, data, horas, preco } = req.body;
        await Cliente.findByIdAndUpdate(req.params.id, {
            nome_cliente,
            tipo,
            data: new Date(data),
            horas,
            preco,
        }, { new: true });

        req.flash('success_msg', 'Cliente atualizado com sucesso!');
        res.redirect('/index');
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        req.flash('error_msg', 'Erro ao atualizar o cliente.');
        res.redirect('/index');
    }
});


router.get('/delete/:id', ensureAuthenticated, async (req, res) => {
    try {
        await Cliente.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Corte Finalizado!');
    } catch (error) {
        req.flash('error_msg', 'Erro ao excluir o cliente.');
    }
    res.redirect('/index');
});

router.get('/view/:id', ensureAuthenticated, async (req, res) => {
    try {
        // Popula o campo 'usuario' com o documento do usuário relacionado
        const cliente = await Cliente.findById(req.params.id).populate('usuario');

        res.render('view', { cliente, current_user: req.user });
    } catch (error) {
        console.error('Erro ao carregar o comprovante:', error);
        res.status(500).send('Erro ao carregar o comprovante.');
    }
});

router.get('/search', ensureAuthenticated, async (req, res) => {
    try {
        const searchQuery = req.query.search_query || '';

        // Filtrar clientes
        const filteredClientes = await Cliente.find({
            nome_cliente: { $regex: searchQuery, $options: 'i' }
        }).populate('usuario');

        // Buscar todos os usuários
        const users = await User.find();

        res.render('index', { 
            cliente: filteredClientes, 
            current_user: req.user, 
            users, // Passando a lista de usuários para a view
            success_msg: req.flash('success_msg') || '', // Adicionando as mensagens
            error_msg: req.flash('error_msg') || ''
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao buscar clientes.');
    }
});

router.get('/register', ensureAuthenticated, (req, res) => {
    res.render('register', { current_user: req.user });
});

router.get('/searchByUser', ensureAuthenticated, async (req, res) => {
    const username = req.query.username || ''; // Agora busca pelo nome do usuário
    const searchQuery = req.query.search_query || '';
    
    const filter = {
        nome_cliente: { $regex: searchQuery, $options: 'i' },
    };
    
    if (username) {
        const user = await User.findOne({ username });
        if (user) {
            filter.usuario = user._id; // Filtra usando o _id do usuário encontrado pelo nome
        }
    }
    
    const filteredClientes = await Cliente.find(filter).populate('usuario');
    const users = await User.find(); // Obtém todos os usuários para o filtro

    res.render('index', { cliente: filteredClientes, current_user: req.user, users });
});

module.exports = router;
