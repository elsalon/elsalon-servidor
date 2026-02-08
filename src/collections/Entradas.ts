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
import { BuscarPortadaBiblioteca, buscarYAsignarPortada } from '../utils/pdfCoverSearch'
import { DescargarArchivosDriveBiblioteca, descargarArchivosDrive } from '../utils/googleDriveDownloader'

const globals = require('../globals');

/**
 * Combined hook that downloads Google Drive files first, then searches for cover.
 * Runs in beforeChange to modify data before saving - no separate update needed!
 */
const BibliotecaEnriquecimiento = async ({ data, operation, req, context }) => {
    if (context?.skipHooks || context?.skipBibliotecaEnriquecimiento) return data;
    if (operation !== 'create') return data;
    if (!globals.bibliotecaId) return data;

    const salaId = typeof data.sala === 'string' ? data.sala : data.sala?.id;
    if (salaId !== globals.bibliotecaId) return data;

    // Skip if no contenido (no Drive links to extract)
    if (!data.contenido) return data;

    try {
        // Step 1: Download Google Drive files (modifies data.archivos)
        console.log(`[BibliotecaEnriquecimiento] Downloading Drive files for new biblioteca entry`);
        const modifiedData = await descargarArchivosDrive(req.payload, data as any);

        // Step 2: Search and assign cover (modifies data.imagenes)
        console.log(`[BibliotecaEnriquecimiento] Searching for cover for new biblioteca entry`);
        const finalData = await buscarYAsignarPortada(req.payload, modifiedData);

        console.log(`[BibliotecaEnriquecimiento] ✓ Enrichment complete`);
        return finalData;
    } catch (error) {
        console.error(`[BibliotecaEnriquecimiento] Error:`, error);
        return data;
    }
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
            BibliotecaEnriquecimiento, // Download Drive + Search covers (before save)
            // TODO revisar que si se esta fijando/desfijando o destacando/desdestacando, se chequee que el usuario sea admin o docente
        ],
        afterChange: [
            NotificarGrupoNuevaEntrada, // Al resto de integrantes del grupo
            NotificarMencionEntrada,
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