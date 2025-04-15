export const unirme = async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { comisionid } = req.params;
        const userId = req.user?.id; // Obteniendo el ID del usuario actual
        const comision = await req.payload.findByID({
            collection: 'comisiones',
            id: comisionid,
            depth: 0,
            overrideAccess: false,
            user: req.user,
        });

        // TODO CHEQUEAR SI EL USUARIO YA ESTA EN OTRA COMISION DE ESTE CONTEXTO
        const yaEstaEnOtraComision = await req.payload.find({
            collection: 'comisiones',
            overrideAccess: false,
            user: req.user,
            where: {
                and: [
                    {
                        contexto: { equals: comision.contexto }
                    },
                    {
                        integrantes: { in: [userId] }
                    },
                ]
            },
        });

        if (yaEstaEnOtraComision.totalDocs > 0) {
            return res.status(208).json({ error: `Para unirte tenés que dejar la comisión ${yaEstaEnOtraComision.docs[0].nombre}` });
        }

        const esAlumno = req.user.rol === 'alumno';
        if (esAlumno) {
            // Si es alumno, se le agrega a los integrantes
            if (!comision.integrantes) { comision.integrantes = [] }
            comision.integrantes.push(userId);
        } else {
            // Si es docente, se le agrega a los docentes
            if (!comision.docentes) { comision.docentes = [] }
            comision.docentes.push(userId);
        }

        const update = await req.payload.update({
            collection: 'comisiones',
            id: comisionid,
            data: comision,
        });
        return res.status(200).json(update);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error interno' });
    }
};

export const abandonar = async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { comisionid } = req.params;
        const userId = req.user?.id; // Obteniendo el ID del usuario actual
        const comision = await req.payload.findByID({
            collection: 'comisiones',
            id: comisionid,
            depth: 0,
            overrideAccess: false,
            user: req.user,
        });

        // Se quiere ir individualmente
        const esAlumno = req.user.rol === 'alumno';
        if (esAlumno) {
            // Si es alumno, se lo saca de integrantes
            comision.integrantes = comision.integrantes.filter(i => i !== userId);
        } else {
            // Si es docente, se lo saca de docentes
            comision.docentes = comision.docentes.filter(d => d !== userId);
        }

        const update = await req.payload.update({
            collection: 'comisiones',
            id: comisionid,
            data: comision,
        });
        return res.status(200).json(update);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error interno' });
    }
};

export const feed = async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const { comisionid } = req.params;
        const comision = await req.payload.findByID({
            collection: 'comisiones',
            id: comisionid,
            depth: 0,
            overrideAccess: false,
            user: req.user,
        });
        if (!comision) return res.status(404).json({ error: 'Comisión no encontrada' });

        const integrantes = comision.integrantes || [];
        const docentes = comision.docentes || [];

        // Parse possible time filters
        const createdGreaterThan = req.query.createdGreaterThan || null;
        const createdLessThan = req.query.createdLessThan || null;

        // Base filters
        const andFilters = [
            {
                or: [
                    { sala: { equals: comision.contexto } },
                    { sala: { exists: false } },
                ],
            },
            {
                or: [
                    { autor: { in: [...integrantes, ...docentes] } },
                    { 'grupo.integrantes': { in: integrantes } },
                ],
            },
        ];

        // Validate and add date filters
        if (createdGreaterThan) {
            const dateValue = new Date(createdGreaterThan);
            if (isNaN(dateValue.getTime())) {
                return res.status(400).json({ error: 'Invalid date format for createdGreaterThan' });
            }
            andFilters.push({ lastActivity: { greater_than: dateValue } });
        }
        if (createdLessThan) {
            const dateValue = new Date(createdLessThan);
            if (isNaN(dateValue.getTime())) {
                return res.status(400).json({ error: 'Invalid date format for createdLessThan' });
            }
            andFilters.push({ lastActivity: { less_than: dateValue } });
        }

        // Final where object
        const where = { and: andFilters };

        // Pagination parameters
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 12;

        const feed = await req.payload.find({
            collection: 'entradas',
            where,
            sort: '-lastActivity',
            limit,
            page,
            overrideAccess: false,
            user: req.user,
        });

        return res.status(200).json(feed);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error interno' });
    }
};