import { CollectionConfig, GlobalConfig } from 'payload'

const Ajustes: GlobalConfig = {
    slug: 'ajustes',
    access: {
        read: () => true,
    },
    hooks:{
    },
    admin: {
        // group: 'Medios',
    },
    fields: []
}

export default Ajustes