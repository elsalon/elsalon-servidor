import { SlugField } from '../SlugField'
import { CollectionConfig } from 'payload/types'

const Etiquetas: CollectionConfig = {
  slug: 'etiquetas',
  access: {
    read: () => true,
  },

  admin: {
    useAsTitle: 'nombre',
  },
  fields: [
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
    },
    SlugField(),
  ]
}

export default Etiquetas