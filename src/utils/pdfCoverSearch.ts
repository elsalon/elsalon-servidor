import axios from 'axios';
import FormData from 'form-data';

// ── Types ────────────────────────────────────────────────────────────

interface ArchivoDoc {
    id: string;
    filename: string;
    mimeType: string;
}

interface EntradaDoc {
    id: string;
    sala: string | { id: string };
    autor: string | { id: string };
    archivos?: Array<{ archivo: string | ArchivoDoc }>;
    imagenes?: Array<{ imagen: string | { id: string } }>;
    extracto?: string;
    contenido?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Cleans a PDF filename into a human-readable search query.
 *   "Historia_del_Arte_Moderno.pdf" → "Historia del Arte Moderno"
 */
function cleanFilenameForSearch(filename: string): string {
    return filename
        .replace(/\.pdf$/i, '')
        .replace(/[_\-\.]/g, ' ')
        .replace(/\(\d+\)/g, '')         // remove "(1)", "(2)" duplicates
        .replace(/\b\d{4,}\b/g, '')      // remove year-like or long numbers
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Builds an ordered list of search queries to try against Open Library.
 * First entry = cleaned filename (most specific), second = extracto / contenido.
 */
function buildSearchQueries(entry: EntradaDoc, pdfArchivos: ArchivoDoc[]): string[] {
    const queries: string[] = [];

    // 1. From the first PDF filename
    if (pdfArchivos.length > 0) {
        const cleaned = cleanFilenameForSearch(pdfArchivos[0].filename);
        if (cleaned.length > 3) queries.push(cleaned);
    }

    // 2. From the extracto (auto-generated short excerpt of contenido)
    if (entry.extracto && entry.extracto.length > 5) {
        const text = entry.extracto
            .substring(0, 150)
            .replace(/https?:\/\/\S+/g, '')   // strip URLs
            .replace(/[@#]\w+/g, '')           // strip mentions / hashtags
            .replace(/<[^>]*>/g, '')           // strip any stray HTML
            .replace(/\s+/g, ' ')
            .trim();
        if (text.length > 5) queries.push(text);
    }

    // 3. From contenido (full text, trimmed) – only if different from extracto
    if (entry.contenido && entry.contenido.length > 5 && entry.contenido !== entry.extracto) {
        const text = entry.contenido
            .substring(0, 200)
            .replace(/https?:\/\/\S+/g, '')
            .replace(/[@#]\w+/g, '')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        if (text.length > 5 && !queries.includes(text)) queries.push(text);
    }

    return queries;
}

// ── Open Library API ─────────────────────────────────────────────────

/**
 * Queries the Open Library Search API and returns the URL of the first
 * cover image found, or null.
 *
 * Uses the `lang` param to prefer Spanish editions first (without
 * excluding non-Spanish results), then falls back to a language-neutral
 * search if no cover was found.
 */
async function searchOpenLibraryCover(query: string): Promise<string | null> {
    // Try Spanish-preferred first, then fallback without lang preference
    const attempts: Array<Record<string, string | number>> = [
        { q: query, limit: 5, fields: 'key,title,author_name,cover_i', lang: 'es' },
        { q: query, limit: 5, fields: 'key,title,author_name,cover_i' },
    ];

    for (const params of attempts) {
        try {
            const response = await axios.get('https://openlibrary.org/search.json', {
                params,
                timeout: 10000,
            });

            const docs = response.data?.docs || [];
            for (const doc of docs) {
                if (doc.cover_i) {
                    const langLabel = params.lang ? ` (lang=${params.lang})` : ' (any lang)';
                    console.log(`[PortadaPDF] Cover found via Open Library${langLabel}: "${doc.title}"`);
                    return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
                }
            }
        } catch (error: any) {
            console.warn('[PortadaPDF] Open Library search error:', error.message);
        }
    }

    return null;
}

/**
 * Downloads an image into memory and validates it isn't a tiny placeholder.
 */
async function downloadCoverImage(url: string): Promise<{ buffer: Buffer; mimetype: string } | null> {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 15000,
        });

        const buffer = Buffer.from(response.data);
        const mimetype = response.headers['content-type'] || 'image/jpeg';

        // Open Library returns a tiny 1×1 gif for missing covers
        if (buffer.length < 1000) {
            console.warn('[PortadaPDF] Image too small – likely a placeholder, skipping');
            return null;
        }

        return { buffer, mimetype };
    } catch (error: any) {
        console.warn('[PortadaPDF] Image download error:', error.message);
        return null;
    }
}

/**
 * Generates a PDF preview (first page) using the ApyHub API.
 * Returns an image buffer or null on failure.
 */
async function extractFirstPageFromPdf(pdfUrl: string): Promise<{ buffer: Buffer; mimetype: string } | null> {
    try {
        const apyToken = process.env.APYHUB_TOKEN;
        if (!apyToken) {
            console.warn('[PortadaPDF] APYHUB_TOKEN not configured - skipping PDF extraction');
            return null;
        }

        console.log(`[PortadaPDF] Generating preview via ApyHub: ${pdfUrl}`);

        // Download the PDF first (ApyHub needs file upload, not URL)
        const pdfResponse = await axios.get(pdfUrl, {
            responseType: 'arraybuffer',
            timeout: 60000, // 60 seconds for large PDFs
        });

        const pdfBuffer = Buffer.from(pdfResponse.data);

        // Create form data with the PDF
        const form = new FormData();
        form.append('file', pdfBuffer, {
            filename: 'document.pdf',
            contentType: 'application/pdf',
        });

        // Call ApyHub API
        const response = await axios.post(
            'https://api.apyhub.com/generate/preview/file?page=1&output=cover',
            form,
            {
                headers: {
                    'apy-token': apyToken,
                    ...form.getHeaders(),
                },
                responseType: 'arraybuffer',
                timeout: 90000, // 90 seconds - PDF processing can take time
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
        );

        const buffer = Buffer.from(response.data);

        if (buffer.length < 1000) {
            console.warn('[PortadaPDF] Extracted image too small');
            return null;
        }

        console.log(`[PortadaPDF] ✓ Generated preview via ApyHub (${Math.round(buffer.length / 1024)}KB)`);
        return { buffer, mimetype: 'image/png' };
    } catch (error: any) {
        console.warn('[PortadaPDF] ApyHub API error:', error.message);
        return null;
    }
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Returns true when an entry is in the Biblioteca, has at least one PDF
 * archivo, and has no images yet.
 */
export function necesitaPortada(entry: any, bibliotecaId: string): boolean {
    const salaId = typeof entry.sala === 'string' ? entry.sala : entry.sala?.id;
    if (salaId !== bibliotecaId) return false;

    const hasPdfArchivo =
        Array.isArray(entry.archivos) && entry.archivos.length > 0;
    const hasImagenes =
        Array.isArray(entry.imagenes) && entry.imagenes.length > 0;

    return hasPdfArchivo && !hasImagenes;
}

/**
 * Core pipeline – shared between the afterChange hook and the migration.
 *
 * 1. Resolves archivo docs to get filenames / mimeTypes.
 * 2. Builds search queries from filename + entry text.
 * 3. Searches Open Library for a cover.
 * 4. Downloads the cover image (in-memory – no temp files).
 * 5. Uploads to the `imagenes` collection (S3 via Payload).
 * 6. Updates the entry's `imagenes` array.
 *
 * Returns true if a cover was successfully assigned.
 */
export async function buscarYAsignarPortada(
    payload: any,
    entry: EntradaDoc,
): Promise<boolean> {
    try {
        const autorId =
            typeof entry.autor === 'string' ? entry.autor : entry.autor?.id;

        // ── 1. Resolve archivo documents ────────────────────────────
        const archivoIds: string[] = (entry.archivos || [])
            .map((a) =>
                typeof a.archivo === 'string' ? a.archivo : (a.archivo as any)?.id,
            )
            .filter(Boolean) as string[];

        if (archivoIds.length === 0) return false;

        const archivoDocs: ArchivoDoc[] = [];
        for (const id of archivoIds) {
            try {
                const doc = await payload.findByID({ collection: 'archivos', id, depth: 0 });
                if (doc) archivoDocs.push(doc);
            } catch {
                /* skip broken refs */
            }
        }

        const pdfArchivos = archivoDocs.filter(
            (a) => a.mimeType === 'application/pdf',
        );
        if (pdfArchivos.length === 0) return false;

        // ── 2. Build search queries ─────────────────────────────────
        const queries = buildSearchQueries(entry, pdfArchivos);
        if (queries.length === 0) {
            console.log(`[PortadaPDF] No search terms for entry ${entry.id}`);
            return false;
        }

        // ── 3. Search Open Library (try each query in order) ────────
        let imageData: { buffer: Buffer; mimetype: string } | null = null;
        let coverUrl: string | null = null;

        for (const q of queries) {
            console.log(`[PortadaPDF] Searching: "${q}"`);
            coverUrl = await searchOpenLibraryCover(q);
            if (coverUrl) break;
        }

        if (coverUrl) {
            console.log(`[PortadaPDF] Cover found: ${coverUrl}`);
            // ── 4. Download cover image (in-memory) ─────────────────────
            imageData = await downloadCoverImage(coverUrl);
        }

        // ── 5. Fallback: Extract first page from PDF ───────────────
        if (!imageData) {
            console.log(`[PortadaPDF] No online cover found, extracting first page from PDF...`);
            
            // Construct the S3 CDN URL directly
            const cdnUrl = process.env.DO_SPACES_CDN_URL;
            if (!cdnUrl) {
                console.warn('[PortadaPDF] DO_SPACES_CDN_URL not configured');
                return false;
            }

            const pdfUrl = `${cdnUrl}/media/archivos/${pdfArchivos[0].filename}`;
            imageData = await extractFirstPageFromPdf(pdfUrl);

            if (!imageData) {
                console.log(`[PortadaPDF] Failed to extract cover for entry ${entry.id}`);
                return false;
            }
        }

        // ── 6. Upload to imagenes collection ────────────────────────
        const ext = imageData.mimetype.includes('png') ? 'png' : 'jpg';
        const fileName = `portada-${entry.id}.${ext}`;

        const uploadedImage = await payload.create({
            collection: 'imagenes',
            data: {
                uploader: autorId,
            },
            file: {
                data: imageData.buffer,
                mimetype: imageData.mimetype,
                name: fileName,
                size: imageData.buffer.length,
            },
        });

        // ── 7. Attach image to the entry ────────────────────────────
        const existingImages = (entry.imagenes || []).map((img) => ({
            imagen:
                typeof img.imagen === 'string'
                    ? img.imagen
                    : (img.imagen as any)?.id,
        }));

        await payload.update({
            collection: 'entradas',
            id: entry.id,
            context: {
                skipHooks: true,
                skipPortadaSearch: true,
            },
            data: {
                imagenes: [...existingImages, { imagen: uploadedImage.id }],
            },
        });

        console.log(`[PortadaPDF] ✓ Cover assigned to entry ${entry.id}`);
        return true;
    } catch (error) {
        console.error(`[PortadaPDF] Error on entry ${entry.id}:`, error);
        return false;
    }
}
