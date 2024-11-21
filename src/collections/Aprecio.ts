import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor, afterCreateAssignAutorToUser } from '../helper'
import { NotificarAprecio } from '../GeneradorNotificacionesWeb'

const Aprecio: CollectionConfig = {
    slug: 'aprecio',
    admin: {
        group: 'Interacciones',
    },
    access:{
        update: isAdminOrAutor,
        delete: isAdminOrAutor,
    },
    hooks: {
        beforeChange: [afterCreateAssignAutorToUser],
        afterChange: [NotificarAprecio]
    },
    fields: [
        {
            name: 'autor',
            type: 'relationship',
            relationTo: 'users',
        },
        {
            name: 'contenidoid',
            type: 'text',
        }
    ],
    endpoints: [
        {
            path: '/:contenidoid', 
            method: 'get',
            handler: async (req, res, next) => {
                // console.log('GET /aprecio/:contenidoid');
                if(!req.user) return res.status(401).json({ error: 'Unauthorized' });

                try {
                  const { contenidoid } = req.params;
                  const userId = req.user?.id; // Obteniendo el ID del usuario actual
                  // Obtener si el usuario actual ha apreciado este contenido
                  const hasApreciado = await req.payload.find({
                    collection: 'aprecio',
                    where: {
                      autor: { equals: userId },
                      contenidoid: { equals: contenidoid },
                    },
                    limit: 1,
                  });
                  
                  // Obtener los últimos 5 aprecios para este contenido
                  const aprecios = await req.payload.find({
                    collection: 'aprecio',
                    where: {
                      contenidoid: { equals: contenidoid },
                    },
                    limit: 5,
                  });
              
                  // Retornar siempre arrays vacíos si no hay documentos
                  res.status(200).json({
                    docs: aprecios.docs || [],  // Si no hay documentos, devolver un array vacío
                    totalDocs: aprecios.totalDocs || 0,  // Si no hay aprecios, devolver 0
                    haApreciado: (hasApreciado.docs && hasApreciado.docs.length > 0) ? hasApreciado.docs[0].id : false,  // True si el usuario ha apreciado
                  });
                } catch (error) {
                    console.error('Error fetching aprecios', error);
                    res.status(500).json({ error: 'Error fetching aprecios' });
                }
              }              
        }
    ]
}

export default Aprecio
