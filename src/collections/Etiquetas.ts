import { SlugField } from '@nouance/payload-better-fields-plugin'
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
    ...SlugField(
      {
        name: 'slug',
      },
      {
          appendOnDuplication : true,
          useFields: ['nombre'],
      },
    ),
  ]
}

export default Etiquetas