import { isAdminOrSelf, isAdmin } from '../helper';
import { SlugField } from '../SlugField'
import { simpleEmailTemplate } from '../emailTemplates'
import { CollectionConfig, PayloadRequest, User } from 'payload';

const mailVerify = {
  generateEmailSubject: () => {
    return `Verificá tu cuenta de El Salón`;
  },
  generateEmailHTML: ({ token, user } : {token: string, user: User}) => {
    // Use the token provided to allow your user to verify their account
    const backendUrl = process.env.NEXT_PUBLIC_SERVER_URL || "" 
    const frontUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || ""

    return simpleEmailTemplate({
      backendUrl: backendUrl,
      title: `Hola ${user.nombre}, verifica tu cuenta`,
      content: `<p>Para verificar tu cuenta de El Salón, clickeá en este link</p>
      <p><a target="_blank" href="${frontUrl}/verificar?t=${token}">Verificar cuenta</a></p>`
    });
  },
}

const Users : CollectionConfig = {
  slug: 'users',
  auth: {
    // 1 mes
    tokenExpiration: 1000 * 60 * 60 * 24 * 30,
    maxLoginAttempts: 7,
    lockTime: 1000 * 60, // 1 minute
    verify: process.env.DISABLE_EMAIL_VERIFICATION ? false : mailVerify,
    forgotPassword: {
      generateEmailSubject: () => {
        return `Restablacé tu contraseña de El Salón`;
      },
      generateEmailHTML: (args?: { req?: PayloadRequest; token?: string; user?: any }) => {
        if (!args) return '';
        
        const { token, user } = args;
      
        if (!token || !user) return ''; // Verifica que existan token y user
      
        const backendUrl = process.env.NEXT_PUBLIC_SERVER_URL || "";
        const frontUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "";
        
        return simpleEmailTemplate({
          backendUrl: backendUrl,
          title: `Hola ${user.nombre}, restablacé tu contraseña`,
          content: `<p>Para restablecer tu contraseña de El Salón, clickeá en este link</p>
            <p><a target="_blank" href="${frontUrl}/recuperar?t=${token}">Restablecer contraseña</a></p>`,
        });
      }
    }
  },
  admin: {
    useAsTitle: 'nombre',
  },
  // anyone can create user. data is only accessible to the user who created it
  access: {
    admin: ({ req }) => Boolean(req.user) && Boolean(req.user?.isAdmin),
    create: () => { return true },
    read: ({ req: { user } }) => {
      return !!user; // Return true if the user is logged in
    },
    update: isAdminOrSelf,
    delete: isAdmin,
  },

  hooks: {
  },

  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      access: {
        read: ({ doc, req } : { 
          doc?: { 
            id?: string, 
            mostrarEmail?: boolean 
          }, 
          req: PayloadRequest
        })  => {
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
      name: 'notificacionesMail',
      type: 'group',
      access: {
        read: ({ req: { user }, id }) => {
          if (!user) return false;
          if (user.isAdmin) return true;
          return user.id === id;
        },
      },
      fields: [
        {
          name: 'activas',
          type: 'checkbox',
          defaultValue: true,
        },
        // {
        //   name: 'colaboradorNuevo',
        //   type: 'checkbox',
        //   defaultValue: true,
        //   // Recibir notificacion cuando alguien te sigue
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
    SlugField({collection: 'users'}),
    {
      name: 'isAdmin',
      type: 'checkbox',
      admin: {
        position: 'sidebar',
      },
      access: {
        update:({req:{user}}) => {
          if (user) {
            return user.isAdmin || false
          }
          return false
        }
      }
    },
  ],
}

export default Users
