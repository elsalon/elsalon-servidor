import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor, NotificarMencionados, CrearExtracto } from '../helper'
import { NotificarNuevoComentario } from '../GeneradorNotificacionesWeb'
import { NotificarMailComentario } from '../GeneradorNotificacionesMail'
import { Campos } from './CamposEntradasYComentarios'

const Comentarios: CollectionConfig = {
    slug: 'comentarios',
    access:{
        update: isAdminOrAutor,
        delete: isAdminOrAutor,
    },
    hooks: {
        beforeChange: [
            CrearExtracto,
            async ({ operation, data, req }) => {
                if(operation === 'create' && req.user){
                    // console.log('New entry created', data);
                    data.autor = req.user.id; // El autor es el usuario actual
                    return data;
                }
            }
        ],
        afterChange: [
            async (c) => {
                const entrada = await c.req.payload.findByID({collection: 'entradas', id: c.doc.entrada});
                NotificarNuevoComentario(c, entrada);
                NotificarMailComentario(c, entrada);
            },
            NotificarMencionados,
        ]
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
        
    ]
}

export default Comentarios;