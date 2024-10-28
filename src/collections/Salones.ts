import { CollectionConfig } from 'payload/types';
import { colorPickerField } from '@innovixx/payload-color-picker-field';
import { SlugField } from '../SlugField'
import { isAdmin, isAdminOrDocente } from '../helper'
import Grupos from './Grupos';

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
            admin:{
                position: 'sidebar',
            }
        }
    ],

    endpoints: [
        {
            path: '/feed', 
            method: 'get',
            handler: async (req, res, next) => {
                try{
                    if(!req.user) return res.status(401).json({ error: 'Unauthorized' });

                    // Dashboard principal construido por los siguientes criterios:
                    //   * Entradas del usuario actual
                    //   * Entradas de un salon con el que el usuario colabora
                    //   * Entradas de usuarios con el que el usuario colabora
                    //   * Entradas de grupos con el que el usuario colabora
                    //   * Entradas marcadas como destacadas
                    //   * TODO Agregar entradas de grupos en los que el usuario es miembro
                    
                    const page = req.query.page || 1;
                    const createdGreaterThan = req.query.createdGreaterThan || null;
                    const user = req.user;

                    let idsMateriasColabora = [];
                    let idsUsuariosColabora = [];
                    let idsGruposColabora = [];

                    const colaboraciones = await req.payload.find({
                        collection: 'colaboraciones',
                        where: {
                            autor: { equals: user.id },
                        },
                    });

                    colaboraciones.docs.forEach((colaboracion) => {
                        switch(colaboracion.tipo){
                            case 'salon':
                                idsMateriasColabora.push(colaboracion.idColaborador);
                                break;
                            case 'usuario':
                                idsUsuariosColabora.push(colaboracion.idColaborador);
                                break;
                            case 'grupo':
                                idsGruposColabora.push(colaboracion.idColaborador);
                                break;
                        }
                    });

                    // Parametros principales de busqueda
                    let query = {
                        or:[
                            {
                                autor: { equals: user.id }
                            },
                            {
                                sala: { in: idsMateriasColabora }
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
                    }
                    
                    if(createdGreaterThan){
                        // Agrego la fecha de creación como criterio de busqueda
                        query = {
                            and: [
                                query,
                                {
                                    createdAt: { greater_than: new Date(createdGreaterThan) }
                                }
                            ]
                        }
                    }

                    const feed = await req.payload.find({
                        collection: 'entradas',
                        where: query,
                        sort: "-createdAt",  // Ordenar por fecha de creación, de más reciente a más antigua
                        limit: 5,
                        page: parseInt(page),
                    });

                    res.status(200).json(feed);
                } catch (error) {
                    console.error('Error fetching dashboard', error);
                    res.status(500).json({ error: 'Error fetching dashboard' });
                }
            }
        }
    ]
}

export default Salones