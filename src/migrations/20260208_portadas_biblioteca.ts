import {
    MigrateUpArgs,
    MigrateDownArgs,
} from "@payloadcms/db-mongodb";
import { buscarYAsignarPortada } from "../utils/pdfCoverSearch";

export async function up({ payload }: MigrateUpArgs): Promise<void> {
    console.log("[Migration] Buscando portadas para entradas de Biblioteca sin imágenes");

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

        for (const entry of entries.docs) {
            // Skip entries that already have images
            if (entry.imagenes && (entry.imagenes as any[]).length > 0) continue;

            processed++;
            console.log(`[Migration] (${processed}) Processing entry ${entry.id}`);

            try {
                const result = await buscarYAsignarPortada(payload, entry as any);
                const hasNewImage = (result?.imagenes as any[])?.length > 0;

                if (hasNewImage) {
                    await payload.update({
                        collection: 'entradas',
                        id: entry.id as string,
                        data: {
                            imagenes: result.imagenes,
                        },
                    });
                }
            } catch (error) {
                console.error(`[Migration] Failed to process entry ${entry.id}:`, error);
            }

            // Avoid API bursts - 1 s between requests
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        hasMore = entries.hasNextPage;
        page++;
    }

    console.log(
        `[Migration] Done. Processed ${processed} entries.`,
    );
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
    // Portadas assigned by this migration are regular imagenes docs.
    // No automatic rollback – remove them manually if needed.
}
