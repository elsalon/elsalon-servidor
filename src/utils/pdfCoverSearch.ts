import axios from 'axios';

// ── Types ────────────────────────────────────────────────────────────

interface ArchivoDoc {
    id: string;
    filename: string;
    mimeType: string;
}

interface EntradaDoc {
    id?: string; // Optional - won't exist in beforeChange hooks
    sala: string | { id: string };
    autor: string | { id: string };
    archivos?: Array<{ archivo: string | { id: string } | ArchivoDoc }>;
    imagenes?: Array<{ imagen: string | { id: string } }>;
}

// ── Helpers ──────────────────────────────────────────────────────────

const CLOUDCONVERT_POLL_INTERVAL_MS = 2500;
const CLOUDCONVERT_MAX_WAIT_MS = 90000;

type CloudConvertTask = {
    name: string;
    status: string;
    result?: { files?: Array<{ url: string }> };
};

type CloudConvertJobResponse = {
    data?: {
        id?: string;
        status?: string;
        tasks?: CloudConvertTask[];
    };
};

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createCloudConvertJob(pdfUrl: string): Promise<string | null> {
    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (!apiKey) {
        console.warn('[PortadaPDF] CLOUDCONVERT_API_KEY not configured - skipping CloudConvert');
        return null;
    }

    try {
        const response = await axios.post<CloudConvertJobResponse>(
            'https://api.cloudconvert.com/v2/jobs',
            {
                tasks: {
                    'import-1': {
                        operation: 'import/url',
                        url: pdfUrl,
                    },
                    'convert-1': {
                        operation: 'convert',
                        input: 'import-1',
                        input_format: 'pdf',
                        output_format: 'jpg',
                        page_range: '1',
                    },
                    'export-1': {
                        operation: 'export/url',
                        input: 'convert-1',
                    },
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 60000,
            },
        );

        const jobId = response.data?.data?.id;
        if (!jobId) {
            console.warn('[PortadaPDF] CloudConvert job creation returned no id');
            return null;
        }

        console.log(`[PortadaPDF] CloudConvert job created: ${jobId}`);
        return jobId;
    } catch (error: any) {
        const status = error?.response?.status;
        const data = error?.response?.data;
        if (status) {
            console.warn(
                `[PortadaPDF] CloudConvert job creation error: ${status} ${error.message}`,
                data || null,
            );
        } else {
            console.warn('[PortadaPDF] CloudConvert job creation error:', error.message);
        }
        return null;
    }
}

async function waitForCloudConvertExportUrl(jobId: string): Promise<string | null> {
    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (!apiKey) return null;

    const startedAt = Date.now();
    while (Date.now() - startedAt < CLOUDCONVERT_MAX_WAIT_MS) {
        try {
            const response = await axios.get<CloudConvertJobResponse>(
                `https://api.cloudconvert.com/v2/jobs/${jobId}`,
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                    },
                    timeout: 60000,
                },
            );

            const job = response.data?.data;
            if (!job) {
                console.warn('[PortadaPDF] CloudConvert job response missing data');
                return null;
            }

            if (job.status === 'finished') {
                const exportTask = job.tasks?.find((task) => task.name === 'export-1');
                const exportUrl = exportTask?.result?.files?.[0]?.url;
                if (!exportUrl) {
                    console.warn('[PortadaPDF] CloudConvert finished without export url');
                    return null;
                }

                return exportUrl;
            }

            if (job.status === 'error' || job.status === 'failed') {
                console.warn(`[PortadaPDF] CloudConvert job failed: ${job.status}`);
                return null;
            }
        } catch (error: any) {
            const status = error?.response?.status;
            const data = error?.response?.data;
            if (status) {
                console.warn(
                    `[PortadaPDF] CloudConvert status error: ${status} ${error.message}`,
                    data || null,
                );
            } else {
                console.warn('[PortadaPDF] CloudConvert status error:', error.message);
            }
            return null;
        }

        await sleep(CLOUDCONVERT_POLL_INTERVAL_MS);
    }

    console.warn('[PortadaPDF] CloudConvert job timed out');
    return null;
}

/**
 * Downloads an image into memory and validates it isn't a tiny placeholder.
 */
