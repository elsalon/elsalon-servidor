import { CollectionConfig } from 'payload/types'

const Avatares: CollectionConfig = {
    slug: 'avatares',
    access: {
        create: ({ req }) => !!req.user,
        read: () => true,
    },
    upload: {
        staticURL: '/avatares',
        staticDir: 'avatares',
        imageSizes: [
          {
            name: 'thumbnail',
            width: 40,
            height: 40,
            position: 'centre',
            withoutEnlargement: true,
          },
          {
            name: 'tablet',
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
        adminThumbnail: 'tablet',
        mimeTypes: ['image/*'],
        
    },
    fields: []
}

export default Avatares