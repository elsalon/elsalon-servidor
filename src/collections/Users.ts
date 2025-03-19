import { isAdminOrSelf, SacarEmojis } from '../helper';
import { SlugField } from '../SlugField'
import { simpleEmailTemplate } from '../emailTemplates'
import payload from 'payload';
import { CollectionConfig } from 'payload/types';
import { notificationService } from '../globals';

const mailVerify = {
  generateEmailSubject: ({ req, user }) => {
    return `Verificá tu cuenta de El Salón`;
  },
  generateEmailHTML: ({ req, token, user }: { req: any, token: string, user: { nombre: string } }) => {
    // Use the token provided to allow your user to verify their account
    const frontUrl = req.headers.origin;

    return simpleEmailTemplate({
      baseUrl: frontUrl,
      title: `Hola ${user.nombre}, verifica tu cuenta`,
      content: `<p>Para verificar tu cuenta de El Salón, clickeá en este link</p>
      <p><a target="_blank" href="${frontUrl}/verificar?t=${token}">Verificar cuenta</a></p>`
    });
  },
}

const Users:CollectionConfig = {
  slug: 'users',
  auth: {
    // 1 mes
    tokenExpiration: 1000 * 60 * 60 * 24 * 30,
    maxLoginAttempts: 7,
    lockTime: 1000 * 60, // 1 minute
    verify: process.env.DISABLE_EMAIL_VERIFICATION ? false : mailVerify,
    forgotPassword: {
      generateEmailSubject: ({ req, user }) => {
        return `Restablacé tu contraseña de El Salón`;
      },
      generateEmailHTML: ({ req, token, user }: { req: any, token: string, user: { nombre: string } }) => {
        const frontUrl = req.headers.origin;

        return simpleEmailTemplate({
          baseUrl: frontUrl,
          title: `Hola ${user.nombre}, restablacé tu contraseña`,
          content: `<p>Para restablecer tu contraseña de El Salón, clickeá en este link</p>
            <p><a target="_blank" href="${frontUrl}/recuperar?t=${token}">Restablecer contraseña</a></p>`
        });
      },
    }
  },
  admin: {
    useAsTitle: 'nombre',
    listSearchableFields: ['nombre'],
  },
  // anyone can create user. data is only accessible to the user who created it
  access: {
    admin: ({ req }) => req.user && req.user.isAdmin,
    create: () => { return true },
    read: ({ req }) => {
      if (req.user) {
        return {
          user: req.user.id,
        }
      }
      return false
    },
    update: ({ req }) => {
      if (req.user) {
        return {
          user: req.user.id,
        }
      }
      return false
    },
    delete: ({ req }) => {
      if (req.user) {
        return {
          user: req.user.isAdmin,
        }
      }
      return false
    },
  },

  hooks: {
    beforeChange: [
      async ({ data }) => {
        // Saco los emojis del nombre
        if (data.nombre) {
          data.nombre = SacarEmojis(data.nombre);
        }
        return data;
      },
    ]
  },

  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      access: {
        read: ({ doc, req }) => {
          // Handle cases where req.user or doc might be undefined
          if (!req.user || !doc) return false;

          // If it's their own profile, they can see it
          if (req.user.id && doc.id && req.user.id === doc.id) return true;

          // If they're an admin, they can see it
          if (req.user.isAdmin) return true;

          // Otherwise, check mostrarEmail flag
          return Boolean(doc.mostrarEmail);
        }
      },
      admin: {
        // Always show in admin UI
        readOnly: false,
      }
    },

    {
      name: 'rol',
      type: 'select',
      options: [
        {
          label: 'Alumno',
          value: 'alumno',
        },
        {
          label: 'Docente',
          value: 'docente',
        },
      ],
      defaultValue: 'alumno',
    },

    {
      name: 'nombre',
      type: 'text',
      index: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'avatares',
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    {
      name: 'link',
      type: 'text',
    },
    {
      name: 'mostrarEmail',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'lecturaNotificaciones',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      access: {
        read: isAdminOrSelf,
        update: isAdminOrSelf,
      },
    },
    {
      name: 'fechaOnboarding',
      type: 'date',
      // default to 0
      defaultValue: () => new Date('1989-01-02').toISOString(),
      access: {
        read: isAdminOrSelf,
        update: isAdminOrSelf,
      },
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'notificacionesMail',
      type: 'group',
      access: {
        read: isAdminOrSelf,
        update: isAdminOrSelf,
      },
      fields: [
        {
          name: 'activas',
          type: 'checkbox',
          defaultValue: true,
        },
        // {
        //   name: 'enlaceNuevo',
        //   type: 'checkbox',
        //   defaultValue: true,
        //   // Recibir notificacion cuando alguien se enlaza
        // },
        // {
        //   name: 'grupoNuevo',
        //   type: 'checkbox',
        //   defaultValue: true,
        //   // Recibir notificacion cuando alguien te agrega a un grupo
        // },
        {
          name: 'mencionNueva',
          type: 'checkbox',
          defaultValue: true,
          // Recibir notificacion cuando alguien te menciona en un post
        },
        // {
        //   name: 'aprecioNuevo',
        //   type: 'checkbox',
        //   defaultValue: true,
        //   // Recibir notificacion cuando alguien aprecia tu post
        // },
        {
          name: 'comentarioNuevo',
          type: 'checkbox',
          defaultValue: true,
          // Recibir notificacion cuando alguien comenta tu post
        }
      ],
    },
      type: 'group',
      access: {
        read: isAdminOrSelf,
        update: isAdminOrSelf,
      },
      fields: [
        {
        }
      ]
    },
    SlugField(),
    {
      name: 'isAdmin',
      type: 'checkbox',
      admin: {
        position: 'sidebar',
      },
      access: {
        update: ({ req }) => {
          if (req.user) {
            return req.user.isAdmin
          }
          return false
        }
      }
    },
  ],
  endpoints: [
    {
      path: '/:id/cambiar-rol',
      method: "patch",
      handler: async (req, res) => {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        if (!req.user.rol as any === 'docente') return res.status(401).json({ error: 'Unauthorized rol' });
        const rol = req.body.rol;
        if (!rol) {
          return res.status(404).json({ error: 'Rol no proporcionado' });
        }

        try {
          const { id } = req.params;
          const user = await payload.findByID({
            collection: 'users',
            id,
          })
          if (!user) {
            return res.status(404).json({ error: 'No se encontró ese usuario' });
          }
          payload.logger.info("Cambiando rol usuario " +  user.nombre + " - " + user.id + " - " + rol);
          const result = await payload.update({
            collection: 'users',
            id,
            data: { rol },
          });
          if(result.rol === 'docente'){
            notificationService.triggerNotification('otorgo-docente', {identidad: req.user, link: req.user, usuario: result})
          }
          return res.status(200).json(result)

        } catch (e) {
          payload.logger.warn("Error cambiando rol: " + e)
        }
      }
    },
    {
      path: '/:id/toggle-admin',
      method: "patch",
      handler: async (req, res) => {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        if (!req.user.isAdmin) return res.status(401).json({ error: 'Unauthorized not admin' });
        
        try {
          const { id } = req.params;
          const user = await payload.findByID({
            collection: 'users',
            id,
          })
          if (!user) {
            return res.status(404).json({ error: 'No se encontró ese usuario' });
          }
          const isAdmin = !user.isAdmin // Toggle
          payload.logger.info("Cambiando status admin " + user.nombre + " " + user.id + " " + isAdmin);
          let result = await payload.update({
            collection: 'users',
            id,
            data: { isAdmin },
          })
          result.isAdmin = isAdmin
          return res.status(200).json(result)

        } catch (e) {
          payload.logger.warn("Error toggle admin: " + e)
        }
      }
    }
  ]
}

export default Users
