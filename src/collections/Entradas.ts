import { CollectionConfig } from 'payload/types'
import {    isAdminAutorOrIntegrante, 
            CrearExtracto, 
            ValidarContenidoVacio, 
            PublicadasYNoBorradas, 
            SoftDelete, 
            PopulateComentarios, 
            PopulateAprecios, 
            LimpiarContenido, SetAutor,
            PopulateGuardado,
            DestacarEntrada } from '../helper'
import { NotificarGrupoNuevaEntrada, NotificarMencionEntrada } from '../hooks/Notificaciones/NotificationsHooks'
import { Campos } from './CamposEntradasYComentarios'
import { buscarYAsignarPortada, necesitaPortada } from '../utils/pdfCoverSearch'

const globals = require('../globals');

/**
 * After a new Biblioteca entry is created with PDFs but no images,
 * search Open Library for a book cover and attach it.
 * Runs in the background so it doesn't block the response.
 */
const BuscarPortadaBiblioteca = async ({ doc, req, operation, context }) => {
    if (context?.skipHooks || context?.skipPortadaSearch) return doc;
    if (operation !== 'create') return doc;
    if (!globals.bibliotecaId) return doc;

    if (necesitaPortada(doc, globals.bibliotecaId)) {
        // Fire-and-forget – don't make the user wait for the API call
        buscarYAsignarPortada(req.payload, doc).catch((err) => {
            console.error('[PortadaPDF] Background error:', err);
        });
    }

    return doc;
};

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
            ValidarContenidoVacio,
            LimpiarContenido,
            CrearExtracto,
            SetAutor,
            // TODO revisar que si se esta fijando/desfijando o destacando/desdestacando, se chequee que el usuario sea admin o docente
        ],
        afterChange: [
            NotificarGrupoNuevaEntrada, // Al resto de integrantes del grupo
            NotificarMencionEntrada,
            BuscarPortadaBiblioteca,
        ],
        afterRead: [
            PopulateComentarios,
            PopulateAprecios,
            PopulateGuardado,
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