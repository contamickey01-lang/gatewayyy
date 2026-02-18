const { supabase } = require('../config/database');

class ProductController {
    async create(req, res, next) {
        try {
            const { name, description, price, image_url, type, status } = req.body;

            const { data, error } = await supabase
                .from('products')
                .insert({
                    user_id: req.user.id,
                    name,
                    description,
                    price: Math.round(price * 100), // Convert to cents
                    image_url,
                    type: type || 'digital',
                    status: status || 'active'
                })
                .select()
                .single();

            if (error) throw error;

            res.status(201).json({ product: data, message: 'Produto criado com sucesso!' });
        } catch (error) {
            next(error);
        }
    }

    async list(req, res, next) {
        try {
            const { page = 1, limit = 20, status } = req.query;
            const offset = (page - 1) * limit;

            let query = supabase
                .from('products')
                .select('*', { count: 'exact' })
                .eq('user_id', req.user.id)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (status) {
                query = query.eq('status', status);
            }

            const { data, count, error } = await query;
            if (error) throw error;

            res.json({
                products: data?.map(p => ({ ...p, price_display: (p.price / 100).toFixed(2) })),
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', req.params.id)
                .eq('user_id', req.user.id)
                .single();

            if (error || !data) {
                return res.status(404).json({ error: 'Produto não encontrado.' });
            }

            res.json({ product: { ...data, price_display: (data.price / 100).toFixed(2) } });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const allowedFields = ['name', 'description', 'price', 'image_url', 'type', 'status'];
            const updates = {};

            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updates[field] = field === 'price' ? Math.round(req.body[field] * 100) : req.body[field];
                }
            });
            updates.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', req.params.id)
                .eq('user_id', req.user.id)
                .select()
                .single();

            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Produto não encontrado.' });

            res.json({ product: data, message: 'Produto atualizado com sucesso!' });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', req.params.id)
                .eq('user_id', req.user.id);

            if (error) throw error;

            res.json({ message: 'Produto excluído com sucesso!' });
        } catch (error) {
            next(error);
        }
    }

    // Public endpoint - for checkout
    async getPublic(req, res, next) {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, description, price, image_url, type, user_id')
                .eq('id', req.params.id)
                .eq('status', 'active')
                .single();

            if (error || !data) {
                return res.status(404).json({ error: 'Produto não encontrado.' });
            }

            // Get seller name
            const { data: seller } = await supabase
                .from('users')
                .select('name')
                .eq('id', data.user_id)
                .single();

            res.json({
                product: {
                    ...data,
                    price_display: (data.price / 100).toFixed(2),
                    seller_name: seller?.name
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProductController();
