import { CollectionConfig } from 'payload/types';
import { ColourPickerField } from '@nouance/payload-better-fields-plugin';
import { SlugField } from '@nouance/payload-better-fields-plugin'

const Salones: CollectionConfig = {
    slug: 'salones',
    admin: {
        useAsTitle: 'nombre',
    },
    access: {
        create: ({ req }) => {
            if (req.user) {
              return req.user.isAdmin
            }
            return false
        },
        update: ({ req }) => {
            if (req.user) {
              return req.user.isAdmin
            }
            return false
        },
        read: () => true,
    },
    fields: [
        {
            name: 'nombre',
            type: 'text',
        },
        {
            name: 'siglas',
            type: 'text',
        },
        ...ColourPickerField(
            {
              name: 'color',
            },
        ),
        {
            name: 'archivo',
            type: 'group',
            fields: [
                {
                    name: 'activar',
                    type: 'checkbox',
                },
                {
                    name: 'frecuencia',
                    type: 'select',
                    options: [
                        {
                            label: 'Anual',
                            value: 'anual',
                        },
                        {
                            label: 'Cuatrimestral',
                            value: 'cuatrimestral',
                        },
                    ],
                    defaultValue: 'anual',
                },
            ]
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
        {
            name: 'orden',
            type: 'number',
            admin:{
                position: 'sidebar',
            }
        }
    ]
}

export default Salones