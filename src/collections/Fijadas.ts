import { CollectionConfig } from 'payload/types'

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
                if(operation === 'create'){
                    data.autor = req.user.id; // El autor es el usuario actual
                    // console.log('data', data);
                    let vencimiento = new Date();
                    if(data.duracion){
                        switch(data.duracion){
                            case "dia":
                                vencimiento.setDate(vencimiento.getDate() + 1);
                                break;
                            case "semana":
                                vencimiento.setDate(vencimiento.getDate() + 7);
                                break;
                            case "mes":
                                vencimiento.setMonth(vencimiento.getMonth() + 1);
                                break;
                            case "anno":
                                // Ultimo dia del año
                                vencimiento.setMonth(11);
                                vencimiento.setDate(31);
                                break;
                            default:
                                // Default una semana
                                vencimiento.setDate(vencimiento.getDate() + 7);
                        }
                    }else{
                        // Default una semana
                        vencimiento.setDate(vencimiento.getDate() + 7);
                    }
                    data.vencimiento = vencimiento;
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
        {
            name: 'vencimiento',
            type: 'date',
        }
    ],
}

export default Fijadas;