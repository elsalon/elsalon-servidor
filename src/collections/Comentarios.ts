import { CollectionConfig } from 'payload/types'
import { isAdminAutorOrIntegrante, CrearExtracto, PublicadasYNoBorradas, SoftDelete, PopulateAprecios, LimpiarContenido, ActualizarActividadEntrada} from '../helper'
import { NotificarNuevoComentario, NotificarGrupoNuevoComentario, NotificarMencionComentario } from '../hooks/Notificaciones/NotificationsHooks'
import { NotificarMailComentario } from '../GeneradorNotificacionesMail'
import { Campos } from './CamposEntradasYComentarios'

const Comentarios: CollectionConfig = {
    slug: 'comentarios',
    versions: {
        drafts: false,
    },
    access: {
        read: PublicadasYNoBorradas,
        update: isAdminAutorOrIntegrante,
        delete: isAdminAutorOrIntegrante,
    },
    hooks: {
        beforeChange: [
            LimpiarContenido,
            CrearExtracto,
            async ({data, req }) => {
                if (req.user) {
                    // console.log('New entry created', data);
                    data.autor = req.user.id; // El autor es el usuario actual
                    return data;
                }
            }
        ],
        afterChange: [
            async (c) => {
                const entrada = await c.req.payload.findByID({ collection: 'entradas', id: c.doc.entrada });
                NotificarNuevoComentario(c, entrada);
                NotificarGrupoNuevoComentario(c, entrada),
                NotificarMencionComentario(c, entrada)
                NotificarMailComentario(c, entrada);
                ActualizarActividadEntrada(c, entrada);
            },
        ],
        afterRead: [
            PopulateAprecios,
        ],
    },
    admin: {
        group: 'Interacciones',
    },
    fields: [
        {
            name: 'entrada',
            type: 'relationship',
            relationTo: 'entradas',
            maxDepth: 0,
        },
        ...Campos,

    ],

    endpoints: [
        {
            path: '/:id',
            method: 'delete',
            handler: SoftDelete('comentarios'),
        }
    ]
}

export default Comentarios;