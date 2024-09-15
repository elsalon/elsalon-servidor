import { SlugField } from '@nouance/payload-better-fields-plugin'
import { CollectionConfig } from 'payload/types'
import { isAdminOrIntegrante } from '../helper'

const Grupos: CollectionConfig = {
    slug: 'grupos',
    admin: {
        useAsTitle: 'nombre',
    },
    access: {
        update: isAdminOrIntegrante,
        delete: isAdminOrIntegrante,
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
            name: 'integrantes',
            type: 'relationship',
            relationTo: 'users',
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
                appendOnDuplication : true,
                useFields: ['nombre'],
            },
        ),
    ],
    endpoints: [
        {
            path: '/:grupoid/abandonar', 
            method: 'post',
            handler: async (req, res, next) => {
                console.log('POST /grupos/:grupoid/abandonar');
                if(!req.user) return res.status(401).json({ error: 'Unauthorized' });

                try {
                const { grupoid } = req.params;
                const userId = req.user?.id; // Obteniendo el ID del usuario actual
                //   console.log('userId', userId);
                //   console.log('grupoid', grupoid);
                // Obtener si el usuario actual es integrante de este grupo
                const grupo = await req.payload.find({
                    collection: 'grupos',
                    where: {
                        id: { equals: grupoid },
                    },
                    limit: 1,
                    depth: 1,
                });
                // console.log(grupo)
                // const integrantes = 
                // console.log(integrantes, "***", userId)
                console.log(grupo.docs[0])
                const isIntegrante = grupo.docs[0].integrantes.some((integrante: any) => integrante.id === userId);
                if(isIntegrante){
                    // Eliminar al usuario actual de la lista de integrantes
                    await req.payload.update({
                        collection: 'grupos',
                        id: grupoid,
                        data: {
                            integrantes: { remove: userId },
                        }
                    });
                    return res.status(200).json({ message: 'Abandonado exitosamente' });
                }else{
                    return res.status(400).json({ error: 'No eres integrante de este grupo' });
                }
                } catch (error) {
                console.error('Error POST /grupos/:grupoid/abandonar', error);
                return res.status(500).json({ error: 'Internal Server Error' });
                }
            }
        }
    ]
}

export default Grupos;