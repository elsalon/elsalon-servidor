import { BaseNotificationHandler } from '../BaseNotificationHandler'

export class OtorgoRolDocenteHandler extends BaseNotificationHandler{
  createCategory() { return 'rol-docente'; }

  async getRecipients({ usuario }) {
    return [usuario.id];
  }

  createIdentidad({ identidad }) {
    return { value: identidad.id, relationTo: 'grupos' };
  }

  createMessage({ identidad }) {
    return `<strong>${identidad.nombre}</strong> te otorgó el rol <strong>docente</strong>`;
  }

  createLink({ identidad }) {
    return { value: identidad.id, relationTo: 'users' };
  }
}