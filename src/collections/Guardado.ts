import { CollectionConfig } from 'payload/types'
import { isAutor, isAdminOrAutor, afterCreateAssignAutorToUser } from '../helper'

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
      path: '/list',
      method: 'get',
      handler: async (req, res) => {
        const { page = 1, limit = 10, categoria } = req.query;
        
        const where: any = {};
        if (categoria) {
          where.categoria = { equals: categoria };
        }

        const guardados = await req.payload.find({
          collection: 'guardado',
          where,
          page: Number(page),
          limit: Number(limit),
          user: req.user,
          depth: 3,
          context: { skipPopulateComentarios: true },
        });

        res.status(200).json(guardados);
      },
    },
  ],
  fields: [
    {
      name: 'autor',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'contenido',
      type: 'relationship',
      relationTo: ['entradas', 'comentarios'],
    },
    {
      name: 'categoria',
      type: 'select',
      options: ['referencias', 'tecnicas', 'ideas', 'lecturas'],
    }
  ],
}

export default Guardado