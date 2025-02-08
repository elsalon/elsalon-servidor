// const UserMentionInEntryHandler = require('./handlers/MencionUsrHandler');
const {AprecioEntradaIndividualHandler} = require('./handlers/Aprecio');


const handlers = {
  //  Aprecio
  'aprecio-entrada-individual': AprecioEntradaIndividualHandler,

  // Mentions
  // 'mencion-usuario-entrada': UserMentionInEntryHandler,
  // 'mencion-grupo-comentario': GroupMentionInCommentHandler,

  // // Group Activities
  // 'grupo-integrante-nuevo': NewGroupMemberHandler,

  // Add more handlers here...
};

export function getHandler(type) {
  const Handler = handlers[type];
  if (!Handler) throw new Error(`No handler registered for ${type}`);
  return new Handler();
}