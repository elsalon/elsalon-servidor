// Helper functions
import { Access, FieldAccess } from 'payload/types';
import payload from 'payload';


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

export const DetectarMenciones = async ({ operation, data, req }) => {
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
    return data;
};

export const NotificarMencionados = async ({
    doc, // full document data
    req, // full express request
    previousDoc, // document data before updating the collection
    operation, // name of the operation ie. 'create', 'update'
}) => {
    if(operation === 'create'){
        // console.log('NotificarMencionados', doc);
        doc.mencionados.forEach(async (mencionado) => {
            CrearNotificacionMencion(mencionado, doc)
        });
    }else if (operation === 'update'){
        let viejosMencionados = previousDoc.mencionados.map(m => m.id);
        let nuevosMencionados = doc.mencionados.map(m => m.id).filter(m => !viejosMencionados.includes(m));
        nuevosMencionados.forEach(async (mencionado) => {
            CrearNotificacionMencion(mencionado, doc)
        });
    }
};

const CrearNotificacionMencion = async(mencionado, doc) => {
    await payload.create({
        collection: 'notificaciones',
        data: {
            autor: mencionado.id,
            tipoNotificacion: 'mencion',
            mensaje: `<strong>${doc.autor.nombre }</strong> te mencionó en su entrada <strong>${doc.extracto}</strong>`,
            leida: false,
            linkTo: doc.id,
        },
    });
}
