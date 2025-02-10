import { SlugField } from '../SlugField'
import { CollectionConfig } from 'payload/types'
import { isAdminOrIntegrante, SacarEmojis } from '../helper'
import { NotificarNuevoGrupo } from '../hooks/Notificaciones/NotificationsHooks'

const Grupos: CollectionConfig = {
    slug: 'grupos',
    admin: {
        useAsTitle: 'nombre',
    },
    access: {
        update: isAdminOrIntegrante,
        delete: isAdminOrIntegrante,
    },
    hooks: {
        beforeChange: [
            async ({ data }) => {
                // Saco los emojis del nombre     
                if (data.nombre) {
                    data.nombre = SacarEmojis(data.nombre);
                }
                return data;
            },
            async ({ operation, data, req }) => {
                // Revisar que no haya integrantes duplicados
                if (data.integrantes) {
                    data.integrantes = Array.from(new Set(data.integrantes));
                }
            },
        ],
        afterChange:[ NotificarNuevoGrupo ],
    },
    fields: [
        {
            name: 'nombre',
            type: 'text',
            index: true,
        },
        {
            name: 'avatar',
            type: 'upload',
            relationTo: 'avatares',
        },
        {
            name: 'integrantes',
            type: 'relationship',
            relationTo: 'users',
            hasMany: true,
        },
        {
            name: 'contexto',
            type: 'relationship',
            relationTo: 'salones',
        },
        {
            name: 'desc',
            type: 'textarea',
        },
        {
            name: 'link',
            type: 'text',
        },
        SlugField(),
    ],
    endpoints: [
        {
            path: '/me',
            method: 'get',
            handler: async (req, res, next) => {
                // console.log('GET /aprecio/:contenidoid');
                if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
                const { user } = req;
                const { id } = user;
                const grupos = await req.payload.find({
                    collection: 'grupos',
                    where: {
                        integrantes: {
                            contains: id,
                        },
                    },
                });
                res.json(grupos);
            },
        },
    ]
}

export default Grupos;