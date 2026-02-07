import { CollectionConfig } from 'payload/types'
import { isAutor, isAdminOrAutor, afterCreateAssignAutorToUser } from '../helper'

const feedHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user.id;
    // const { categoria, page = 1, limit = 12 } = req.query;

    // Build query for guardados
    const whereQuery: any = {
      autor: { equals: userId },
      ...req.query,
    };

    // if (categoria) {
    //   whereQuery.categoria = { equals: categoria };
    // }
    console.log('Guardado feed query:', whereQuery);

    // Fetch guardados with pagination info
    const guardadosResult = await req.payload.find({
      collection: 'guardado',
      where: whereQuery,
      sort: 'createdAt', // older first (ascending)
      // page: parseInt(page as string, 10),
      // limit: parseInt(limit as string, 10),
    });
    
    const entradaIds = guardadosResult.docs.map(g => g.contenidoid).filter(Boolean);

    // Single query to fetch all entries
    const entradasResult = await req.payload.find({
      collection: 'entradas',
      where: { id: { in: entradaIds } },
      depth: 2,
      limit: entradaIds.length,
      req,
    });

    // sort entries to match the order of guardados
    const entradasMap = new Map(entradasResult.docs.map(e => [e.id, e]));
    const sortedEntradas = entradaIds.map(id => entradasMap.get(id)).filter(Boolean);

    return res.json({
      ...entradasResult,
      docs: sortedEntradas,
    });
    
  } catch (error) {
    console.error('Error in guardado/feed:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const Guardado: CollectionConfig = {
  slug: 'guardado',
  admin: {
    group: 'Interacciones',
  },
  access: {
    read: isAutor,
    update: isAdminOrAutor,
    delete: isAdminOrAutor,
  },
  hooks: {
    beforeChange: [afterCreateAssignAutorToUser],
  },
  endpoints: [
    {
      path: '/feed',
      method: 'get',
      handler: feedHandler,
    },
  ],
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
    },
    {
      name: 'contenidotipo',
      type: 'text',
    },
    {
      name: 'categoria',
      type: 'select',
      options: ['referencias', 'tecnicas', 'ideas', 'lecturas'],
    }
  ],
}

export default Guardado