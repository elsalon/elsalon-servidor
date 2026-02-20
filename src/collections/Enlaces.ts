import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor, getCurrentPeriodForSala } from '../helper'
import { NotificarNuevoEnlace } from '../hooks/Notificaciones/NotificationsHooks'

const Enlaces: CollectionConfig = {
    slug: 'enlaces',
    access:{
        update: isAdminOrAutor,
        delete: isAdminOrAutor,
    },
    admin: {
        group: 'Interacciones',
    },
    hooks: {
        beforeChange: [
            async ({ operation, data, req }) => {
                // Only set dates for new 'salon' enlaces
                if (operation === 'create' && data.tipo === 'salon') {
                    try {
                        const sala = await req.payload.findByID({
                            collection: 'salas',
                            id: data.idEnlazado,
                        });
                        
                        if (sala) {
                            const period = getCurrentPeriodForSala(sala as any);
                            data.inicio = period.inicio;
                            data.fin = period.fin;
                        } else {
                            // Sala not found - set null dates (permanent enlace)
                            data.inicio = null;
                            data.fin = null;
                        }
                    } catch (error) {
                        console.error('Error fetching sala for enlace:', error);
                        // On error, set null dates (permanent enlace)
                        data.inicio = null;
                        data.fin = null;
                    }
                }
                // For bitacora/grupo enlaces, inicio/fin remain undefined (null in DB)
                return data;
            }
        ],
        afterChange: [NotificarNuevoEnlace]
    },
    fields: [
        {
            name: 'autor',
            type: 'relationship',
            relationTo: 'users',
        },
        {
            name: 'tipo',
            type: 'select',
            options: ['bitacora', 'salon', 'grupo'], // Tipos de enlaces
        },
        {
            name: 'idEnlazado', // ID del user, entrada, grupo o salon
            type: 'text',
            index: true,
        },
        {
            name: 'inicio',
            type: 'date',
            admin: {
                readOnly: true,
                description: 'Auto-calculated start date for salon enlaces',
            },
            index: true,
        },
        {
            name: 'fin',
            type: 'date',
            admin: {
                readOnly: true,
                description: 'Auto-calculated end date for salon enlaces',
            },
            index: true,
        },
    ]
}

export default Enlaces
