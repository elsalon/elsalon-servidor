import update from 'payload/dist/collections/operations/update';

var slugify = require('slugify')

/**
 * Creates a slug field that automatically generates from another field
 * @param {Object} options Configuration options
 * @param {string} options.sourceField The field name to generate the slug from (default: 'title')
 * @param {string} options.slugField The name of the slug field (default: 'slug')
 * @param {Object} options.slugify Slugify options (optional)
 * @param {Object} options.admin Additional admin config (optional)
 * @returns {Object} PayloadCMS field configuration
 */
export const SlugField = ({
    sourceField = 'nombre',
    slugField = 'slug',
    slugify: slugifyOptions = {lower: true, strict: true, replacement: '-'},
    admin = {}
} = {}) => ({
    type: "text",
    name: slugField,
    admin: {
        position: "sidebar",
        ...admin
    },
    access: {
        update: ({ req }) => {return req.user.isAdmin}
    },
    hooks: {
        beforeChange: [
            async ({ data, originalDoc, req, operation }) => {
                if (!data[sourceField]) return data[slugField];

                const baseSlug = slugify(data[sourceField], {
                    replacement: '-',    // replace spaces with dashes
                    lower: true,         // convert to lowercase
                    strict: true,         // remove special characters
                    ...slugifyOptions
                });

                // If we're updating and the slug hasn't changed, keep it
                if (operation === 'update' && originalDoc[slugField] === baseSlug) {
                    return baseSlug;
                }

                // Check for existing slugs
                const existingSlugs = await req.payload.find({
                    collection: req.collection.config.slug,
                    where: {
                        and: [
                            {
                                slug: {
                                    like: baseSlug,
                                },
                            },
                            // Exclude the current document if it's an update
                            operation === 'update' && {
                                id: {
                                    not_equals: originalDoc.id,
                                },
                            },
                        ].filter(Boolean),
                    },
                    limit: 0, // Get all matches
                });

                if (existingSlugs.totalDocs === 0) return baseSlug;

                // Find the highest number suffix
                const slugPattern = new RegExp(`^${baseSlug}(?:-(\\d+))?$`);
                let highestNumber = 0;

                existingSlugs.docs.forEach(doc => {
                    const match = doc.slug.match(slugPattern);
                    if (match && match[1]) {
                        const num = parseInt(match[1], 10);
                        if (num > highestNumber) highestNumber = num;
                    }
                });

                // Return slug with incremented number
                return `${baseSlug}-${highestNumber + 1}`;
            }
        ]
    }
})