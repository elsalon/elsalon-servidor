import { CollectionConfig } from 'payload/types';
import { ColourPickerField } from '@nouance/payload-better-fields-plugin';
import { SlugField } from '@nouance/payload-better-fields-plugin'
import { isAdmin } from '../helper'
import Grupos from './Grupos';

const Salones: CollectionConfig = {
    slug: 'salones',
    admin: {
        useAsTitle: 'nombre',
    },
    access: {
        create: isAdmin,
        update: isAdmin,
        read: () => true,
    },
    fields: [
        {
            name: 'nombre',
            type: 'text',
        },
        {
            name: 'siglas',
            type: 'text',
        },
        ...ColourPickerField(
            {
              name: 'color',
            },
        ),
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
            ]
        },
        
        ...SlugField(
            {
              name: 'slug',
              admin: {
                position: 'sidebar',
              },
            },
            {
                appendOnDuplication : true,
                useFields: ['nombre'],
            },
        ),
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
                    //   * Entradas de un salon con el que el usuario colabora
                    //   * Entradas de usuarios con el que el usuario colabora
                    //   * Entradas de grupos con el que el usuario colabora
                    //   * Entradas marcadas como destacadas
                    //   * TODO Agregar entradas de grupos en los que el usuario es miembro
                    
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
                    const query = {
                        or:[
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

                    const entradas = await req.payload.find({
                        collection: 'entradas',
                        where: query,
                        sort: "-createdAt",  // Ordenar por fecha de creación, de más reciente a más antigua
                        limit: 5,
                    });

                    res.status(200).json({
                        docs: entradas.docs || [],  // Si no hay documentos, devolver un array vacío
                        totalDocs: entradas.totalDocs || 0,  // Si no hay aprecios, devolver 0
                    });
                } catch (error) {
                    console.error('Error fetching dashboard', error);
                    res.status(500).json({ error: 'Error fetching dashboard' });
                }
            }
        }
    ]
}

export default Salones