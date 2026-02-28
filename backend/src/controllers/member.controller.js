const { supabase } = require('../config/database');
const pagarmeService = require('../services/pagarme.service');

class MemberController {
    // List all products purchased by the logged-in user
    async listMyProducts(req, res, next) {
        try {
            const userId = req.user.id;
            const userEmail = req.user.email?.toLowerCase().trim();

            // --- ULTIMATE SYNC LAYER ---
            if (userEmail) {
                try {
                    // 1. Get all orders for this email (paid or pending)
                    const { data: allOrders, error: ordersErr } = await supabase
                        .from('orders')
                        .select('id, product_id, buyer_email, status, pagarme_charge_id')
                        .ilike('buyer_email', userEmail);

                    if (!ordersErr && allOrders) {
                        const paidOrders = allOrders.filter(o => o.status === 'paid');
                        const pendingOrders = allOrders.filter(o => o.status === 'pending' && o.pagarme_charge_id);

                        // 2. TIER 2 FALLBACK: Check Pagar.me for pending orders
                        for (const order of pendingOrders) {
                            try {
                                console.log(`[MEMBER-DEBUG] Verifying pending order ${order.id} via Pagar.me API...`);
                                const charge = await pagarmeService.getCharge(order.pagarme_charge_id);

                                if (charge && charge.status === 'paid') {
                                    console.log(`[MEMBER-DEBUG] Order ${order.id} found PAID on Pagar.me! Updating DB...`);
                                    await supabase.from('orders').update({ status: 'paid' }).eq('id', order.id);
                                    paidOrders.push({ ...order, status: 'paid' });
                                }
                            } catch (chkErr) {
                                console.error(`[MEMBER-DEBUG] Failed to verify charge ${order.pagarme_charge_id}:`, chkErr.message);
                            }
                        }

                        // 3. ENROLLMENT SYNC: Link all paid orders found
                        if (paidOrders.length > 0) {
                            const { data: existingEnrollments } = await supabase
                                .from('enrollments')
                                .select('order_id')
                                .eq('user_id', userId);

                            const enrolledOrderIds = new Set(existingEnrollments?.map(e => e.order_id) || []);
                            const missingOrders = paidOrders.filter(o => !enrolledOrderIds.has(o.id));

                            if (missingOrders.length > 0) {
                                console.log(`[MEMBER-DEBUG] Enrolling ${missingOrders.length} products found via sync...`);
                                const newEnrollments = missingOrders.map(o => ({
                                    user_id: userId,
                                    product_id: o.product_id,
                                    order_id: o.id,
                                    status: 'active'
                                }));
                                await supabase.from('enrollments').upsert(newEnrollments);
                            }
                        }
                    }
                } catch (syncErr) {
                    console.error('[MEMBER-DEBUG] Ultimate Sync exception:', syncErr.message);
                }
            }
            // ----------------------------

            // Join enrollments with products
            const { data, error } = await supabase
                .from('enrollments')
                .select(`
                    id,
                    status,
                    created_at,
                    products (
                        id,
                        name,
                        description,
                        image_url
                    )
                `)
                .eq('user_id', userId)
                .eq('status', 'active');

            if (error) throw error;

            res.json({ products: data.map(e => ({ ...e.products, enrollment_id: e.id })) });
        } catch (error) {
            next(error);
        }
    }

    // Get course content (modules & lessons) for a specific product
    // ONLY if the user is enrolled
    async getCourseContent(req, res, next) {
        try {
            const { productId } = req.params;

            // 1. Check enrollment
            const { data: enrollment, error: enrollError } = await supabase
                .from('enrollments')
                .select('id')
                .eq('user_id', req.user.id)
                .eq('product_id', productId)
                .eq('status', 'active')
                .single();

            if (enrollError || !enrollment) {
                return res.status(403).json({ error: 'Você não tem acesso a este conteúdo.' });
            }

            // 2. Fetch modules with lessons
            const { data: modules, error: modulesError } = await supabase
                .from('product_modules')
                .select(`
                    id,
                    title,
                    order,
                    product_lessons (
                        id,
                        title,
                        description,
                        order
                    )
                `)
                .eq('product_id', productId)
                .order('order', { ascending: true });

            if (modulesError) throw modulesError;

            // Sort lessons within modules manually since Supabase ordering in nested select is tricky
            const sortedModules = modules.map(m => ({
                ...m,
                lessons: (m.product_lessons || []).sort((a, b) => a.order - b.order)
            }));

            res.json({ modules: sortedModules });
        } catch (error) {
            next(error);
        }
    }

    // Get specific lesson details
    async getLesson(req, res, next) {
        try {
            const { lessonId } = req.params;

            // 1. Fetch lesson and its module/product
            const { data: lesson, error: lessonError } = await supabase
                .from('product_lessons')
                .select(`
                    *,
                    product_modules (
                        product_id
                    )
                `)
                .eq('id', lessonId)
                .single();

            if (lessonError || !lesson) {
                return res.status(404).json({ error: 'Aula não encontrada.' });
            }

            // 2. Check enrollment for the product
            const { data: enrollment, error: enrollError } = await supabase
                .from('enrollments')
                .select('id')
                .eq('user_id', req.user.id)
                .eq('product_id', lesson.product_modules.product_id)
                .eq('status', 'active')
                .single();

            if (enrollError || !enrollment) {
                return res.status(403).json({ error: 'Acesso negado.' });
            }

            // 3. Fetch files for the lesson
            const { data: files } = await supabase
                .from('product_files')
                .select('*')
                .eq('lesson_id', lessonId);

            res.json({
                lesson: {
                    ...lesson,
                    files: files || []
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new MemberController();
