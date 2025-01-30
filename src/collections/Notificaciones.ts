import { CollectionConfig } from 'payload/types'
import { isAutor, isAdmin, isAdminOrAutor } from '../helper'

const Notificaciones: CollectionConfig = {
    slug: 'notificaciones',
    admin: {
        group: 'Interacciones',
    },
    access:{
        read: isAutor, // isAutor,
        // create: isAdminOrAutor,
        // update: isAdminOrAutor,
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
            options: ['aprecio', 'comentario', 'mencion', 'colaboracion', 'comentario-grupal', 'entrada-grupal'],
        },
        {
            name: 'cantidad',
            type: 'number',
            defaultValue: 0,
        },
        {
            name: 'usuario',
            type: 'relationship',
            relationTo: 'users',
        },
        {
            name: 'sourceDocument',
            type: 'relationship',
            relationTo: ['entradas', 'comentarios', 'grupos', 'salones', 'users'],
        },
        {
            name: 'leida',
            type: 'checkbox',
            defaultValue: false,
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
        }
    ]
}

export default Notificaciones
