import { CollectionConfig } from 'payload/types'
import {    isAdminAutorOrIntegrante, 
            CrearExtracto, 
            ValidarEntradaVacia, 
            PublicadasYNoBorradas, 
            SoftDelete, 
            PopulateComentarios, 
            PopulateAprecios, 
            LimpiarContenido, SetAutor,
            DestacarEntrada } from '../helper'
import { NotificarGrupoNuevaEntrada, NotificarMencionEntrada } from '../hooks/Notificaciones/NotificationsHooks'
import { Campos } from './CamposEntradasYComentarios'

const Entradas: CollectionConfig = {
    slug: 'entradas',
    versions: {
        drafts: false,
    },
    access: {
        read: PublicadasYNoBorradas,
        update: isAdminAutorOrIntegrante,
        delete: isAdminAutorOrIntegrante,
    },
    hooks: {
        beforeChange: [
            ValidarEntradaVacia,
            LimpiarContenido,
            CrearExtracto,
            SetAutor,
            // TODO revisar que si se esta fijando/desfijando o destacando/desdestacando, se chequee que el usuario sea admin o docente
        ],
        afterChange: [
            NotificarGrupoNuevaEntrada, // Al resto de integrantes del grupo
            NotificarMencionEntrada,
        ],
        afterRead: [
            PopulateComentarios,
            PopulateAprecios,
        ],
    },
    admin: {
        group: 'Interacciones',
    },
    fields: [
        ...Campos,
        {
            name: 'sala',
            type: 'relationship',
            relationTo: 'salas',
        },
        {
            name: 'destacada',
            type: 'checkbox',
        },
        {
            // Usada para ordenar las entradas y poder actualizarlo cuando alguien comenta
            // Y vaya para arriba. Pero no quiero usar updatedAt para no subir las que fueron editadas
            name: 'lastActivity',
            defaultValue: () => new Date(),
            type: 'date',
            admin: {
                date: {
                    pickerAppearance: 'dayAndTime',
                },
            },
        }
    ],

    endpoints: [
        {
            path: '/:id',
            method: 'delete',
            handler: SoftDelete('entradas'),
        },
        {
            path: '/:id/destacar',
            method: 'patch',
            handler: DestacarEntrada
        }
    ]
}

export default Entradas