import { SlugField } from '@nouance/payload-better-fields-plugin'
import { CollectionConfig } from 'payload/types'
import { isAdminOrDocente } from '../helper'

const Comisiones: CollectionConfig = {
    slug: 'comisiones',
    admin: {
        useAsTitle: 'nombre',
    },
    access: {
        create: isAdminOrDocente,
        update: isAdminOrDocente,
        delete: isAdminOrDocente,
    },
    fields: [
        {
            name: 'nombre',
            type: 'text',
        },
        {
            name: 'docentes',
            type: 'relationship',
            relationTo: 'users',
            hasMany: true,
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
    ],
}

export default Comisiones;