import { CollectionConfig } from 'payload/types'
import { isAdminOrDocente } from '../helper'

const LinksExternos: CollectionConfig = {
    slug: 'linksExternos',
    versions: {
        drafts: false,
    },
    admin: {
        useAsTitle: 'label',
    },
    access: {
        read: () => true,
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
            name: 'url',
            type: 'text',
        },
        {
            name: 'label',
            type: 'textarea',
        },
        {
            name: 'orden',
            type: 'number',
            defaultValue: 0,
        },
        {
            name: 'autor',
            type: 'relationship',
            relationTo: 'users',
        },
    ],
    endpoints: []
}

export default LinksExternos;