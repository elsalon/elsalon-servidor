import { CollectionConfig } from 'payload'

const Fijadas: CollectionConfig = {
    slug: 'fijadas',
    admin: {
        group: 'Interacciones',
    },
    labels: {
        singular: 'Entrada Fija',
        plural: 'Entradas Fijas',
    },
    access: {
        // update: isAdminOrIntegrante,
        // delete: isAdminOrIntegrante,
    },
    hooks: {
        beforeChange: [
            async ({ operation, data, req }) => {
                if(operation === 'create' && req.user?.id != null){
                    data.autor = req.user.id; // El autor es el usuario actual
                    return data;
                }
            },
            // TODO revisar que si se esta fijando/desfijando o destacando/desdestacando, se chequee que el usuario sea admin o docente
        ],
    },
    fields: [
        {
            name: 'autor',
            type: 'relationship',
            relationTo: 'users',
        },
        {
            name: 'contexto',
            type: 'text',
        },
        {
            name: 'entrada',
            type: 'relationship',
            relationTo: 'entradas',
        },
    ],
}

export default Fijadas;