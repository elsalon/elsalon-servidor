import {
  MigrateUpArgs,
  MigrateDownArgs,
} from "@payloadcms/db-mongodb";

type Entry = {
  id: string;
  createdAt: string;
}

type Comment = {
  createdAt: string;
}

export async function up({ payload }: MigrateUpArgs): Promise<void> {
   // Migration code
   const entries = await payload.find({
    collection: 'entradas',
    limit: 0,
    depth: 0,
  })

  for (const entry of entries.docs) {
    let lastActivity = entry.createdAt;

    const comentarios = await payload.find({
      collection: 'comentarios',
      limit: 0,
      depth: 0,
      where: {
        entrada: {equals: entry.id},
      }
    });
    
    for(const comentario of comentarios.docs){
      const commentDate = new Date(comentario.createdAt).getTime();
      const currentLastActivity = new Date(lastActivity).getTime();
      if(commentDate > currentLastActivity) {
        lastActivity = comentario.createdAt;
      }
    }

    console.log("updating lastActivity of", entry.id)
    try{
      await payload.update({
        collection: 'entradas',
        id: entry.id,
        context: {
          skipHooks: true
        },
        data: {
          lastActivity: lastActivity
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
