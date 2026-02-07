// Implementar con este plugin: https://payloadcms.com/docs/plugins/search
export const searchQuery = async (req, res, next) => {
    const { payload } = req;
    let { query, categorias, page = 1, limit = 12 } = req.query;

    if (!query || !categorias) {
        res.status(400).json({ error: 'Missing required parameters: query, categorias' });
        return;
    }
    categorias = categorias.split(',');

    try {
        const results = {};
        let hasMore = false;

        if (categorias.includes('entradas')) {
            const entradasResult = await payload.find({
                collection: 'entradas',
                where: {
                    extracto: {
                        like: query,
                    },
                },
                page: parseInt(page),
                limit: parseInt(limit),
            });
            results.entradas = entradasResult.docs;
            if (entradasResult.totalDocs > page * limit) hasMore = true;
        }

        if (categorias.includes('comentarios')) {
            const comentariosResult = await payload.find({
                collection: 'comentarios',
                where: {
                    extracto: {
                        like: query,
                    },
                },
                page: parseInt(page),
                limit: parseInt(limit),
            });
            results.comentarios = comentariosResult.docs;
            if (comentariosResult.totalDocs > page * limit) hasMore = true;
        }

        const nombre = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        if (categorias.includes('usuarios')) {
            const usuariosResult = await payload.find({
                collection: 'users',
                where: {
                    slug: {
                        like: nombre,
                    },
                },
                page: parseInt(page),
                limit: parseInt(limit),
            });
            results.usuarios = usuariosResult.docs;
            if (usuariosResult.totalDocs > page * limit) hasMore = true;
        }

        if (categorias.includes('grupos')) {
            const gruposResult = await payload.find({
                collection: 'grupos',
                where: {
                    nombre: {
                        like: query,
                    },
                },
                page: parseInt(page),
                limit: parseInt(limit),
            });
            results.grupos = gruposResult.docs;
            if (gruposResult.totalDocs > page * limit) hasMore = true;
        }

        res.status(200).json({ results, hasMore });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'An error occurred during search' });
    }
};
