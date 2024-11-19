import { CollectionConfig } from 'payload/types'
import { isAdmin } from '../helper'

const MailQueue: CollectionConfig = {
    slug: 'mailQueue',
    admin: {
        group: 'medios',
        useAsTitle: 'subject',
    },
    labels: {
        singular: 'Mail Queue',
        plural: 'Mails Queue',
    },
    access: {
        read: isAdmin,
        update: isAdmin,
        delete: isAdmin,
    },
    hooks: {
        // beforeChange: [
        //     async ({ operation, data, req }) => {
        //         if(operation === 'create'){
        //             data.autor = req.user.id; // El autor es el usuario actual
        //             return data;
        //         }
        //     },
        //     // TODO revisar que si se esta fijando/desfijando o destacando/desdestacando, se chequee que el usuario sea admin o docente
        // ],
    },
    fields: [
        {
            name: 'to',
            type: 'text',
        },
        {
            name: 'subject',
            type: 'text',
        },
        {
            name: 'body',
            type: 'textarea',
        },
        {
            name: 'status',
            type: 'select',
            options: [
                {
                    label: 'Pendiente',
                    value: 'pending',
                },
                {
                    label: 'Enviado',
                    value: 'sent',
                },
                {
                    label: 'Error',
                    value: 'failed',
                },
            ],
            defaultValue: 'pending',
        },
        {
            name: 'errorMessage',
            type: 'text',
        },
        {
            name: 'retryCount',
            type: 'number',
            defaultValue: 0
        },
        {
            name: 'sentAt',
            type: 'date',
            admin: {
                date: {
                    pickerAppearance: 'dayAndTime'
                }
            }
        },
    ],
}

export default MailQueue;