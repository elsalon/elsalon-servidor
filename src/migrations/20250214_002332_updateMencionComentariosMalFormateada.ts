import {
  MigrateUpArgs,
  MigrateDownArgs,
} from "@payloadcms/db-mongodb";

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // Migration code
  const entries = await payload.find({
    collection: 'comentarios',
    limit: 0,
    depth: 0,
  })

  for (const entry of entries.docs) {
    console.log("updating mencion de contenido of", entry.id)
    let contenido = entry.contenido as String;
    // Reemplazar texto Mencion
    contenido = contenido.replace(/\(mencion:/g, "(usuario:")
    try{
      await payload.update({
        collection: 'comentarios',
        id: entry.id,
        context: {
          skipHooks: true
        },
        data: {
          contenido
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
