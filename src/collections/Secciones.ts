import { CollectionConfig } from 'payload/types'
import { isAdminOrDocente } from '../helper'
import { SlugField } from '../SlugField'
import { Campos } from './CamposEntradasYComentarios'

const Secciones: CollectionConfig = {
    slug: 'secciones',
    admin: {
        useAsTitle: 'nombre',
    },
    access: {
        read: () => true, // Importante para que el cache tenga acceso
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
            name: 'autor',
            type: 'relationship',
            relationTo: 'users',
        },
        {
            name: 'orden',
            type: 'number',
            defaultValue: 0,
        },
        {
            name: 'sala',
            type: 'relationship',
            relationTo: 'salas',
        },
        SlugField(),
        {
            name: 'componente',
            type: 'blocks',
            minRows: 1,
            maxRows: 1,
            blocks: [
                {
                    slug: 'linkExterno',
                    fields:[
                        {
                            name: 'url',
                            type: 'text',
                        }
                    ]
                },
                {
                    slug: 'pagina',
                    fields: [
                        ...Campos,
                    ]
                }
            ]
        }
    ]
}

export default Secciones;