import { CollectionConfig } from 'payload'
import { isAdminOrAutor, afterCreateAssignAutorToUser } from '../helper'
import { NotificarAprecio } from '../GeneradorNotificacionesWeb'

const Aprecio: CollectionConfig = {
  slug: 'aprecio',
  // admin: {
  //   group: 'Interacciones',
  // },
  access: {
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
      handler: async (req) => {
        // console.log('GET /aprecio/:contenidoid');
        if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        try {
          const { contenidoid } = req.routeParams as { contenidoid: string };
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
          return Response.json({
            docs: aprecios.docs || [],  // Si no hay documentos, devolver un array vacío
            totalDocs: aprecios.totalDocs || 0,  // Si no hay aprecios, devolver 0
            haApreciado: (hasApreciado.docs && hasApreciado.docs.length > 0) ? hasApreciado.docs[0].id : false,  // True si el usuario ha apreciado
          }, { status: 200 });
        } catch (error) {
          console.error('Error fetching aprecios', error);
          return Response.json({ error: 'Error fetching aprecios' }, { status: 500 });
        }
      }
    }
  ]
}

export default Aprecio
