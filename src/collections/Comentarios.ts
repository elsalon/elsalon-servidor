import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor } from '../helper'

const Comentarios: CollectionConfig = {
    slug: 'comentarios',
    access:{
        update: isAdminOrAutor,
        delete: isAdminOrAutor,
    },
    fields: []
}

export default Comentarios;