const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const LocalStrategy = require('passport-local').Strategy;

// Função de middleware para garantir que o usuário esteja autenticado
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.render('login', { error_msg: 'Você precisa estar logado para acessar esta página.'});
}

// Configuração do Passport
passport.use(new LocalStrategy(
    { usernameField: 'username' },
    async (username, password, done) => {
        try {
            const user = await User.findOne({ username });
            if (!user) {
                return done(null, false, { message: 'Usuário não encontrado' });
            }
            const isMatch = await user.comparePassword(password);
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Senha incorreta' });
            }
        } catch (err) {
            return done(err);
        }
    }
));

// Serialização e desserialização do usuário
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Rota para o login (GET)
router.get('/login', (req, res) => {
    res.render('login', { error_msg: req.flash('error_msg') });
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render('login', { error_msg: 'Usuário ou senha incorretos' });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/index');
        });
    })(req, res, next);    
});

// Logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash('success_msg', 'Você foi desconectado.');
        res.redirect('/login');
    });
});

// Página de registro
router.get('/register', ensureAuthenticated, async (req, res) => {
    const users = await User.find();
    res.render('register', {
        current_user: req.user || null,
        users,
        error_msg: req.flash('error_msg'),
        success_msg: req.flash('success_msg')
    });
});

router.post('/deleteUser/:id', ensureAuthenticated, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Usuário deletado com sucesso.');

        // Busque todos os usuários novamente após a exclusão
        const users = await User.find();

        // Renderiza a página de registro com as mensagens de sucesso e os usuários atualizados
        return res.render('register', {
            current_user: req.user || null,
            users,
            error_msg: req.flash('error_msg'),
            success_msg: req.flash('success_msg')
        });
    } catch (err) {
        req.flash('error_msg', 'Erro ao deletar usuário.');

        // Em caso de erro, renderiza a página de registro com a mensagem de erro
        return res.render('register', {
            current_user: req.user || null,
            users: await User.find(),
            error_msg: req.flash('error_msg'),
            success_msg: req.flash('success_msg')
        });
    }
});

// Processa o registro de usuário
router.post('/register', ensureAuthenticated, async (req, res) => {
    const { username, password, confirm_password } = req.body;

    if (password !== confirm_password) {
        req.flash('error_msg', 'As senhas não conferem.');

        // Busque todos os usuários novamente após a falha no registro
        const users = await User.find();

        // Renderiza a página de registro com a mensagem de erro e os usuários atuais
        return res.render('register', {
            current_user: req.user || null,
            users,
            error_msg: req.flash('error_msg'),
            success_msg: req.flash('success_msg')
        });
    }

    try {
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            req.flash('error_msg', 'Nome de usuário já está em uso.');

            // Busque todos os usuários novamente após a falha no registro
            const users = await User.find();

            // Renderiza a página de registro com a mensagem de erro e os usuários atuais
            return res.render('register', {
                current_user: req.user || null,
                users,
                error_msg: req.flash('error_msg'),
                success_msg: req.flash('success_msg')
            });
        }

        const newUser = new User({
            username,
            password
        });

        await newUser.save();

        req.flash('success_msg', 'Você está registrado e pode fazer login.');

        // Busque todos os usuários novamente após o registro bem-sucedido
        const users = await User.find();

        // Renderiza a página de registro com a mensagem de sucesso e os usuários atualizados
        return res.render('register', {
            current_user: req.user || null,
            users,
            error_msg: req.flash('error_msg'),
            success_msg: req.flash('success_msg')
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Erro ao registrar usuário.');

        // Busque todos os usuários novamente após a falha no registro
        const users = await User.find();

        // Renderiza a página de registro com a mensagem de erro e os usuários atuais
        return res.render('register', {
            current_user: req.user || null,
            users,
            error_msg: req.flash('error_msg'),
            success_msg: req.flash('success_msg')
        });
    }
});

module.exports = {
    ensureAuthenticated,
    router
};
