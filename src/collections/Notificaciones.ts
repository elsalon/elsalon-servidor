import { CollectionConfig } from 'payload'
import { isAutor, isAdmin, isAdminOrAutor } from '../helper'

const Notificaciones: CollectionConfig = {
    slug: 'notificaciones',
    admin: {
        group: 'Interacciones',
    },
    access:{
        read: isAutor, // isAutor,
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
            name: 'tipoNotificacion',
            type: 'select',
            options: ['aprecio', 'comentario', 'mencion', 'colaboracion'],
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
            handler: async (req) => {
                if(!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
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
                    return Response.json({ result });
                } catch (error) {
                    console.error('Error', error);
                    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
                }
            }
        }
    ]
}

export default Notificaciones
