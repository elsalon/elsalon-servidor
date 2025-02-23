import { CollectionConfig, Field } from 'payload/types'
import { StringToArray, ArrayToString } from '../helper'
export const Campos: Field[] = [
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
        index: true,
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
        relationTo: ['users', 'grupos'],
        hasMany: true,
    },
    {
        name: 'etiquetas',
        type: 'relationship',
        relationTo: 'etiquetas',
        hasMany: true,
    },
    {
        name: 'embedsYoutube',
        type: 'text',
        hooks:{
            beforeValidate: [ArrayToString],
            afterRead: [StringToArray]
        }
    },
    {
        name: 'embedsVimeo',
        type: 'text',
        hooks:{
            beforeValidate: [ArrayToString],
            afterRead: [StringToArray]
        }
    },
    {
        type: 'row',
        fields: [
            {
                name: 'isDeleted',
                type: 'checkbox',
            },
            {
                name: 'deletedAt',
                type: 'date',
            },
            {
                name: 'deletedBy',
                type: 'relationship',
                relationTo: 'users',
            }
        ]
    }
]