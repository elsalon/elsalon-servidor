import { CollectionConfig, Field } from 'payload'

export const Campos: Field[] = [
    {
        name: 'autor',
        type: 'relationship',
        relationTo: 'users',
        hasMany: false,
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
        name: 'embedsYoutube',
        type: 'text',
    },
    {
        name: 'embedsVimeo',
        type: 'text',
    },
]