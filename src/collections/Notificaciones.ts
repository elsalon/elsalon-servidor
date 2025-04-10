import { CollectionConfig } from 'payload/types'
import { isAutor, isAdmin, isAdminOrAutor } from '../helper'
import update from 'payload/dist/collections/operations/update';

const Notificaciones: CollectionConfig = {
    slug: 'notificaciones',
    admin: {
        group: 'Interacciones',
    },
    access:{
        read: isAdminOrAutor,
        create: isAdmin,
        update: isAdminOrAutor,
        delete: isAdminOrAutor,
    },
    hooks: {
    },
    fields: [
        {
            name: 'autor',
            type: 'relationship',
            relationTo: 'users',
        },
        {
            name: 'mensaje',
            type: 'text',
        },
        {
            name: 'identidad',
            type: 'relationship',
            relationTo: ['users', 'grupos', 'salas'],
        },
        {
            name: 'link',
            type: 'relationship',
            relationTo: ['entradas', 'grupos', 'salas', 'users'],
        },
        {
            name: 'categoria',
            type: 'select',
            options: ['aprecio', 'comentario', 'mencion', 'actividad-grupo', 'acciones-grupo', 'enlace', 'evento', 'rol-docente', 'rol-admin']
        },
        {
            name: 'leida',
            type: 'checkbox',
            defaultValue: false,
        },
        {
            name: 'actualizacion',
            type: 'date',
            defaultValue: () => new Date(),
        }
    ],
    endpoints:[
        {
            path: '/todasleidas',
            method: 'patch',
            handler: async (req, res, next) => {
                if(!req.user) return res.status(401).json({ error: 'Unauthorized' });
                try {
                    const userId = req.user?.id; // Obteniendo el ID del usuario actual
                    
                    // Marcar todas las notificaciones como leídas
                    const result = await req.payload.update({
                        collection: 'notificaciones',
                        where: {
                            autor: { equals: userId },
                        },
                        data: {
                            leida: true,
                        },
                    });
                    return res.json({ result });
                } catch (error) {
                    console.error('Error', error);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }
            }
        },
        {
            path: '/nuevas',
            method: 'get',
            handler: async (req, res, next) => {
                if(!req.user) return res.status(401).json({ error: 'Unauthorized' });
                try {
                    const userId = req.user?.id; // Obteniendo el ID del usuario actual
                    const includeDocs = req.query.includeDocs || false;
                    // Buscar todas las notificaciones no leídas
                    const fechaLecturaNotificaciones = req.user.lecturaNotificaciones || 0;
                    let result;
                    const where = {
                        and: [
                            { autor: { equals: userId } },
                            { actualizacion: { greater_than_equal: fechaLecturaNotificaciones } },
                        ]
                    }
                    if(includeDocs){
                        // Buscar todas las notificaciones no leídas
                        result = await req.payload.find({
                            collection: 'notificaciones',
                            where,
                            sort: 'actualizacion',
                            limit: 10,
                        });
                        // Asumo que la ventana está abierta asi que si hay notificaciones, actualizo la fecha de lectura
                        if(result.docs.length > 0){
                            await req.payload.update({
                                collection: 'users',
                                id: userId,
                                data: {
                                    lecturaNotificaciones: new Date(),
                                },
                            });
                        }
                    }else{
                        // Solo cuento las notificaciones no leídas
                        result = await req.payload.count({collection: 'notificaciones', where});
                    }
                    return res.json({ result });
                } catch (error) {
                    console.error('Error', error);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }
            }
        },
        {
            path: '/resetnuevas',
            method: 'patch',
            handler: async (req, res, next) => {
                if(!req.user) return res.status(401).json({ error: 'Unauthorized' });
                try {
                    const userId = req.user?.id; // Obteniendo el ID del usuario actual
                    // Marcar todas las notificaciones como leídas
                    const result = await req.payload.update({
                        collection: 'users',
                        id: userId,
                        data: {
                            lecturaNotificaciones: new Date(),
                        },
                    });
                    return res.status(200).json( result );
                } catch (error) {
                    console.error('Error', error);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }
            }
        }
    ]
}

export default Notificaciones
