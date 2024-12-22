import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor, afterCreateAssignAutorToUser } from '../helper'
import { NotificarAprecio } from '../GeneradorNotificacionesWeb'

const Aprecio: CollectionConfig = {
  slug: 'aprecio',
  admin: {
    group: 'Interacciones',
  },
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
      index: true,
    }
  ],
  endpoints: [
    {
      path: '/batch',
      method: 'get', // POST to handle array input
      handler: async (req, res) => {
        if (!req.user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        interface Like {
          contenidoid: string; // or number, depending on your actual data type
        }

        try {
          const { ids } = req.query as { ids: string };
          const postIds = ids.split(',');
          if (!Array.isArray(postIds) || postIds.length === 0) {
            return res.status(400).json({ error: 'Invalid or empty postIds array' });
          }

          const userId = req.user.id;

          // Fetch all likes for the provided post IDs
          const likesData = await req.payload.find({
            collection: 'aprecio',
            where: {
              contenidoid: { in: postIds }, // Match any of the provided post IDs
            },
            depth: 0,
            limit: 1000, // Adjust limit based on expected maximum number of likes
          });

          // Group likes by post ID
          const likesCount = postIds.reduce((acc, postId) => {
            acc[postId] = 0;
            return acc;
          }, {} as Record<string, number>);  // Explicitly type as Record<string, number>

          likesData.docs.forEach((like: unknown) => {
            // Assert that like has the `contenidoid` property as expected
            const typedLike = like as Like;

            if (likesCount[typedLike.contenidoid] !== undefined) {
              likesCount[typedLike.contenidoid]++;
            }
          });

          // Check which posts the user has liked
          const userLikes = likesData.docs.filter((like) => like.autor === userId);

          // Map the results into the desired format
          const results = postIds.map((postId) => ({
            contenidoid: postId,
            totalDocs: likesCount[postId] || 0,
            haApreciado: userLikes.some((like) => like.contenidoid === postId),
          }));

          res.status(200).json(results);
        } catch (error) {
          console.error('Error fetching likes', error);
          res.status(500).json({ error: 'Error fetching likes' });
        }
      }
    },
    {
      path: '/:contenidoid',
      method: 'get',
      handler: async (req, res, next) => {
        // console.log('GET /aprecio/:contenidoid');
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

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
    },
    
  ]
}

export default Aprecio
