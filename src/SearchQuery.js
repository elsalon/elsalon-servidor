export const searchQuery = async (req, res, next) => {
    const { payload } = req;
    let { query, categorias } = req.query;

    if(!query || query == undefined || !categorias || categorias == undefined){
        res.status(400).json({error: 'Missing required parameters: query, categorias'});
        return;
    }
    categorias = categorias.split(',');
    
    try {
        const results = {};
        console.log("categorias", categorias)

        if (categorias.includes('entradas')) {
            results.entradas = await payload.find({
                collection: 'entradas',
                where: {
                    extracto: {
                        like: query,
                    },
                },
                limit: 8,
            });
        }

        if (categorias.includes('usuarios')) {
            results.usuarios = await payload.find({
                collection: 'users',
                where: {
                    nombre: {
                        like: query,
                    },
                },
                limit: 8,
            });
        }

        if (categorias.includes('grupos')) {
            results.grupos = await payload.find({
                collection: 'grupos',
                where: {
                    nombre: {
                        like: query,
                    },
                },
                limit: 8,
            });
        }

        res.status(200).json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'An error occurred during search' });
    }
};
