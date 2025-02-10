import { CollectionConfig } from 'payload/types'
import { isAdminAutorOrIntegrante, CrearExtracto, ValidarEntradaVacia, PublicadasYNoBorradas, SoftDelete, PopulateComentarios, PopulateAprecios, isLoggedIn } from '../helper'
import { NotificarNuevaEntrada, NotificarMencionEntrada } from '../hooks/Notificaciones/NotificationsHooks'
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
            CrearExtracto,
            async ({ data, req }) => {
                if (req.user) {
                    data.autor = req.user.id; // El autor es el usuario actual
                    return data;
                }
            },
            // TODO revisar que si se esta fijando/desfijando o destacando/desdestacando, se chequee que el usuario sea admin o docente
        ],
        afterChange: [
            NotificarNuevaEntrada, // Al resto de integrantes del grupo
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
            relationTo: 'salones',
        },
        {
            name: 'destacada',
            type: 'checkbox',
        },
    ],

    endpoints: [
        {
            path: '/:id',
            method: 'delete',
            handler: SoftDelete('entradas'),
        }
    ]
}

export default Entradas