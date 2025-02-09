// const UserMentionInEntryHandler = require('./handlers/MencionUsrHandler');
const {
  AprecioEntradaIndividualHandler,
  AprecioEntradaGrupalHandler,
  AprecioComentarioIndividualHandler,
  AprecioComentarioGrupalHandler,
} = require('./handlers/Aprecio');

const {
  MencionUsuarioEntradaIndividualHandler,
  MencionUsuarioEntradaGrupalHandler,
  MencionGrupoEntradaIndividualHandler,
  MencionGrupoEntradaGrupalHandler
} = require('./handlers/MencionEntradas');


const handlers = {
  //  Aprecio
  'aprecio-entrada-individual':     AprecioEntradaIndividualHandler,
  'aprecio-entrada-grupal':         AprecioEntradaGrupalHandler,
  'aprecio-comentario-individual':  AprecioComentarioIndividualHandler,
  'aprecio-comentario-grupal':      AprecioComentarioGrupalHandler,
  
  // Menciones
  'mencion-usuario-entrada-individual': MencionUsuarioEntradaIndividualHandler,
  'mencion-usuario-entrada-grupal':     MencionUsuarioEntradaGrupalHandler,
  'mencion-grupo-entrada-individual':   MencionGrupoEntradaIndividualHandler,
  'mencion-grupo-entrada-grupal':       MencionGrupoEntradaGrupalHandler,
  // // Group Activities
  // 'grupo-integrante-nuevo': NewGroupMemberHandler,

  // Add more handlers here...
};

export function getHandler(type) {
  const Handler = handlers[type];
  console.log("Geting handler", type)
  if (!Handler) throw new Error(`No handler registered for ${type}`);
  return new Handler();
}