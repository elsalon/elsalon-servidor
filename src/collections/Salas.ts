import { CollectionConfig } from 'payload/types';
import { colorPickerField } from '@innovixx/payload-color-picker-field';
import { SlugField } from '../SlugField';
import { isAdmin, isAdminOrDocente } from '../helper';
import { Where } from 'payload/types';

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

                    let idsSalasEnlazado: string[] = [globals.elSalonId]; // Incluyo el salon principal
                    let idsUsuariosEnlazado: string[] = [];
                    let idsGruposEnlazado: string[] = [];

                    const enlaces = await req.payload.find({
                        collection: 'enlaces',
                        where: {
                            autor: { equals: user.id },
                        },
                    });

                    enlaces.docs.forEach((enlace) => {
                        switch (enlace.tipo) {
                            case 'salon':
                                idsSalasEnlazado.push(enlace.idEnlazado as string);
                                break;
                            case 'bitacora':
                                idsUsuariosEnlazado.push(enlace.idEnlazado as string);
                                break;
                            case 'grupo':
                                idsGruposEnlazado.push(enlace.idEnlazado as string);
                                break;
                        }
                    });

                    let query: Where = {
                        or: [
                            {
                                autor: { equals: user.id }
                            },
                            {
                                sala: { in: idsSalasEnlazado }
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
        }
    ]
};

export default Salas;