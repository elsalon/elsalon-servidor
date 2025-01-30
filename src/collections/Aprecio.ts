import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor, afterCreateAssignAutorToUser, PopulateAprecios } from '../helper'
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
    afterChange: [NotificarAprecio],
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
    // {
    //   path: '/batch',
    //   method: 'get', // POST to handle array input
    //   handler: async (req, res) => {
    //     if (!req.user) {
    //       return res.status(401).json({ error: 'Unauthorized' });
    //     }
        
    //     interface Like {
    //       contenidoid: string; // or number, depending on your actual data type
    //     }
        
    //     try {
    //       var { ids } = req.query as { ids: string };
    //       if (!ids?.trim()) {
    //         return res.status(400).json({ error: 'Missing ids parameter' });
    //       }
    //       const postIds = ids.split(',');
    //       if (!Array.isArray(postIds) || postIds.length === 0) {
    //         return res.status(400).json({ error: 'Invalid or empty postIds array' });
    //       }

    //       const userId = req.user.id;

    //       // Fetch all likes for the provided post IDs
    //       const likesData = await req.payload.find({
    //         collection: 'aprecio',
    //         where: {
    //           contenidoid: { in: postIds }, // Match any of the provided post IDs
    //         },
    //         depth: 1,
    //         limit: 1000, // Adjust limit based on expected maximum number of likes
    //       });

    //       // Group likes by post ID
    //       const likesCount = postIds.reduce((acc, postId) => {
    //         acc[postId] = [];
    //         return acc;
    //       }, {} as Record<string, number>);  // Explicitly type as Record<string, number>

    //       likesData.docs.forEach((like: any) => {
    //         // Assert that like has the `contenidoid` property as expected
    //         // const typedLike = like as Like;

    //         if (likesCount[like?.contenidoid] !== undefined) {
    //           const autor = {id: like.autor.id, nombre: like.autor.nombre, slug: like.autor.slug};
    //           likesCount[like?.contenidoid].push({autor});
    //         }
    //       });

    //       // Check which posts the user has liked
    //       // const userLikes = likesData.docs.filter((like) => like.autor === userId);

    //       // Map the results into the desired format
    //       const results = postIds.map((postId) => ({
    //         contenidoid: postId,
    //         totalDocs: likesCount[postId].length || 0,
    //         docs: likesCount[postId] || [],
    //         haApreciado: likesCount[postId].some((like: any) => like.autor.id === userId),
    //       }));

    //       res.status(200).json(results);
    //     } catch (error) {
    //       console.error('Error fetching likes', error);
    //       res.status(500).json({ error: 'Error fetching likes' });
    //     }
    //   }
    // },
    {
      path: '/:contenidoid',
      method: 'get',
      handler: async (req, res, next) => {
        // Piso el get /id para que devuelva los aprecios de un contenido
        // console.log('GET /aprecio/:contenidoid');
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        try {
          const { contenidoid } = req.params;

          console.log('GET /aprecio/:contenidoid', { contenidoid });
          // Obtener los últimos 5 aprecios para este contenido
          const aprecios = await req.payload.find({
            collection: 'aprecio',
            where: {
              contenidoid: { equals: contenidoid },
            },
            overrideAccess: false,
            user: req.user,
          });
          // console.log(aprecios)

          // Retornar siempre arrays vacíos si no hay documentos
          res.status(200).json(aprecios);
        } catch (error) {
          console.error('Error fetching aprecios', error);
          res.status(500).json({ error: 'Error fetching aprecios' });
        }
      }
    },
    
  ]
}

export default Aprecio