async function downloadCoverImage(url: string): Promise<{ buffer: Buffer; mimetype: string } | null> {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 60000,
        });

        const buffer = Buffer.from(response.data);
        const mimetype = response.headers['content-type'] || 'image/jpeg';

        // Skip tiny placeholder images
        if (buffer.length < 1000) {
            console.warn('[PortadaPDF] Image too small - likely a placeholder, skipping');
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

        // Create form data with the PDF – convert buffer to Uint8Array for Blob
        const form = new FormData();
        const uint8Array = new Uint8Array(pdfBuffer);
        form.append('file', new Blob([uint8Array], { type: 'application/pdf' }), 'document.pdf');

        // Call ApyHub API
        const response = await axios.post(
            'https://api.apyhub.com/generate/preview/file?page=1&output=cover',
            form,
            {
                headers: {
                    'apy-token': apyToken,
                    ...(form as any).getHeaders?.() || {},
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

async function generateCoverFromCloudConvert(pdfUrl: string): Promise<{ buffer: Buffer; mimetype: string } | null> {
    const jobId = await createCloudConvertJob(pdfUrl);
    if (!jobId) return null;

    const exportUrl = await waitForCloudConvertExportUrl(jobId);
    if (!exportUrl) return null;

    return downloadCoverImage(exportUrl);
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Returns true when an entry is in the Biblioteca, has at least one PDF
 * archivo, and has no images yet.
 */
export function necesitaPortada(entry: any, bibliotecaId: string): boolean {
    const salaId = typeof entry.sala === 'string' ? entry.sala : entry.sala?.id;
    if (salaId !== bibliotecaId) return false;

    const hasImagenes =
        Array.isArray(entry.imagenes) && entry.imagenes.length > 0;

    return !hasImagenes;
}

/**
 * Core pipeline – shared between the afterChange hook and the migration.
 *
 * 1. Resolves archivo docs to get filenames / mimeTypes.
 * 2. Generates a cover via CloudConvert (PDF -> JPG).
 * 3. Downloads the cover image (in-memory – no temp files).
 * 4. Uploads to the `imagenes` collection (S3 via Payload).
 * 5. Updates the entry's `imagenes` array.
 *
 * Returns true if a cover was successfully assigned.
 */
export async function buscarYAsignarPortada(
    payload: any,
    doc: EntradaDoc,
): Promise<EntradaDoc> {
    try {
        const autorId =
            typeof doc.autor === 'string' ? doc.autor : doc.autor?.id;

        // ── 1. Resolve archivo documents (if any) ──────────────────
        const archivoIds: string[] = (doc.archivos || [])
            .map((a) =>
                typeof a.archivo === 'string' ? a.archivo : (a.archivo as any)?.id,
            )
            .filter(Boolean) as string[];

        const archivoDocs: ArchivoDoc[] = [];
        for (const id of archivoIds) {
            try {
                const archivo = await payload.findByID({ collection: 'archivos', id, depth: 0 });
                if (archivo) archivoDocs.push(archivo);
            } catch {
                /* skip broken refs */
            }
        }

        const pdfArchivos = archivoDocs.filter(
            (a) => a.mimeType === 'application/pdf',
        );

        // ── 2. Generate cover from PDF via CloudConvert ─────────────
        let imageData: { buffer: Buffer; mimetype: string } | null = null;
        const cdnUrl = process.env.DO_SPACES_CDN_URL;
        if (!cdnUrl) {
            console.warn('[PortadaPDF] DO_SPACES_CDN_URL not configured');
            return doc;
        }

        if (pdfArchivos.length === 0) {
            console.log('[PortadaPDF] No PDF archivos to generate cover');
            return doc;
        }

        const pdfUrl = `${cdnUrl}/media/archivos/${encodeURIComponent(pdfArchivos[0].filename)}`;
        imageData = await generateCoverFromCloudConvert(pdfUrl);

        // ── 3. Fallback: Extract first page from PDF (if exists) ───
        if (!imageData && pdfArchivos.length > 0) {
            console.log('[PortadaPDF] CloudConvert failed, extracting first page from PDF...');
            imageData = await extractFirstPageFromPdf(pdfUrl);
        }

        if (!imageData) {
            console.log(`[PortadaPDF] Failed to find or generate cover`);
            return doc;
        }

        // ── 4. Upload to imagenes collection ────────────────────────
        const ext = imageData.mimetype.includes('png') ? 'png' : 'jpg';
        const fileName = `portada-biblioteca-${Date.now()}.${ext}`;

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

        // ── 5. Attach image directly to doc.imagenes array ──────────
        // Just modify doc in place – no need for payload.update() in afterChange hook
        const existingImages = (doc.imagenes || []).map((img) => ({
            imagen:
                typeof img.imagen === 'string'
                    ? img.imagen
                    : (img.imagen as any)?.id,
        }));

        doc.imagenes = [...existingImages, { imagen: uploadedImage.id }];

        console.log(`[PortadaPDF] ✓ Cover assigned`);
        return doc;
    } catch (error) {
        console.error(`[PortadaPDF] Error:`, error);
        return doc;
    }
}

/**
 * Payload afterChange hook for Biblioteca entries.
 * Searches for and assigns book covers to entries without images.
 * Modifies doc in place and returns the modified doc.
 */
export const BuscarPortadaBiblioteca = async ({ doc, req, operation, context }, bibliotecaId: string) => {
    if (context?.skipHooks || context?.skipPortadaSearch) return doc;
    if (operation !== 'create') return doc;

    if (necesitaPortada(doc, bibliotecaId)) {
        const modifiedDoc = await buscarYAsignarPortada(req.payload, doc).catch((err) => {
            console.error('[PortadaPDF] Background error:', err);
            return doc;
        });
        return modifiedDoc;
    }

    return doc;
};
