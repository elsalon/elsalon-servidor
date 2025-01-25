import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor, CrearExtracto, ValidarEntradaVacia } from '../helper'
import { NotificarNuevaEntrada, NotificarMencionEntrada } from '../GeneradorNotificacionesWeb'
import { Campos } from './CamposEntradasYComentarios'
import payload from 'payload'

const Entradas: CollectionConfig = {
    slug: 'entradas',
    access:{
        update: isAdminOrAutor,
        delete: isAdminOrAutor,
    },
    hooks: {
        beforeChange: [
            ValidarEntradaVacia,
            CrearExtracto,
            async ({ operation, data, req }) => {
                if(operation === 'create' && req.user){
                    data.autor = req.user.id; // El autor es el usuario actual
                    return data;
                }
            },
            // TODO revisar que si se esta fijando/desfijando o destacando/desdestacando, se chequee que el usuario sea admin o docente
        ],
        afterChange: [
            NotificarNuevaEntrada,
            NotificarMencionEntrada,
        ],
        afterRead: [
            async ({ doc }) => {
                // Fetch de los comentarios
                var comentarios = await payload.find({
                    collection: 'comentarios',
                    where: {
                        entrada: {
                            equals: doc.id,
                        },
                    },
                    limit: 3,
                    sort: '-createdAt',
                });
                comentarios.docs = comentarios.docs.length ? comentarios.docs.reverse() : [];
                doc.comentarios = comentarios;
            }
        ]
    },
    admin: {
        group: 'Interacciones',
    },
    fields: [
        ...Campos,
        {
            name: 'sala',
            type: 'relationship',
            relationTo: 'salones',
        },
        {
            name: 'destacada',
            type: 'checkbox',
        },
    ],
}

export default Entradas