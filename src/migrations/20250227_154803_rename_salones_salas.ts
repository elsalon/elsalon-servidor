import {
  MigrateUpArgs,
  MigrateDownArgs,
} from "@payloadcms/db-mongodb";

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await migrateCollectionName(payload, "salones", "salas");
};

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await migrateCollectionName(payload, "salas", "salones");
};


const migrateCollectionName = async (payload, oldName, newName) => {
  try {
    const db = payload.db.connection.db;
    
    // Check if target collection exists
    const collections = await db.listCollections({name: newName}).toArray();
    
    if (collections.length > 0) {
      // Target exists - need to drop it first or merge data
      console.log(`Target collection ${newName} already exists`);
      
      // Option 1: Drop target collection first (CAUTION: data loss)
      await db.collection(newName).drop();
      
      // Option 2 (alternative): Copy data from old to new instead of renaming
      // const documents = await db.collection(oldName).find({}).toArray();
      // if (documents.length > 0) {
      //   await db.collection(newName).insertMany(documents);
      // }
    }
    
    // Now rename
    await db.collection(oldName).rename(newName);
    console.log(`Successfully renamed collection from ${oldName} to ${newName}`);
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}
