import { CollectionConfig } from 'payload/types'
import { isAdminOrDocente } from '../helper'
import { SlugField } from '../SlugField'
import { Campos } from './CamposEntradasYComentarios'

const Paginas: CollectionConfig = {
    slug: 'paginas',
    versions: {
        drafts: false,
    },
    admin: {
        useAsTitle: 'titulo',
    },
    access: {
        read: () => true, // Importante para que el cache tenga acceso
        create: isAdminOrDocente,
        update: isAdminOrDocente,
        delete: isAdminOrDocente,
    },
    hooks: {
        beforeChange: [],
        afterChange:[],
    },
    fields: [
        {
            name: 'titulo',
            type: 'text',
        },
        SlugField({
            sourceField: 'titulo',
            slugField: 'slug',
            slugify: (input: string) => input.toLowerCase().replace(/\s+/g, '-'),
            admin: {
                position: 'sidebar',
            },
        }),
        {
            name: 'orden',
            type: 'number',
            defaultValue: 0,
        },
        ...Campos,
    ],
    endpoints: []
}

export default Paginas;