import { CollectionConfig } from 'payload/types';
import { colorPickerField } from '@innovixx/payload-color-picker-field';
import { SlugField } from '../SlugField';
import { isAdmin, isAdminOrDocente } from '../helper';
import { Where } from 'payload/types';
import { generateICS, filterEventsBySalaTimeframe } from '../utils/icsGenerator';

const globals = require('../globals');

const Salas: CollectionConfig = {
    slug: 'salas',
    admin: {
        useAsTitle: 'nombre',
    },
    access: {
        create: isAdmin,
        // update: isAdminOrDocente,
        update: () => true,
        read: () => true,
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
            name: 'siglas',
            type: 'text',
        },
        colorPickerField({
            name: 'color',
            label: 'Color',
            defaultValue: '#000',
        }),
        {
            name: 'aulas',
            type: 'text',
        },
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
                {
                    name: 'annoInicio',
                    type: 'number',
                    defaultValue: 2018,
                    label: 'Año de inicio',
                }
            ]
        },
        SlugField(),
        {
            name: 'orden',
            type: 'number',
            admin: {
                position: 'sidebar',
            }
        },
        {
            name: 'eventos',
            type: 'group',
            fields: [
                {
                    name: 'activar',
                    type: 'checkbox',
                },
                {
                    name: 'calendarioUrl',
                    type: 'text',
                    admin: {
                        readOnly: true,
                    },
                    hooks: {
                        afterRead : [
                            async ({ data, req, siblingData }) => {
                                // Generate the calendar URL based on current period and sala type
                                const now = new Date();
                                const currentYear = now.getFullYear();
                                const isCuatrimestral = data.archivo?.frecuencia === 'cuatrimestral' || req.body?.archivo?.frecuencia === 'cuatrimestral';
                                
                                let period: string;
                                if (isCuatrimestral) {
                                    const currentCuatri = now.getMonth() < 7 ? 1 : 2;
                                    period = `${currentYear}-c${currentCuatri}`;
                                } else {
                                    period = `${currentYear}`;
                                }
                                return `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/salas/${data.id}/calendar/${period}.ics`;
                            }
                        ]
                    }
                }
            ]
        },
    ],

    endpoints: [
        {
            path: '/feed',
            method: 'get' as const,
            handler: async (req, res, next) => {

                try {
                    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

                    // Safely parse query parameters
                    const page = typeof req.query.page === 'string' 
                        ? parseInt(req.query.page, 10) 
                        : 1;

                    const createdGreaterThan = typeof req.query.createdGreaterThan === 'string'
                        ? req.query.createdGreaterThan
                        : null;
                    
                    const createdLessThan = typeof req.query.createdLessThan === 'string'
                        ? req.query.createdLessThan
                        : null;

                    const user = req.user;

                    // Build time-aware query clauses
                    let salonClauses: any[] = [
                        // Always include main salas (no time restriction)
                        { sala: { in: [globals.elSalonId, globals.bibliotecaId] } }
                    ];
                    let idsUsuariosEnlazado: string[] = [];
                    let idsGruposEnlazado: string[] = [];

                    const enlaces = await req.payload.find({
                        collection: 'enlaces',
                        where: {
                            autor: { equals: user.id },
                        },
                        limit: 1000, // Ensure we get all enlaces
                    });

                    enlaces.docs.forEach((enlace) => {
                        if (enlace.tipo === 'salon') {
                            // Time-restricted sala enlaces
                            if (enlace.inicio && enlace.fin) {
                                // Only show posts created or active during enlace period
                                const inicioDate = new Date(enlace.inicio as string);
                                const finDate = new Date(enlace.fin as string);
                                
                                salonClauses.push({
                                    and: [
                                        { sala: { equals: enlace.idEnlazado } },
                                        {
                                            or: [
                                                { 
                                                    createdAt: { 
                                                        greater_than_equal: inicioDate,
                                                        less_than_equal: finDate
                                                    }
                                                },
                                                { 
                                                    lastActivity: { 
                                                        greater_than_equal: inicioDate,
                                                        less_than_equal: finDate
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                });
                            } else {
                                // Legacy enlace with null dates - treat as permanent
                                salonClauses.push({ sala: { equals: enlace.idEnlazado } });
                            }
                        } else if (enlace.tipo === 'bitacora') {
                            idsUsuariosEnlazado.push(enlace.idEnlazado as string);
                        } else if (enlace.tipo === 'grupo') {
                            idsGruposEnlazado.push(enlace.idEnlazado as string);
                        }
                    });

                    let query: Where = {
                        or: [
                            {
                                autor: { equals: user.id }
                            },
                            {
                                or: salonClauses
                            },
                            {
                                autor: { in: idsUsuariosEnlazado }
                            },
                            {
                                grupo: { in: idsGruposEnlazado }
                            },
                            {
                                destacada: { equals: true }
                            }
                        ]
                    };

                    if (createdGreaterThan) {
                        // Validate the date string before creating Date object
                        const dateValue = new Date(createdGreaterThan);
                        if (isNaN(dateValue.getTime())) {
                            return res.status(400).json({ error: 'Invalid date format for createdGreaterThan' });
                        }

                        query = {
                            and: [
                                query,
                                {
                                    lastActivity: { greater_than: dateValue }
                                }
                            ]
                        };
                    }
                    if(createdLessThan) {
                        // Validate the date string before creating Date object
                        const dateValue = new Date(createdLessThan);
                        if (isNaN(dateValue.getTime())) {
                            return res.status(400).json({ error: 'Invalid date format for createdLessThan' });
                        }

                        query = {
                            and: [
                                query,
                                {
                                    lastActivity: { less_than: dateValue }
                                }
                            ]
                        };
                    }

                    const feed = await req.payload.find({
                        collection: 'entradas',
                        where: query,
                        sort: "-lastActivity",
                        limit: 12,
                        page: page,
                        overrideAccess: false,
                        user: req.user,
                    });

                    res.status(200).json(feed);
                } catch (error) {
                    console.error('Error fetching dashboard', error);
                    res.status(500).json({ error: 'Error fetching dashboard' });
                }
            }
        },
        {
            path: '/:id/calendar/:period.ics',
            method: 'get' as const,
            handler: async (req, res, next) => {
                try {
                    const salaId = req.params.id;
                    const period = req.params.period;

                    // Parse period: can be "2025" or "2025-c1" or "2025-c2"
                    const periodRegex = /^(\d{4})(?:-c([12]))?$/;
                    const match = period.match(periodRegex);

                    if (!match) {
                        return res.status(400).json({ error: 'Invalid period format. Use YYYY or YYYY-c1 or YYYY-c2 (e.g., 2026 or 2026-c1)' });
                    }

                    const year = parseInt(match[1], 10);
                    const cuatrimestre = match[2] ? parseInt(match[2], 10) as 1 | 2 : undefined;

                    // Fetch the sala to get its name and timeframe config
                    const sala = await req.payload.findByID({
                        collection: 'salas',
                        id: salaId,
                    });

                    if (!sala) {
                        return res.status(404).json({ error: 'Sala not found' });
                    }

                    // Validate cuatrimestre usage
                    const frecuencia = (sala as any).archivo?.frecuencia as string | undefined;
                    if (cuatrimestre && frecuencia !== 'cuatrimestral') {
                        return res.status(400).json({ error: 'This is an annual sala. Use just the year (e.g., 2026) without cuatrimestre' });
                    }

                    if (!cuatrimestre && frecuencia === 'cuatrimestral') {
                        return res.status(400).json({ error: 'This is a cuatrimestral sala. Include cuatrimestre in the period (e.g., 2026-c1)' });
                    }

                    // Fetch all eventos for this sala
                    const eventos = await req.payload.find({
                        collection: 'eventos',
                        where: {
                            sala: { equals: salaId }
                        },
                        limit: 1000,
                        sort: 'fecha',
                    });

                    // Filter events based on period
                    const filteredEvents = filterEventsBySalaTimeframe(eventos.docs as any[], sala as any, year, cuatrimestre);

                    // Generate ICS content
                    const calendarName = cuatrimestre 
                        ? `El Salon - ${sala.nombre} (${year} C${cuatrimestre})`
                        : `El Salon - ${sala.nombre} (${year})`;
                    const icsContent = generateICS(filteredEvents, calendarName);

                    // Set appropriate headers for calendar file
                    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
                    res.setHeader('Content-Disposition', `inline; filename="${sala.slug || sala.nombre}-${period}.ics"`);
                    res.setHeader('Cache-Control', 'public, max-age=3600');
                    
                    res.status(200).send(icsContent);
                } catch (error) {
                    console.error('Error generating calendar:', error);
                    res.status(500).json({ error: 'Error generating calendar' });
                }
            }
        }
    ]
};

export default Salas;