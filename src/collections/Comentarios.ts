import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor, CrearExtracto, PublicadasYNoBorradas, SoftDelete, PopulateAprecios} from '../helper'
import { NotificarNuevoComentario, NotificarMencionComentario } from '../GeneradorNotificacionesWeb'
import { NotificarMailComentario } from '../GeneradorNotificacionesMail'
import { Campos } from './CamposEntradasYComentarios'

const Comentarios: CollectionConfig = {
    slug: 'comentarios',
    versions: {
        drafts: false,
    },
    access: {
        read: PublicadasYNoBorradas,
        update: isAdminOrAutor,
        delete: isAdminOrAutor,
    },
    hooks: {
        beforeChange: [
            CrearExtracto,
            async ({ operation, data, req }) => {
                if (operation === 'create' && req.user) {
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
                NotificarMailComentario(c, entrada);
                NotificarMencionComentario(c, entrada)
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