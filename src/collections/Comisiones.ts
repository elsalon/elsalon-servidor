import { SlugField } from '@nouance/payload-better-fields-plugin'
import { CollectionConfig } from 'payload/types'
import { isAdminOrDocente } from '../helper'

const Comisiones: CollectionConfig = {
    slug: 'comisiones',
    admin: {
        useAsTitle: 'nombre',
    },
    access: {
        create: isAdminOrDocente,
        update: isAdminOrDocente,
        delete: isAdminOrDocente,
    },
    fields: [
        {
            name: 'nombre',
            type: 'text',
        },
        {
            name: 'docentes',
            type: 'relationship',
            relationTo: 'users',
            hasMany: true,
        },
        {
            name: 'integrantes',
            type: 'relationship',
            relationTo: 'users',
            hasMany: true,
        },
        {
            name: 'grupos',
            type: 'relationship',
            relationTo: 'grupos',
            hasMany: true,
        },
        {
            name: 'contexto',
            type: 'relationship',
            relationTo: 'salones',
        },
        ...SlugField(
            {
                name: 'slug',
                admin: {
                    position: 'sidebar',
                },
            },
            {
                appendOnDuplication: true,
                useFields: ['nombre'],
            },
        ),
    ],
    endpoints: [
        {
            path: '/:comisionid/unirme',
            method: 'patch',
            handler: async (req, res, next) => {
                try {

                    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
                    const { comisionid } = req.params;
                    const { grupoId } = req.body;
                    const userId = req.user?.id; // Obteniendo el ID del usuario actual
                    const comision = await req.payload.findByID({
                        collection: 'comisiones',
                        id: comisionid,
                        depth: 0,
                    });

                    console.log({
                        collection: 'grupos',
                        id: grupoId,
                    })

                    if (grupoId) {
                        // Quiere unir a su grupo
                        const grupo = await req.payload.findByID({
                            collection: 'grupos',
                            id: grupoId,
                        });
                        if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado' });
                        comision.grupos.push(grupo.id);
                    } else {
                        // Se quiere unir individualmente
                        const esAlumno = req.user.rol === 'alumno';
                        if (esAlumno) {
                            // Si es alumno, se le agrega a los integrantes
                            comision.integrantes.push(userId);
                        } else {
                            // Si es docente, se le agrega a los docentes
                            comision.docentes.push(userId);
                        }
                    }

                    const update = await req.payload.update({
                        collection: 'comisiones',
                        id: comisionid,
                        data: comision,
                    });
                    return res.status(200).json(update);
                } catch (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error interno' });
                }
            }
        },
        {
            path: '/:comisionid/abandonar',
            method: 'patch',
            handler: async (req, res, next) => {
                try {
                    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
                    const { comisionid } = req.params;
                    const { grupoId } = req.body;
                    const userId = req.user?.id; // Obteniendo el ID del usuario actual
                    const comision = await req.payload.findByID({
                        collection: 'comisiones',
                        id: comisionid,
                        depth: 0,
                    });

                    console.log("GRUPO", grupoId, req.body)
                    if (grupoId) {
                        // Quiere abandonar un grupo
                        const grupo = await req.payload.findByID({
                            collection: 'grupos',
                            id: grupoId,
                        });
                        if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado' });
                        comision.grupos = comision.grupos.filter(g => g !== grupo.id);
                    } else {
                        // Se quiere ir individualmente
                        const esAlumno = req.user.rol === 'alumno';
                        if (esAlumno) {
                            // Si es alumno, se lo saca de integrantes
                            comision.integrantes = comision.integrantes.filter(i => i !== userId);
                        } else {
                            // Si es docente, se lo saca de docentes
                            comision.docentes = comision.docentes.filter(d => d !== userId);
                        }
                    }

                    const update = await req.payload.update({
                        collection: 'comisiones',
                        id: comisionid,
                        data: comision,
                    });
                    return res.status(200).json(update);
                } catch (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error interno' });
                }
            }
        }
    ]
}

export default Comisiones;