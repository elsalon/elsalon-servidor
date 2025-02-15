import {
  MigrateUpArgs,
  MigrateDownArgs,
} from "@payloadcms/db-mongodb";

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  console.log("Migrate Crear Extractos")
  // Migration code
  const entries = await payload.find({
    collection: 'entradas',
    limit: 0,
    depth: 0,
  })

  for (const entry of entries.docs) {
    console.log("updating extracto of", entry.id)
    try{
      await payload.update({
        collection: 'entradas',
        id: entry.id,
        context: {
          skipHooks: true,
          crearExtracto:true,
        },
        data: {}
      })
    }catch(e){
      console.warn("No se pudo actualizar", entry.id)
    }
  }
};

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Migration code
};
