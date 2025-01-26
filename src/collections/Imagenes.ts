import { CollectionConfig } from 'payload/types'

const Imagenes: CollectionConfig = {
    slug: 'imagenes',
    access: {
        read: () => true,
    },
    hooks:{
        beforeChange: [
            async ({ operation, data, req }) => {
                if(operation === 'create' && req.user){
                    // console.log('New entry created', data);
                    data.uploader = req.user.id; // El autor es el usuario actual
                    return data;
                }
            }
        ]
    },
    admin: {
        group: 'Medios',
    },
    upload: {
        staticURL: '/imagenes',
        staticDir: 'imagenes',
        imageSizes: [
            {
                name: 'medium',
                width: 500,
                height: undefined,
                withoutEnlargement: true,
            },
            {
                name: 'thumbnail',
                width: 200,
                // By specifying `undefined` or leaving a height undefined,
                // the image will be sized to a certain width,
                // but it will retain its original aspect ratio
                // and calculate a height automatically.
                height: undefined,
                position: 'centre',
                withoutEnlargement: true,
            },
        ],
        adminThumbnail: 'thumbnail',
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