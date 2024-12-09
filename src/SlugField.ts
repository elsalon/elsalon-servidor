import slugify from 'slugify';
import { Field } from 'payload';

/**
 * Creates a slug field that automatically generates from another field
 * @param {Object} options Configuration options
 * @param {string} options.sourceField The field name to generate the slug from (default: 'title')
 * @param {string} options.slugField The name of the slug field (default: 'slug')
 * @param {Object} options.slugify Slugify options (optional)
 * @param {Object} options.admin Additional admin config (optional)
 * @returns {Field} PayloadCMS field configuration
 */
export const SlugField = ({
    sourceField = 'nombre',
    slugField = 'slug',
    slugify: slugifyOptions = { lower: true, strict: true, replacement: '-' },
    admin = {},
    collection = 'users',
}: {
    sourceField?: string;
    slugField?: string;
    slugify?: object;
    admin?: Record<string, unknown>;
    collection?: any;
} = {}): Field => ({
    type: 'text',
    name: slugField,
    admin: {
        position: 'sidebar',
        ...admin,
    },
    hooks: {
        beforeChange: [
            async ({ data, originalDoc, req, operation }) => {
                if (!data || !data[sourceField]) return data?.[slugField];

                const baseSlug = slugify(data[sourceField], {
                    replacement: '-',
                    lower: true,
                    strict: true,
                    ...slugifyOptions,
                });

                // Si estamos actualizando y el slug no ha cambiado, lo dejamos igual
                if (operation === 'update' && originalDoc?.[slugField] === baseSlug) {
                    return baseSlug;
                }

                // Consulta para buscar slugs similares
                const existingSlugs = await req.payload.find({
                    collection,
                    where: {
                        and: [
                            {
                                [slugField]: {
                                    like: `${baseSlug}%`, // Buscar todos los slugs que comiencen con baseSlug
                                },
                            },
                            ...(operation === 'update' ? [{
                                id: {
                                    not_equals: originalDoc?.id,
                                },
                            }] : []),
                        ],
                    },
                    limit: 1000, // Limitar a un máximo de 1000 resultados
                });

                // Si no hay documentos que coincidan, devolvemos el slug base
                if (existingSlugs.totalDocs === 0) return baseSlug;

                // Encuentra el número más alto de los slugs existentes
                const slugPattern = new RegExp(`^${baseSlug}(?:-(\\d+))?$`);
                let highestNumber = 0;

                existingSlugs.docs.forEach(doc => {
                    const match = doc[slugField]?.match(slugPattern);
                    if (match && match[1]) {
                        const num = parseInt(match[1], 10);
                        if (num > highestNumber) highestNumber = num;
                    }
                });

                // Retorna el slug con un sufijo de número incrementado
                return `${baseSlug}-${highestNumber + 1}`;
            }
        ]
    }
});
