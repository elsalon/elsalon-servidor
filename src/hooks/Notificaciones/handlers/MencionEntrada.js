import { BaseNotificationHandler } from '../BaseNotificationHandler'

/************************************************************
Notificacion cuando un USUARIO MENCIONA OTRO USUARIO EN UNA ENTRADA
**************************************************************/ 
export class MencionUsuarioEntradaIndividualHandler extends BaseNotificationHandler {
  createCategory() { return 'mencion'; }

  // Pasos finales para generar la notificacion
  async getRecipients({ mencionado }) {
    return [mencionado.value.id];
  }

  createIdentidad({ identidad }) {
    return { value: identidad.id, relationTo: 'users' };
  }

  createMessage({ identidad, link }) {
    return `<strong>${identidad.nombre}</strong> te mencionó en <strong>${link.extracto}</strong>`;
  }

  createLink({ link }) {
    return { value: link.id, relationTo: 'entradas' };
  }
}

/************************************************************
Notificacion cuando un GRUPO MENCIONA OTRO USUARIO EN UNA ENTRADA
**************************************************************/ 
export class MencionUsuarioEntradaGrupalHandler extends BaseNotificationHandler{
  createCategory() { return 'mencion'; }

  async getRecipients({ mencionado }) {
    return [mencionado.value.id];
  }

  createIdentidad({ identidad }) {
    return { value: identidad.id, relationTo: 'grupos' };
  }

  createMessage({ identidad, link }) {
    return `<strong>${identidad.nombre}</strong> te mencionó en <strong>${link.extracto}</strong>`;
  }

  createLink({ link }) {
    return { value: link.id, relationTo: 'entradas' };
  }
}

/************************************************************
Notificacion cuando un USUARIO MENCIONA UN GRUPO EN UNA ENTRADA
**************************************************************/ 
export class MencionGrupoEntradaIndividualHandler extends BaseNotificationHandler{
  createCategory() { return 'mencion'; }

  async getRecipients({ mencionado }) {
    if(typeof mencionado.value.integrantes[0] == 'object'){
      return mencionado.value.integrantes.map(i => i.id);
    }
    return mencionado.value.integrantes;
  }

  createIdentidad({ identidad }) {
    return { value: identidad.id, relationTo: 'users' };
  }

  createMessage({ identidad, link, mencionado }) {
    return `<strong>${identidad.nombre}</strong> mencionó a tu grupo <strong>${mencionado.value.nombre}</strong> en <strong>${link.extracto}</strong>`;
  }

  createLink({ link }) {
    return { value: link.id, relationTo: 'entradas' };
  }
}

/************************************************************
Notificacion cuando un GRUPO MENCIONA OTRO GRUPO EN UNA ENTRADA
**************************************************************/ 
export class MencionGrupoEntradaGrupalHandler extends BaseNotificationHandler{
  createCategory() { return 'mencion'; }

  async getRecipients({ mencionado }) {
    if(typeof mencionado.value.integrantes[0] == 'object'){
      return mencionado.value.integrantes.map(i => i.id);
    }
    return mencionado.value.integrantes;
  }

  createIdentidad({ identidad }) {
    return { value: identidad.id, relationTo: 'grupos' };
  }

  createMessage({ identidad, link, mencionado }) {
    return `<strong>${identidad.nombre}</strong> mencionó a tu grupo <strong>${mencionado.value.nombre}</strong> en <strong>${link.extracto}</strong>`;
  }

  createLink({ link }) {
    return { value: link.id, relationTo: 'entradas' };
  }
}