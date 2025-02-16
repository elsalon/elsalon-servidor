// Helper functions
import { Access, FieldAccess } from 'payload/types';
import payload from 'payload';

const trimHtml = (html) => {
    return html
        // Remove empty paragraphs or paragraphs with just a line break
        .replace(/<p>\s*<br>\s*<\/p>/g, '')
        .replace(/<p>\s*<\/p>/g, '')
        // Remove leading/trailing whitespace within paragraphs
        .replace(/<p>\s+/g, '<p>')
        .replace(/\s+<\/p>/g, '</p>')
        // Trim the whole string
        .trim();
}

export const LimpiarContenido = async ({ data }) => {
    data.contenido = trimHtml(data.contenido);
    return data;
}

export const SacarEmojis = (texto: string) => {
    return texto.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
}

// Helper acces function
export const isLoggedIn: Access = ({ req: user }) => {
    console.log("is logged in", Boolean(user));
    return Boolean(user)
};

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

export const isAdminOrIntegrante: Access = ({ req: { user } }) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return {
        'integrantes': {
            contains: user.id,
        },
    };
};
export const isAdminAutorOrIntegrante: Access = ({ req: { user } }) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return {
        or: [
            {
                'autor': {
                    equals: user.id,
                },
            },
            {
                'grupo.integrantes': {
                    contains: user.id,
                },
            },
        ]
    }
}
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
    // console.log(previousDoc.mencionados, doc.mencionados);
    if (!previousDoc.mencionados?.length && !doc.mencionados?.length) return [];
    let viejosMencionados = previousDoc.mencionados.map(m => m.value);
    let nuevosMencionados = doc.mencionados.filter(m => !viejosMencionados.includes(m.value.id));
    return nuevosMencionados;
}


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
        const mentionGrupoRegex = /\[([^\]]+)\]\(grupo:[a-zA-Z0-9]+\)/g;
        const mentionUserRegex = /\[([^\]]+)\]\(usuario:[a-zA-Z0-9]+\)/g;
        const tagRegex = /\[([^\]]+)\]\(etiqueta:[a-zA-Z0-9]+\)/g;

        // Convert mentions and hashtags to plain text
        text = convertToPlainText(text, mentionGrupoRegex, "@");
        text = convertToPlainText(text, mentionUserRegex, "@");
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
export const DestacarEntrada = async (req, res, next) => {
    try{
        const { id } = req.params;
        const { user } = req;
        console.log("Destacar", user.nombre, user.rol, user.isAdmin, id)
        if (!user) {
            return res.status(401).json({
                message: 'Unauthorized no user',
            });
        }

        if(user.rol !== 'docente' && !user.isAdmin){
            return res.status(401).json({
                message: 'Unauthorized usuario no es admin ni docente',
            });
        }

        const entrada:any = await payload.findByID({
            collection: 'entradas',
            id
        })
        if(!entrada){
            return res.status(500).json({
                message: `Entrada ${id} no encontrada`
            })
        }
        const update = await payload.update({
            collection: 'entradas',
            id,
            data: {
                destacada: !entrada.destacada
            }
        })
        payload.logger.info(`Entrada destacada ${id} por ${req.user.nombre}`)
        return res.status(200).json(update);
    
    }catch(e){
        payload.logger.error("Error destacando entrada: " + e)
    }
}

export const SoftDelete = (collection: string) => {
    try {
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
            if (reqIsAdminSite) {
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
                overrideAccess: false,
                user: req.user,
            });
            if (!doc) {
                res.status(404).json({
                    message: 'Document not found',
                });
                return;
            }
            if (doc.isDeleted) {
                res.status(404).json({
                    message: 'Document already deleted',
                });
                return;
            }
            if (doc.autoriaGrupal) {
                const integrantesIds = doc.grupo?.integrantes?.map(i => i.value.id);
                if (!integrantesIds.includes(user.id)) {
                    res.status(401).json({
                        message: 'Unauthorized not integrante',
                    });
                    return;
                }
            } else {
                if (doc.autor.id != user.id) {
                    res.status(401).json({
                        message: 'Unauthorized not autor',
                    });
                    return;
                }
            }
            
            await req.payload.update({
                collection,
                id,
                overrideAccess: false,
                user: req.user,
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    deletedBy: req.user?.id,
                },
            });
            
            // Si es una entrada, borramos si esta fijada
            if (collection == 'entradas') {
                await req.payload.delete({
                    collection: 'fijadas',
                    where: {
                        entrada: {equals: id},
                    },
                });
            }

            res.status(200).json({
                message: 'Document deleted successfully',
                doc: { id }
            });
        }
    } catch (e) {
        console.log("Error en soft delete", e);
    }
}


export const PopulateComentarios = async ({ doc, context, req }) => {
    // Fetch de los comentarios
    if (context.skipHooks) return;
    if(!req.user) return;
    
    var comentarios = await payload.find({
        collection: 'comentarios',
        where: {
            entrada: {
                equals: doc.id,
            },
        },
        overrideAccess: false,
        user: req.user,
        limit: 3,
        sort: '-createdAt',
    });
    comentarios.docs = comentarios.docs.length ? comentarios.docs.reverse() : [];
    doc.comentarios = comentarios;
}

export const PopulateAprecios = async ({ doc, context, req }) => {
    if(!req.user) return;
    if (context.skipHooks) return;

    var aprecios = await payload.find({
        collection: 'aprecio',
        where: {
            contenidoid: {
                equals: doc.id,
            },
        },
        overrideAccess: false,
        user: req.user,
        limit: 3,
        depth: 1,
        sort: '-createdAt',
    });
    // console.log("populate aprecios", doc.id);
    aprecios.docs.forEach((aprecio) => {
        // Reducimos el objeto
        const autor = aprecio.autor as { id: string; nombre: string };
        aprecio.autor = { id: autor.id, nombre: autor.nombre };
    });
    doc.aprecios = aprecios;
}

export const ActualizarActividadEntrada = (entrada) => {
    console.log("Actualizanod lastActivity", entrada.id)
    payload.update({
        collection: 'entradas',
        id: entrada.id,
        data:{
            lastActivity: new Date()
        }
    })
}