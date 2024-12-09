import { CollectionConfig } from 'payload'

const Archivos: CollectionConfig = {
    slug: 'archivos',
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
        // staticURL: '/archivos',
        // staticDir: 'archivos',
        mimeTypes: [
            'application/zip',
            'application/rar',
            'application/7zip',
            'application/gif',
            'application/x-zip-compressed',
            'application/vnd.rar',
            'application/x-rar-compressed',
            'application/pdf',
            'application/x-7z-compressed',
            'application/x-tar',
            'application/octet-stream',
        ],
    },
    fields: [
        {
            name: 'uploader',
            type: 'relationship',
            relationTo: 'users',
        }
    ]
}

export default Archivos;