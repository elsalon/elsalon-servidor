import {
    MigrateUpArgs,
    MigrateDownArgs,
} from "@payloadcms/db-mongodb";
import { descargarArchivosDrive } from "../utils/googleDriveDownloader";

export async function up({ payload }: MigrateUpArgs): Promise<void> {
    console.log("[Migration] Descargando archivos de Google Drive en Biblioteca");

    // Find the Biblioteca sala
    const biblioteca = await payload.find({
        collection: 'salas',
        where: { slug: { equals: 'biblioteca' } },
        limit: 1,
    });

    if (biblioteca.docs.length === 0) {
        console.log("[Migration] Sala 'biblioteca' not found – skipping");
        return;
    }

    const bibliotecaId = biblioteca.docs[0].id;

    let page = 1;
    let hasMore = true;
    let processed = 0;

    while (hasMore) {
        const entries = await payload.find({
            collection: 'entradas',
            where: {
                and: [
                    { sala: { equals: bibliotecaId } },
                    { isDeleted: { not_equals: true } },
                ],
            },
            limit: 50,
            page,
            depth: 0,
        });

        console.log(`[Migration] Page ${page}: Found ${entries.docs.length} entries`);

        for (const entry of entries.docs) {
            if (!entry.contenido) continue;

            processed++;
            console.log(`[Migration] (${processed}) Processing entry ${entry.id}`);

            try {
                await descargarArchivosDrive(payload, entry as any);
            } catch (error) {
                console.error(`[Migration] Failed to process entry ${entry.id}:`, error);
            }

            // Be polite to Google Drive – 2 seconds between entries
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        hasMore = entries.hasNextPage;
        page++;
    }

    console.log(
        `[Migration] Done. Processed ${processed} entries.`,
    );
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
    // Files downloaded by this migration are regular archivos docs.
    // No automatic rollback – remove them manually if needed.
}
