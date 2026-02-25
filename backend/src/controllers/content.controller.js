const { supabase } = require('../config/database');

class ContentController {
    // Modules
    async listModules(req, res, next) {
        try {
            const { productId } = req.params;
            const { data, error } = await supabase
                .from('product_modules')
                .select('*')
                .eq('product_id', productId)
                .order('order', { ascending: true });

            if (error) throw error;
            res.json({ modules: data });
        } catch (error) {
            next(error);
        }
    }

    async createModule(req, res, next) {
        try {
            const { productId } = req.params;
            const { title, order } = req.body;

            const { data, error } = await supabase
                .from('product_modules')
                .insert({ product_id: productId, title, order: order || 0 })
                .select()
                .single();

            if (error) throw error;
            res.status(201).json({ module: data, message: 'Módulo criado com sucesso!' });
        } catch (error) {
            next(error);
        }
    }

    async updateModule(req, res, next) {
        try {
            const { moduleId } = req.params;
            const { title, order } = req.body;

            const { data, error } = await supabase
                .from('product_modules')
                .update({ title, order, updated_at: new Date().toISOString() })
                .eq('id', moduleId)
                .select()
                .single();

            if (error) throw error;
            res.json({ module: data, message: 'Módulo atualizado!' });
        } catch (error) {
            next(error);
        }
    }

    async deleteModule(req, res, next) {
        try {
            const { moduleId } = req.params;
            const { error } = await supabase
                .from('product_modules')
                .delete()
                .eq('id', moduleId);

            if (error) throw error;
            res.json({ message: 'Módulo excluído!' });
        } catch (error) {
            next(error);
        }
    }

    // Lessons
    async listLessons(req, res, next) {
        try {
            const { moduleId } = req.params;
            const { data, error } = await supabase
                .from('product_lessons')
                .select('*')
                .eq('module_id', moduleId)
                .order('order', { ascending: true });

            if (error) throw error;
            res.json({ lessons: data });
        } catch (error) {
            next(error);
        }
    }

    async createLesson(req, res, next) {
        try {
            const { moduleId } = req.params;
            const { title, description, video_url, video_source, order, content } = req.body;

            const { data, error } = await supabase
                .from('product_lessons')
                .insert({
                    module_id: moduleId,
                    title,
                    description,
                    video_url,
                    video_source: video_source || 'youtube',
                    order: order || 0,
                    content
                })
                .select()
                .single();

            if (error) throw error;
            res.status(201).json({ lesson: data, message: 'Aula criada com sucesso!' });
        } catch (error) {
            next(error);
        }
    }

    async updateLesson(req, res, next) {
        try {
            const { lessonId } = req.params;
            const updates = { ...req.body, updated_at: new Date().toISOString() };

            const { data, error } = await supabase
                .from('product_lessons')
                .update(updates)
                .eq('id', lessonId)
                .select()
                .single();

            if (error) throw error;
            res.json({ lesson: data, message: 'Aula atualizada!' });
        } catch (error) {
            next(error);
        }
    }

    async deleteLesson(req, res, next) {
        try {
            const { lessonId } = req.params;
            const { error } = await supabase
                .from('product_lessons')
                .delete()
                .eq('id', lessonId);

            if (error) throw error;
            res.json({ message: 'Aula excluída!' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ContentController();
