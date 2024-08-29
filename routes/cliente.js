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

    try {
        await novoCliente.save();

        // Busque todos os usuários do banco de dados
        const users = await User.find(); 

        // Busque todos os clientes do banco de dados
        const clientes = await Cliente.find(); 

        // Passe `users`, `clientes`, e `current_user` para a renderização da view
        return res.render('index', { 
            success_msg: 'Agendamento Concluído!', 
            current_user: req.user, 
            users: users,
            cliente: clientes // ou `clientes` para manter a consistência
        });
    } catch (err) {
        console.error(err);
        return res.render('add', { 
            error_msg: 'Houve um erro ao agendar', 
            current_user: req.user 
        });
    }
});

router.get('/edit/:id', ensureAuthenticated, async (req, res) => {
    const cliente = await Cliente.findById(req.params.id);
    res.render('edit', { cliente, current_user: req.user });
});

router.post('/edit/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { nome_cliente, tipo, data, horas, preco } = req.body;

        // Atualize o cliente pelo ID
        await Cliente.findByIdAndUpdate(req.params.id, {
            nome_cliente,
            tipo,
            data: new Date(data),
            horas,
            preco,
        }, { new: true });

        // Busque todos os usuários do banco de dados
        const users = await User.find();

        // Busque todos os clientes do banco de dados
        const clientes = await Cliente.find();

        // Passe as variáveis para a renderização da view `index.ejs`
        req.flash('success_msg', 'Cliente atualizado com sucesso!');
        return res.render('index', {
            success_msg: 'Agendamento atualizado com sucesso!',
            current_user: req.user,
            users: users,
            cliente: clientes // ou `clientes` para manter a consistência
        });
    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);

        // Em caso de erro, renderize a página `index.ejs` com uma mensagem de erro
        req.flash('error_msg', 'Erro ao atualizar o agendamento.');
        return res.render('index', {
            error_msg: 'Erro ao atualizar o agendamento.',
            current_user: req.user,
            users: await User.find(),
            cliente: await Cliente.find() // ou `clientes` para manter a consistência
        });
    }
});

router.get('/delete/:id', ensureAuthenticated, async (req, res) => {
    try {
        // Exclui o cliente pelo ID
        await Cliente.findByIdAndDelete(req.params.id);

        // Define a mensagem de sucesso
        req.flash('success_msg', 'Corte Finalizado');

        // Busque todos os usuários do banco de dados
        const users = await User.find();

        // Busque todos os clientes restantes do banco de dados
        const clientes = await Cliente.find();

        // Renderiza a view `index.ejs` com as variáveis necessárias
        return res.render('index', {
            success_msg: 'Corte Finalizado!',
            current_user: req.user,
            users: users,
            cliente: clientes // ou `clientes` para manter a consistência
        });
    } catch (error) {
        console.error('Erro ao excluir agendamento:', error);

        // Em caso de erro, renderiza a view `index.ejs` com uma mensagem de erro
        req.flash('error_msg', 'Erro ao excluir o agendamento.');
        return res.render('index', {
            error_msg: 'Erro ao excluir o agendamento.',
            current_user: req.user,
            users: await User.find(),
            cliente: await Cliente.find() // ou `clientes` para manter a consistência
        });
    }
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
