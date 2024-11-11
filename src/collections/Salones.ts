import { CollectionConfig } from 'payload/types';
import { colorPickerField } from '@innovixx/payload-color-picker-field';
import { SlugField } from '../SlugField';
import { isAdmin, isAdminOrDocente } from '../helper';
import { Where } from 'payload/types';

const globals = require('../globals');

const Salones: CollectionConfig = {
    slug: 'salones',
    admin: {
        useAsTitle: 'nombre',
    },
    access: {
        create: isAdmin,
        update: isAdminOrDocente,
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
        }
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

                    const user = req.user;

                    let idsSalonesColabora: string[] = [globals.elSalonId]; // Incluyo el salon principal
                    let idsUsuariosColabora: string[] = [];
                    let idsGruposColabora: string[] = [];

                    const colaboraciones = await req.payload.find({
                        collection: 'colaboraciones',
                        where: {
                            autor: { equals: user.id },
                        },
                    });

                    colaboraciones.docs.forEach((colaboracion) => {
                        switch (colaboracion.tipo) {
                            case 'salon':
                                idsSalonesColabora.push(colaboracion.idColaborador as string);
                                break;
                            case 'bitacora':
                                idsUsuariosColabora.push(colaboracion.idColaborador as string);
                                break;
                            case 'grupo':
                                idsGruposColabora.push(colaboracion.idColaborador as string);
                                break;
                        }
                    });

                    let query: Where = {
                        or: [
                            {
                                autor: { equals: user.id }
                            },
                            {
                                sala: { in: idsSalonesColabora }
                            },
                            {
                                autor: { in: idsUsuariosColabora }
                            },
                            {
                                grupo: { in: idsGruposColabora }
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
                                    createdAt: { greater_than: dateValue }
                                }
                            ]
                        };
                    }

                    const feed = await req.payload.find({
                        collection: 'entradas',
                        where: query,
                        sort: "-createdAt",
                        limit: 5,
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

export default Salones;