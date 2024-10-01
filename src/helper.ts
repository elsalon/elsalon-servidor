// Helper functions
import { Access, FieldAccess } from 'payload/types';


// Helper acces function
export const isAutor: Access = ({ req: { user }, id }) => {
    if (!user) return false;
    return {
        'autor': {
            equals: user.id,
        },
    };
};

export const isAdminOrAutor: Access = ({ req: { user }, id }) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return {
        'autor': {
            equals: user.id,
        },
    };
};

export const isAdminOrIntegrante: Access = ({ req: { user }, id }) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return {
        'integrantes': {
            contains: user.id,
        },
    };
};

export const isAdminOrSelf: Access = ({ req: { user }, id }) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return user.id === id;
}

export const isAdmin: Access = ({ req: { user } }) => {
    if (!user) return false;
    return user.isAdmin;
};

export const afterCreateAssignAutorToUser = async ({ operation, data, req }) => {
    if(operation === 'create'){
        data.autor = req.user.id; // El autor es el usuario actual
        return data;
    }
}


export const AddNotificationAprecio = async ({ 
    doc,
    req, // full express request
    previousDoc, // document data before updating the collection
    operation, // name of the operation ie. 'create', 'update'
    }) => {
    if(operation === 'create'){
        console.log("***", doc.entrada.autor.nombre); // El autor de la entrada que fue apreciada
        await req.payload.create({
            collection: 'notificaciones',
            data: {
                autor: doc.entrada.autor.id, // El autor de la entrada que fue apreciada
                tipoNotificacion: 'apreciacion',
                mensaje: `Apreciaron tu entrada <strong>${doc.entrada.extracto}</strong>`,
                leida: false,
                linkTo: doc.entrada.id,
            },
        });
    }
}

const { Parser } = require('htmlparser2');

export const ConvertMentionsToUsers = async ({ operation, data, req }) => {
    const htmlContent = data.contenido;
    let mentions  = [];
    const parser = new Parser({
        onopentag(name, attribs) {
          if (name === "span" && attribs.class === "mention") {
            mentions.push(attribs['data-id']);
          }
        }
      });
      
    parser.write(htmlContent);
    parser.end();
    data.mencionados = mentions;
};