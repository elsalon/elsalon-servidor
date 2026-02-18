/**
 * Manual script to process all Biblioteca entries:
 * 1. Download Google Drive files from links in content
 * 2. Search and assign covers for entries without images
 * 
 * Usage:
 *   ts-node src/procesarBiblioteca.ts
 *   or
 *   npm run procesar-biblioteca
 */

import payload from 'payload';
import { descargarArchivosDrive } from './utils/googleDriveDownloader';
import { buscarYAsignarPortada } from './utils/pdfCoverSearch';

require('dotenv').config();

interface ProcessStats {
    total: number;
    withDriveLinks: number;
    driveFilesDownloaded: number;
    driveErrors: number;
    coversSearched: number;
    coversFound: number;
    coverErrors: number;
}

async function procesarBiblioteca() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         BIBLIOTECA PROCESSOR - Manual Execution               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const stats: ProcessStats = {
        total: 0,
        withDriveLinks: 0,
        driveFilesDownloaded: 0,
        driveErrors: 0,
        coversSearched: 0,
        coversFound: 0,
        coverErrors: 0,
    };

    try {
        // Initialize Payload
        console.log('[Init] Initializing Payload...');
        await payload.init({
            secret: process.env.PAYLOAD_SECRET!,
            local: true, // Important for CLI scripts
        });
        console.log('[Init] ✓ Payload initialized\n');

        // Find the Biblioteca sala
        console.log('[Setup] Finding Biblioteca sala...');
        const biblioteca = await payload.find({
            collection: 'salas',
            where: { slug: { equals: 'biblioteca' } },
            limit: 1,
        });

        if (biblioteca.docs.length === 0) {
            console.error('[Error] Sala "biblioteca" not found – exiting');
            process.exit(1);
        }

        const bibliotecaId = biblioteca.docs[0].id;
        console.log(`[Setup] ✓ Found Biblioteca (ID: ${bibliotecaId})\n`);

        // Process all entries in pages
        let page = 1;
        let hasMore = true;

        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log('🔄 Starting processing...\n');

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

            console.log(`\n📄 Page ${page}: Processing ${entries.docs.length} entries...`);

            for (const entry of entries.docs) {
                stats.total++;
                console.log(`\n┌─ Entry ${stats.total}: ${entry.id}`);

                // ═══ STEP 1: Download Google Drive files ═══
                if (entry.contenido) {
                    // Check if there are Drive links in content
                    const hasDriveLinks = /drive\.google\.com\/(file\/d\/|open\?id=)/i.test(entry.contenido);
                    
                    if (hasDriveLinks) {
                        stats.withDriveLinks++;
                        console.log('│  🔗 Drive links detected');
                        console.log('│  ⬇️  Downloading files...');

                        try {
                            const beforeArchivos = (entry.archivos as any[])?.length || 0;
                            const modifiedEntry = await descargarArchivosDrive(payload, entry as any);
                            const afterArchivos = (modifiedEntry.archivos as any[])?.length || 0;
                            const downloaded = afterArchivos - beforeArchivos;

                            if (downloaded > 0) {
                                console.log(`│  ✅ Downloaded ${downloaded} file(s)`);
                                stats.driveFilesDownloaded += downloaded;

                                // Update entry with new archivos
                                await payload.update({
                                    collection: 'entradas',
                                    id: entry.id,
                                    data: {
                                        archivos: modifiedEntry.archivos,
                                    },
                                });
                            } else {
                                console.log('│  ⚠️  No new files downloaded');
                            }

                            // Wait between Drive downloads to be polite
                            await new Promise((resolve) => setTimeout(resolve, 1500));
                        } catch (error: any) {
                            stats.driveErrors++;
                            console.log(`│  ❌ Drive download error: ${error.message}`);
                        }
                    } else {
                        console.log('│  ⊘  No Drive links found');
                    }
                } else {
                    console.log('│  ⊘  No content');
                }

                // ═══ STEP 2: Search and assign cover ═══
                const hasImages = entry.imagenes && (entry.imagenes as any[]).length > 0;

                if (!hasImages) {
                    console.log('│  🖼️  No cover image');
                    console.log('│  🔍 Searching for cover...');
                    stats.coversSearched++;

                    try {
                        const result = await buscarYAsignarPortada(payload, entry as any);
                        
                        if (result) {
                            stats.coversFound++;
                            console.log('│  ✅ Cover found and assigned');
                        } else {
                            console.log('│  ⚠️  No cover found');
                        }

                        // Wait between API calls to be polite
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                    } catch (error: any) {
                        stats.coverErrors++;
                        console.log(`│  ❌ Cover search error: ${error.message}`);
                    }
                } else {
                    console.log('│  ✓  Already has cover image');
                }

                console.log('└─');
            }

            hasMore = entries.hasNextPage;
            page++;
        }

        // Print summary
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('\n✅ PROCESSING COMPLETE\n');
        console.log('📊 Statistics:');
        console.log(`   Total entries processed:     ${stats.total}`);
        console.log(`\n   🔗 Drive Links:`);
        console.log(`      Entries with links:       ${stats.withDriveLinks}`);
        console.log(`      Files downloaded:         ${stats.driveFilesDownloaded}`);
        console.log(`      Errors:                   ${stats.driveErrors}`);
        console.log(`\n   🖼️  Covers:`);
        console.log(`      Searches performed:       ${stats.coversSearched}`);
        console.log(`      Covers found:             ${stats.coversFound}`);
        console.log(`      Errors:                   ${stats.coverErrors}`);
        console.log('\n═══════════════════════════════════════════════════════════════\n');

    } catch (error: any) {
        console.error('\n❌ Fatal error:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Run the script
procesarBiblioteca();
