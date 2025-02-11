import { isAdminOrSelf, SacarEmojis } from '../helper';
import { SlugField } from '../SlugField'
import { simpleEmailTemplate } from '../emailTemplates'

const mailVerify = {
  generateEmailSubject: ({ req, user }) => {
    return `Verificá tu cuenta de El Salón`;
  },
  generateEmailHTML: ({ req, token, user }) => {
    // Use the token provided to allow your user to verify their account
    const backendUrl = `${req.protocol}://${req.get('host')}`; // Dynamically obtain the backend URL
    const frontUrl = req.headers.origin;

    return simpleEmailTemplate({
      backendUrl: backendUrl,
      title: `Hola ${user.nombre}, verifica tu cuenta`,
      content: `<p>Para verificar tu cuenta de El Salón, clickeá en este link</p>
      <p><a target="_blank" href="${frontUrl}/verificar?t=${token}">Verificar cuenta</a></p>`
    });
  },
}

const Users = {
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
      generateEmailHTML: ({ req, token, user }) => {
        const backendUrl = `${req.protocol}://${req.get('host')}`; // Dynamically obtain the backend URL
        const frontUrl = req.headers.origin;

        return simpleEmailTemplate({
          backendUrl: backendUrl,
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
      name: 'lectura_notificaciones',
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
}

export default Users
