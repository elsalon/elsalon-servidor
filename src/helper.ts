// Helper functions
import { Access, FieldAccess } from 'payload/types';
import payload from 'payload';
import { EnviarMailMencion } from './GeneradorNotificacionesMail';
import { NotificarMencionEntrada, NotificarMencionComentario } from './GeneradorNotificacionesWeb';

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

export const isAdminOrDocente: Access = ({ req: { user }, id }) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    if (user.rol == 'docente') return true;
}

export const isAdmin: Access = ({ req: { user } }) => {
    if (!user) return false;
    return user.isAdmin;
};

export const afterCreateAssignAutorToUser = async ({ operation, data, req }) => {
    if (operation === 'create' && req.user) {
        data.autor = req.user.id; // El autor es el usuario actual
        return data;
    }
}


export const GetNuevosMencionados = async ({ doc, previousDoc, operation }) => {
    // CREATE
    if (operation === 'create') return doc.mencionados;

    // UPDATE
    if (!previousDoc.mencionados?.length && !doc.mencionados?.length) return [];
    let viejosMencionados = previousDoc.mencionados.map(m => m.id);
    let nuevosMencionados = doc.mencionados.map(m => m.id).filter(m => !viejosMencionados.includes(m));
    return nuevosMencionados;
}

// export const HandleMencionados = async ({
//     doc, // full document data
//     req, // full express request
//     previousDoc, // document data before updating the collection
//     operation, // name of the operation ie. 'create', 'update'
// }) => {
//     const collection = req.collection.config.slug;
//     if(operation === 'create'){
//         doc.mencionados?.forEach(async (mencionado) => {
//             if(collection == "comentarios"){
//                 NotificarMencionComentario(mencionado, doc);
//             // NotificarMencion(mencionado, doc, collection)
//             EnviarMailMencion(mencionado, doc, collection);
//         });
//     }else if (operation === 'update'){
//         let viejosMencionados = previousDoc.mencionados.map(m => m.id);
//         let nuevosMencionados = doc.mencionados.map(m => m.id).filter(m => !viejosMencionados.includes(m));
//         nuevosMencionados.forEach(async (mencionado) => {
//             NotificarMencion(mencionado, doc, collection)
//             EnviarMailMencion(mencionado, doc, collection);
//         });
//     }
// };

export const CrearExtracto = async ({ operation, data, req, context }) => {
    if (context.skipHooks) return data;
    if (operation === 'create' || operation === 'update') {
        let text = data.contenido;

        // Remove custom images tag
        text = text.replace(/\[image:[a-f0-9]+\]/g, '');

        // Function to convert mentions and hashtags to plain text
        const convertToPlainText = (content, regex, caracter) => {
            return content.replace(regex, (match, name) => caracter + name);
        }

        // Updated regex patterns
        const mentionRegex = /\[([^\]]+)\]\(mencion:[a-zA-Z0-9]+\)/g;
        const tagRegex = /\[([^\]]+)\]\(etiqueta:[a-zA-Z0-9]+\)/g;

        // Convert mentions and hashtags to plain text
        text = convertToPlainText(text, mentionRegex, "@");
        text = convertToPlainText(text, tagRegex, "#");

        // Remove HTML tags and get first 120 characters
        text = text?.replace(/<[^>]*>?/gm, '').substring(0, 120);

        data.extracto = text;
        return data;
    }
}

export const ValidarEntradaVacia = async ({ context, operation, data, req }) => {
    if (context.skipHooks) return data;
    var entradaVacia = true;
    if (data.contenido == "<p><br></p>") {
        data.contenido = "";
    } else {
        entradaVacia = false;
    }
    if (data.imagenes.length > 0) {
        entradaVacia = false;
    }
    if (data.archivos.length > 0) {
        entradaVacia = false;
    }
    if (entradaVacia) {
        throw new Error('La entrada no puede estar vacía');
    }
}

export const PublicadasYNoBorradas: Access = ({ req }) => {
    if (!req.user) return false;

    const reqIsAdminSite = req.headers?.referer?.includes('/admin') === true;

    if (reqIsAdminSite) {
        return true;
    }

    return {
        isDeleted: {
            not_equals: true,
        }
        // Dejo esto comentado por si en algun momento queremos 
        // volver a habilitar drafts
        //
        // and: [
        //     {
        //         _status: {
        //             equals: 'published',
        //         }
        //     },
        //     {
        //         isDeleted: {
        //             not_equals: true,
        //         }
        //     }
        // ]
    };
}

export const SoftDelete  = (collection: string) => {
 return async (req, res) => {
      const { id } = req.params;
      const { user } = req;
      if (!user) {
        res.status(401).json({
          message: 'Unauthorized no user',
        });
        return;
      }

      const reqIsAdminSite = req.headers?.referer?.includes('/admin') === true;
      if(reqIsAdminSite){
          // Lo borramos en serio
          await req.payload.delete({
              collection,
              id,
          });
          return;
      }
      
      const doc = await req.payload.findByID({
          collection,
          id,
      });
      if(!doc){
          res.status(404).json({
              message: 'Document not found',
          });
          return;
      }
      if(doc.isDeleted){
          res.status(404).json({
              message: 'Document already deleted',
          });
          return;
      }
      if(doc.autoriaGrupal){
            const integrantesIds = doc.grupo?.integrantes?.map(i => i.id);
          if(!integrantesIds.includes(user.id)){
              res.status(401).json({
                  message: 'Unauthorized not integrante',
              });
              return;
          }
      }else{
          if(doc.autor.id != user.id){
              res.status(401).json({
                  message: 'Unauthorized not autor',
              });
              return;
          }
      }
      
      await req.payload.update({
        collection,
        id,
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user?.id,
        },
      });
      
      res.status(200).json({
        message: 'Document deleted successfully',
        doc: { id }
      });
    }
}
  