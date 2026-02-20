import {
  MigrateUpArgs,
  MigrateDownArgs,
} from "@payloadcms/db-mongodb";
import { getPeriodForDate } from '../helper';

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  console.log("=== Starting enlace expiration migration ===");
  console.log("Setting inicio/fin dates for existing 'salon' enlaces based on createdAt timestamp");
  
  // Find all 'salon' enlaces that don't have inicio/fin dates set
  const enlaces = await payload.find({
    collection: 'enlaces',
    where: {
      tipo: { equals: 'salon' }
    },
    limit: 10000,
    depth: 0,
  });

  console.log(`Found ${enlaces.totalDocs} salon enlaces to process`);
  
  let successful = 0;
  let failed = 0;
  let skipped = 0;

  for (const enlace of enlaces.docs) {
    try {
      // Skip if already has dates (shouldn't happen but safety check)
      if (enlace.inicio && enlace.fin) {
        skipped++;
        continue;
      }

      // Fetch the linked sala
      const sala = await payload.findByID({
        collection: 'salas',
        id: enlace.idEnlazado as string,
      });

      if (!sala) {
        console.warn(`⚠️  Sala ${enlace.idEnlazado} not found for enlace ${enlace.id} - setting null dates`);
        await payload.update({
          collection: 'enlaces',
          id: enlace.id,
          data: {
            inicio: null,
            fin: null
          }
        });
        successful++;
        continue;
      }

      // Calculate the period based on when the enlace was created
      const createdAt = new Date(enlace.createdAt as string);
      const period = getPeriodForDate(sala as any, createdAt);

      // Update the enlace with calculated dates
      await payload.update({
        collection: 'enlaces',
        id: enlace.id,
        data: {
          inicio: period.inicio,
          fin: period.fin
        }
      });

      successful++;
      
      if (successful % 50 === 0) {
        console.log(`Progress: ${successful}/${enlaces.totalDocs} enlaces processed`);
      }

    } catch (error) {
      failed++;
      console.error(`✗ Failed to migrate enlace ${enlace.id}:`, error.message);
      // Continue with next enlace
    }
  }

  console.log("=== Migration complete ===");
  console.log(`✓ Successfully migrated: ${successful}`);
  console.log(`⊘ Skipped (already had dates): ${skipped}`);
  console.log(`✗ Failed: ${failed}`);
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  console.log("=== Rolling back enlace expiration migration ===");
  console.log("Note: This migration does not support automatic rollback.");
  console.log("To revert, manually set inicio/fin to null for affected enlaces.");
}
