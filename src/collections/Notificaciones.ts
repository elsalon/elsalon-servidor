import { CollectionConfig } from 'payload/types'
import { isAutor, isAdmin, isAdminOrAutor } from '../helper'

const Notificaciones: CollectionConfig = {
    slug: 'notificaciones',
    admin: {
        group: 'Interacciones',
    },
    access:{
        read: isAutor,
        create: isAdmin,
        update: isAdmin,
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
            name: 'tipoNotificacion',
            type: 'select',
            options: ['apreciacion', 'comentario', 'mencion', 'respuesta', 'colaboracion'],
        },
        {
            name: 'mensaje',
            type: 'text',
        },
        {
            name: 'linkType',
            type: 'select',
            options: ['entrada', 'grupo', 'salon', 'usuario'],
        },
        {
            name: 'linkTo',
            type: 'text',
        },
        {
            name: 'leida',
            type: 'checkbox',
        }
    ],
    endpoints:[
        {
            path: '/todasleidas',
            method: 'patch',
            handler: async (req, res, next) => {
                console.log('POST /notificaciones/todasleidas');
                if(!req.user) return res.status(401).json({ error: 'Unauthorized' });
                try {
                    const userId = req.user?.id; // Obteniendo el ID del usuario actual
                    console.log('userId', userId);
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
                    console.log('result', result);
                    return res.json({ result });
                } catch (error) {
                    console.error('Error', error);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }
            }
        }
    ]
}

export default Notificaciones
