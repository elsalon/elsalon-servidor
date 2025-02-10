// const UserMentionInEntryHandler = require('./handlers/MencionUsrHandler');
const {
  AprecioEntradaUsuarioHandler,
  AprecioEntradaGrupalHandler,
  AprecioComentarioUsuarioHandler,
  AprecioComentarioGrupalHandler,
} = require('./handlers/Aprecio');

const {
  MencionUsuarioEntradaIndividualHandler,
  MencionUsuarioEntradaGrupalHandler,
  MencionGrupoEntradaIndividualHandler,
  MencionGrupoEntradaGrupalHandler
} = require('./handlers/MencionEntrada');

const {
  MencionUsuarioComentarioIndividualHandler,
  MencionGrupoComentarioGrupalHandler,
  MencionUsuarioComentarioGrupalHandler,
  MencionGrupoComentarioIndividualHandler,
} = require('./handlers/MencionComentario');

const {
  ComentarioGrupalEntradaGrupalHandler,
  ComentarioGrupalEntradaUsuarioHandler,
  ComentarioUsuarioEntradaGrupalHandler,
  ComentarioUsuarioEntradaUsuarioHandler,  
} = require('./handlers/ComentarioNuevo');

const {
  ActividadGrupoNuevaEntradaHandler,
  ActividadGrupoEditoEntradaHandler
} = require('./handlers/ActividadGrupo');


const handlers = {
  // Aprecio
  'aprecio-entrada-usuario':     AprecioEntradaUsuarioHandler,
  'aprecio-entrada-grupal':      AprecioEntradaGrupalHandler,
  'aprecio-comentario-usuario':  AprecioComentarioUsuarioHandler,
  'aprecio-comentario-grupal':   AprecioComentarioGrupalHandler,
  
  // Mencion en Entrada
  'mencion-usuario-entrada-individual': MencionUsuarioEntradaIndividualHandler,
  'mencion-usuario-entrada-grupal':     MencionUsuarioEntradaGrupalHandler,
  'mencion-grupo-entrada-individual':   MencionGrupoEntradaIndividualHandler,
  'mencion-grupo-entrada-grupal':       MencionGrupoEntradaGrupalHandler,
  // Mencion en Comentario
  'mencion-usuario-comentario-individual': MencionUsuarioComentarioIndividualHandler,
  'mencion-grupo-comentario-grupal':       MencionGrupoComentarioGrupalHandler,
  'mencion-usuario-comentario-grupal':     MencionUsuarioComentarioGrupalHandler,
  'mencion-grupo-comentario-individual':   MencionGrupoComentarioIndividualHandler,

  // Comentario
  'comentario-grupal-entrada-grupal':   ComentarioGrupalEntradaGrupalHandler,
  'comentario-usuario-entrada-grupal':  ComentarioUsuarioEntradaGrupalHandler,
  'comentario-grupal-entrada-usuario':  ComentarioGrupalEntradaUsuarioHandler,
  'comentario-usuario-entrada-usuario': ComentarioUsuarioEntradaUsuarioHandler,

  // Actividad de Grupo
  'actividad-grupo-nueva-entrada': ActividadGrupoNuevaEntradaHandler,
  'actividad-grupo-edito-entrada': ActividadGrupoEditoEntradaHandler,
};

export function getHandler(type) {
  const Handler = handlers[type];
  console.log("Geting handler", type)
  if (!Handler) throw new Error(`No handler registered for ${type}`);
  return new Handler();
}