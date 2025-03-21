import {
  MigrateUpArgs,
  MigrateDownArgs,
} from "@payloadcms/db-mongodb";

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // Migration code
  console.log("Migrate Crear Last activity")
  const entries = await payload.find({
    collection: 'entradas',
    limit: 0,
    depth: 0,
  })

  for (const entry of entries.docs) {
    console.log("updating lastActivity of", entry.id)
    try{
      await payload.update({
        collection: 'entradas',
        id: entry.id,
        context: {
          skipHooks: true
        },
        data: {
          lastActivity: entry.createdAt
        }
      })
    }catch(e){
      console.warn("No se pudo actualizar", entry.id)
    }
  }
};

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Migration code
};
