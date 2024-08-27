const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
    nome_cliente: { type: String, required: true },
    tipo: { type: String, required: true },
    data: { type: Date, required: true },
    horas: { type: String, required: true },
    preco: { type: String, required: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Nova coluna para o usuário
});

module.exports = mongoose.model('Cliente', ClienteSchema);
