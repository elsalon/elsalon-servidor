import {
  MigrateUpArgs,
  MigrateDownArgs,
} from "@payloadcms/db-mongodb";

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // Migration code
  console.log("Migrate notificacion nuevo campo actualizacion")
  // Migration code
  const entries = await payload.find({
    collection: 'notificaciones',
    limit: 0,
    depth: 0,
  })
  let i = 0;
  for (const entry of entries.docs) {
    console.log(i+ " / " + entries.docs.length)
    i++;
    await payload.update({
      collection: 'notificaciones',
      id: entry.id,
      context: {
        skipHooks: true
      },
      data: {
        actualizacion: entry.createdAt
      }
    })
  }
};

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Migration code
};
