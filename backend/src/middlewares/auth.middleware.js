const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Token inválido.' });
        }

        if (user.status === 'blocked') {
            return res.status(403).json({ error: 'Conta bloqueada. Entre em contato com o suporte.' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }
    next();
};

const sellerOnly = (req, res, next) => {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso restrito a vendedores.' });
    }
    next();
};

module.exports = { auth, adminOnly, sellerOnly };
