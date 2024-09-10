// Helper functions

import { Access, FieldAccess } from 'payload/types';


// Helper acces function
export const isAdminOrAutor: Access = ({ req: { user }, id }) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return {
        'autor': {
            equals: user.id,
        },
    };
};

export const isAdminOrSelf: Access = ({ req: { user }, id }) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return user.id === id;
}

export const isAdmin: Access = ({ req: { user } }) => {
    if (!user) return false;
    return user.isAdmin;
};