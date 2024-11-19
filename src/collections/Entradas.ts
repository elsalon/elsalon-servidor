import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor, NotificarMencionados, CrearExtracto, ValidarEntradaVacia } from '../helper'
import { Campos } from './CamposEntradasYComentarios'

const Entradas: CollectionConfig = {
    slug: 'entradas',
    access:{
        update: isAdminOrAutor,
        delete: isAdminOrAutor,
    },
    hooks: {
        beforeChange: [
            ValidarEntradaVacia,
            CrearExtracto,
            async ({ operation, data, req }) => {
                if(operation === 'create' && req.user){
                    data.autor = req.user.id; // El autor es el usuario actual
                    return data;
                }
            },
            // TODO revisar que si se esta fijando/desfijando o destacando/desdestacando, se chequee que el usuario sea admin o docente
        ],
        afterChange: [
            NotificarMencionados,
        ]
    },
    admin: {
        group: 'Interacciones',
    },
    fields: [
        ...Campos,
        {
            name: 'autoriaGrupal',
            type: 'checkbox',
        },
        {
            name: 'grupo',
            type: 'relationship',
            relationTo: 'grupos',
        },
        {
            name: 'sala',
            type: 'relationship',
            relationTo: 'salones',
        },
        {
            name: 'destacada',
            type: 'checkbox',
        },
    ],
}

export default Entradas