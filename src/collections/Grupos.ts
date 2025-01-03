import { SlugField } from '../SlugField'
import { CollectionConfig } from 'payload/types'
import { isAdminOrIntegrante } from '../helper'

const Grupos: CollectionConfig = {
    slug: 'grupos',
    admin: {
        useAsTitle: 'nombre',
    },
    access: {
        update: isAdminOrIntegrante,
        delete: isAdminOrIntegrante,
    },
    fields: [
        {
            name: 'nombre',
            type: 'text',
            index: true,
        },
        {
            name: 'avatar',
            type: 'upload',
            relationTo: 'avatares',
        },
        {
            name: 'integrantes',
            type: 'relationship',
            relationTo: 'users',
            hasMany: true,
        },
        {
            name: 'contexto',
            type: 'relationship',
            relationTo: 'salones',
        },
        {
            name: 'desc',
            type: 'textarea',
        },
        {
            name: 'link',
            type: 'text',
        },
        SlugField(),
    ],
}

export default Grupos;