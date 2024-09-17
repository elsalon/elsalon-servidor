import { CollectionConfig } from 'payload/types'

const Archivos: CollectionConfig = {
    slug: 'archivos',
    access: {
        read: () => true,
    },
    
    admin: {
        group: 'Medios',
    },
    upload: {
        staticURL: '/archivos',
        staticDir: 'archivos',
        mimeTypes: [
            'application/zip',
            'application/x-zip-compressed',
            'application/vnd.rar',
            'application/x-rar-compressed',
            'application/pdf',
            'application/x-7z-compressed',
            'application/x-tar',
        ],
    },
    fields: []
}

export default Archivos;