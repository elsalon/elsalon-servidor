import { CollectionConfig } from 'payload/types'

const Grupos: CollectionConfig = {
    slug: 'grupos',
    admin: {
        useAsTitle: 'nombre',
    },
    access: {
        create: ({ req }) => !!req.user,
        read: ({ req }) => !!req.user,
        update: ({ req:{user} }) => {
            if (!user) return false;
            if (user.isAdmin) return true;
            return {
                'integrantes': {
                    contains: user.id,
                },
            }
        },
        delete: ({ req:{user} }) => {
            if (!user) return false;
            if (user.isAdmin) return true;
            return {
                'integrantes': {
                    contains: user.id,
                },
            }
        }
    },
    fields: [
        {
            name: 'nombre',
            type: 'text',
        },
        {
            name: 'avatar',
            type: 'upload',
            relationTo: 'avatares',
        },
        {
            name: 'integrantes',
            type: 'relationship',
            relationTo: 'users',
            hasMany: true,
        },
        {
            name: 'contexto',
            type: 'relationship',
            relationTo: 'salones',
        }
    ]
}

export default Grupos;