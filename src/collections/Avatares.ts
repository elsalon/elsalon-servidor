import { CollectionConfig } from 'payload'

const Avatares: CollectionConfig = {
    slug: 'avatares',
    access: {
        read: () => true,
    },
    
    admin: {
      group: 'Medios',
  },
    upload: {
        // staticURL: '/avatares',
        // staticDir: 'avatares',
        imageSizes: [
          {
            name: 'thumbnail',
            width: 48,
            height: 48,
            position: 'centre',
            withoutEnlargement: true,
          },
          {
            name: 'medium',
            width: 500,
            // By specifying `undefined` or leaving a height undefined,
            // the image will be sized to a certain width,
            // but it will retain its original aspect ratio
            // and calculate a height automatically.
            height: undefined,
            position: 'centre',
            withoutEnlargement: true,
          },
        ],
        adminThumbnail: 'medium',
        mimeTypes: ['image/*'],
        
    },
    fields: []
}

export default Avatares