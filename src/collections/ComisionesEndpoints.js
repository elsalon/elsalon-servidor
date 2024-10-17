export const unirme = async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { comisionid } = req.params;
        const userId = req.user?.id; // Obteniendo el ID del usuario actual
        const comision = await req.payload.findByID({
            collection: 'comisiones',
            id: comisionid,
            depth: 0,
        });

        // TODO CHEQUEAR SI EL USUARIO YA ESTA EN OTRA COMISION DE ESTE CONTEXTO
        const yaEstaEnOtraComision = await req.payload.find({
            collection: 'comisiones',
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

        if(yaEstaEnOtraComision.totalDocs > 0){
            return res.status(208).json({error: `Para unirte tenés que dejar la comisión ${yaEstaEnOtraComision.docs[0].nombre}`});
        }
        
        const esAlumno = req.user.rol === 'alumno';
        if (esAlumno) {
            // Si es alumno, se le agrega a los integrantes
            if(!comision.integrantes){ comision.integrantes = [] }
            comision.integrantes.push(userId);
        } else {
            // Si es docente, se le agrega a los docentes
            if(!comision.docentes){ comision.docentes = [] }
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
    try{
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const {startDate, endDate, page, createdGreaterThan} = req.query;
        
        const comision = await req.payload.findByID({
            collection: 'comisiones',
            id: req.params.comisionid,
            depth: 0,
        });

        if (!comision) return res.status(404).json({ error: 'Comisión no encontrada' });


        /*
        Cosas que vamos a buscar en este feed:

        SALA
        * Entradas al espacio donde está esta comision (comision.contexto)
        ó 
        * Entradas sin espacio, que son las bitácoras
        
        FECHA
        * Que estén en el rango de fechas (startDate, endDate) que son del actual periodo (cuatri o anual)
        
        AUTOR
        * De usuarios que estén en la comisión (comision.integrantes & docentes)
        ó
        * De grupos cuyos integrantes estén en la comision 
        
        */
        const docentesYAlumnos = [...comision?.integrantes, ...comision?.docentes]

        let query = {
            and:[
                {
                    createdAt: { greater_than_equal: startDate },
                },
                {
                    createdAt: { less_than_equal: endDate },
                },
                {
                    or: [
                        {
                            sala: { equals: comision.contexto } // o fue publicado en la sala de la comisión
                        },
                        {
                            sala: { exists: false } // O fue publicado en la bitacora
                        },
                    ]
                },
                {
                    or: [
                        {
                            autor: { in: docentesYAlumnos } // escrito por alguien de la comisión
                        },
                        {
                            'grupo.integrantes': { in: comision?.integrantes } // o publicado por un grupo de alguien que esta en la comision
                        },
                    ]
                }
            ]
        }

        if(createdGreaterThan){
            // Agrego la fecha de creación como criterio de busqueda
            query = {
                and: [
                    query,
                    {
                        createdAt: { greater_than: new Date(createdGreaterThan) }
                    }
                ]
            }
        }

        const feed = await req.payload.find({
            collection: 'entradas',
            where: query,
            sort: "-createdAt",  // Ordenar por fecha de creación, de más reciente a más antigua
            limit: 5,
            page: parseInt(page) || 1,
        });

        return res.status(200).json(feed);
    }catch(err){
        console.error(err);
        return res.status(500).json({ error: 'Error interno' });
    }
}