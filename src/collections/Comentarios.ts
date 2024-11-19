import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor, NotificarAutorEntrada, NotificarMencionados, CrearExtracto } from '../helper'
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
            NotificarAutorEntrada,
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