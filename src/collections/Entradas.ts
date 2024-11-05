import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor, NotificarMencionados, CrearExtracto, ValidarEntradaVacia } from '../helper'

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
        {
            name: 'autor',
            type: 'relationship',
            relationTo: 'users',
            hasMany: false,
        },
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
            name: 'contenido',
            type: 'textarea',
        },
        {
            name: 'extracto',
            type: 'text',
        },
        {
            name: 'imagenes',
            type: 'array',
            fields: [
                {
                    name: 'imagen',
                    type: 'upload',
                    relationTo: 'imagenes',
                }
            ]
        },
        {
            name: 'archivos',
            type: 'array',
            fields: [
                {
                    name: 'archivo',
                    type: 'upload',
                    relationTo: 'archivos',
                }
            ]
        },
        {
            name: 'mencionados',
            type: 'relationship',
            relationTo: 'users',
            hasMany: true,
        },
        {
            name: 'etiquetas',
            type: 'relationship',
            relationTo: 'etiquetas',
            hasMany: true,
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