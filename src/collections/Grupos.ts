import { SlugField } from '@nouance/payload-better-fields-plugin'
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
        ...SlugField(
            {
              name: 'slug',
              admin: {
                position: 'sidebar',
              },
            },
            {
                appendOnDuplication : true,
                useFields: ['nombre'],
            },
        ),
    ]
}

export default Grupos;