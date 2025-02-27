import { SlugField } from '../SlugField'
import { CollectionConfig } from 'payload/types'
import { isAdminOrDocente } from '../helper'
import { unirme, abandonar, feed } from './ComisionesEndpoints'

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
        // {
        //     name: 'grupos',
        //     type: 'relationship',
        //     relationTo: 'grupos',
        //     hasMany: true,
        // },
        {
            name: 'contexto',
            type: 'relationship',
            relationTo: 'salas',
        },
        SlugField(),
    ],
    endpoints: [
        {
            path: '/:comisionid/feed',
            method: 'get',
            handler: feed,
        },
        {
            path: '/:comisionid/unirme',
            method: 'patch',
            handler: unirme
        },
        {
            path: '/:comisionid/abandonar',
            method: 'patch',
            handler: abandonar,
        }
    ]
}

export default Comisiones;