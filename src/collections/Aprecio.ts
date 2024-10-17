import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor, afterCreateAssignAutorToUser, AddNotificationAprecio } from '../helper'

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
        afterChange: [AddNotificationAprecio]
    },
    fields: [
        {
            name: 'autor',
            type: 'relationship',
            relationTo: 'users',
        },
        {
            name: 'entrada',
            type: 'relationship',
            relationTo: 'entradas',

        }
    ],
    endpoints: [
        {
            path: '/:entradaid', 
            method: 'get',
            handler: async (req, res, next) => {
                // console.log('GET /aprecio/:entradaid');
                if(!req.user) return res.status(401).json({ error: 'Unauthorized' });

                try {
                  const { entradaid } = req.params;
                  const userId = req.user?.id; // Obteniendo el ID del usuario actual
                  // Obtener si el usuario actual ha apreciado esta entrada
                  const hasApreciado = await req.payload.find({
                    collection: 'aprecio',
                    where: {
                      entrada: { equals: entradaid },
                      autor: { equals: userId },
                    },
                    limit: 1,
                  });
                  
                  // Obtener los últimos 5 aprecios para esta entrada
                  const aprecios = await req.payload.find({
                    collection: 'aprecio',
                    where: {
                      entrada: { equals: entradaid },
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
