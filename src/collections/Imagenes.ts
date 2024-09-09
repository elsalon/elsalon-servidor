import { CollectionConfig } from 'payload/types'

const Imagenes: CollectionConfig = {
    slug: 'imagenes',
    access: {
        create: ({ req }) => !!req.user,
        read: () => true,
    },
    upload: {
        staticURL: '/imagenes',
        staticDir: 'imagenes',
        imageSizes: [
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
            {
                name: 'high',
                width: undefined,
                height: 1000,
                position: 'centre',
                withoutEnlargement: true,
            }
        ],
        adminThumbnail: 'medium',
        mimeTypes: ['image/*'],
        
    },
    fields: [
        {
            name: 'uploader',
            type: 'relationship',
            relationTo: 'users',
        }
    ]
}

export default Imagenes