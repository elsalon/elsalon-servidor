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
    let covers = 0;

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
            // Skip entries that already have images or have no archivos
            if (entry.imagenes && (entry.imagenes as any[]).length > 0) continue;
            if (!entry.archivos || (entry.archivos as any[]).length === 0) continue;

            processed++;
            console.log(`[Migration] (${processed}) Processing entry ${entry.id}`);

            const success = await buscarYAsignarPortada(payload, entry as any);
            if (success) covers++;

            // Be polite to the Open Library API – 1 s between requests
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        hasMore = entries.hasNextPage;
        page++;
    }

    console.log(
        `[Migration] Done. Checked ${processed} entries, assigned ${covers} covers.`,
    );
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
    // Portadas assigned by this migration are regular imagenes docs.
    // No automatic rollback – remove them manually if needed.
}
