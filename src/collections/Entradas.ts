import { CollectionConfig } from 'payload/types'

const Entradas: CollectionConfig = {
    slug: 'entradas',
    access:{
        // create if logged in
        create: ({ req }) => !!req.user,
        read: ({ req }) => !!req.user,
        // update if logged in and is author
        update: ({ req, data }) => !!req.user && req.user.id === data.autor,
        // delete if logged in and is author
        delete: ({ req, data }) => !!req.user && req.user.id === data.autor,
    },
    hooks: {
        beforeChange: [
            async ({ operation, data, req }) => {
                if(operation === 'create'){
                    // console.log('New entry created', data);
                    data.autor = req.user.id; // El autor es el usuario actual
                    return data;
                }
            }
        ]
    },
    fields: [
        {
            name: 'autoriaGrupal',
            type: 'checkbox',
        },
        {
            name: 'autor',
            type: 'relationship',
            relationTo: 'users',
            hasMany: false,
        },
        {
            name: 'contenido',
            type: 'textarea',
        }
    ]
}

export default Entradas