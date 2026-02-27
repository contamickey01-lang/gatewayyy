const { supabase } = require('../config/database');

class StoreController {
    async getStoreBySlug(req, res, next) {
        try {
            const { slug } = req.params;

            // Find user by store_slug where store_active is true
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id, store_name, store_description, avatar_url')
                .eq('store_slug', slug)
                .eq('store_active', true)
                .single();

            if (userError || !user) {
                return res.status(404).json({ error: 'Loja não encontrada ou inativa.' });
            }

            // Fetch active products for this user
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id, name, description, price, image_url, type')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (productsError) {
                throw productsError;
            }

            // Format product prices
            const formattedProducts = products?.map(p => ({
                ...p,
                price_display: (p.price / 100).toFixed(2)
            })) || [];

            res.json({
                store: {
                    name: user.store_name,
                    description: user.store_description,
                    avatar_url: user.avatar_url
                },
                products: formattedProducts
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new StoreController();
