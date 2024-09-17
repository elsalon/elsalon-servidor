import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor } from '../helper'

const Entradas: CollectionConfig = {
    slug: 'entradas',
    access:{
        update: isAdminOrAutor,
        delete: isAdminOrAutor,
    },
    hooks: {
        beforeChange: [
            async ({ operation, data, req }) => {
                if(operation === 'create'){
                    // remove html and get 20 first characters
                    data.extracto = data.contenido?.replace(/<[^>]*>?/gm, '').substring(0, 40);
                    // console.log('New entry created', data);
                    data.autor = req.user.id; // El autor es el usuario actual
                    return data;
                }
            }
        ]
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
            name: 'sala',
            type: 'relationship',
            relationTo: 'salones',
        }
    ],
}

export default Entradas