import axios from 'axios';

// ── Types ────────────────────────────────────────────────────────────

interface EntradaDoc {
    id?: string; // Optional - won't exist in beforeChange hooks
    sala: string | { id: string };
    autor: string | { id: string };
    contenido?: string;
    archivos?: Array<{ archivo: string | { id: string } }>;
}

// ── Google Drive Link Extraction ─────────────────────────────────────

/**
 * Regex patterns to match Google Drive links.
 * Supports:
 *   - drive.google.com/file/d/{fileId}/view
 *   - drive.google.com/open?id={fileId}
 */
const GOOGLE_DRIVE_PATTERNS = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
];

/**
 * Extracts all unique Google Drive file IDs from text.
 */
function extractGoogleDriveIds(text: string): string[] {
    const ids = new Set<string>();

    for (const pattern of GOOGLE_DRIVE_PATTERNS) {
        let match;
        const regex = new RegExp(pattern, 'g');
        while ((match = regex.exec(text)) !== null) {
            if (match[1]) ids.add(match[1]);
        }
    }

    return Array.from(ids);
}

/**
 * Downloads a file from Google Drive without authentication.
 * Uses the export=download parameter to bypass the preview page.
 */
async function downloadFromGoogleDrive(
    fileId: string,
): Promise<{ buffer: Buffer; filename: string } | null> {
    try {
        console.log(`[GoogleDrive] Downloading file: ${fileId}`);

        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

        const response = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            maxRedirects: 5,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const buffer = Buffer.from(response.data);

        if (buffer.length < 100) {
            console.warn('[GoogleDrive] Downloaded file too small – likely an error page');
            return null;
        }

        // Extract filename from Content-Disposition header
        // Handles formats: filename="name.pdf", filename=name.pdf, filename*=UTF-8''name.pdf
        const contentDisposition = (response.headers['content-disposition'] || '').toString();
        let filename = `document-${fileId}.pdf`;

        if (contentDisposition) {
            // RFC 5987 encoding (filename*=UTF-8''...)
            let match = contentDisposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/);
            if (match?.[1]) {
                filename = decodeURIComponent(match[1]);
            } else {
                // Standard formats: filename="..." or filename=...
                match = contentDisposition.match(/filename="?([^";\n]+)"?/);
                if (match?.[1]) {
                    filename = match[1].trim();
                }
            }
        }

        // Ensure filename ends with .pdf if not present
        if (!filename.toLowerCase().endsWith('.pdf')) {
            filename += '.pdf';
        }

        console.log(`[GoogleDrive] ✓ Downloaded ${Math.round(buffer.length / 1024)}KB as "${filename}"`);
        return { buffer, filename };
    } catch (error: any) {
        console.warn('[GoogleDrive] Download error:', error.message);
        return null;
    }
}

/**
 * Uploads a downloaded file to the archivos collection.
 */
async function uploadToArchivos(
    payload: any,
    fileBuffer: Buffer,
    filename: string,
    autorId: string,
): Promise<string | null> {
    try {
        const uploadedFile = await payload.create({
            collection: 'archivos',
            data: {
                uploader: autorId,
            },
            file: {
                data: fileBuffer,
                mimetype: 'application/pdf',
                name: filename,
                size: fileBuffer.length,
            },
        });

        console.log(`[GoogleDrive] Uploaded to archivos: ${uploadedFile.id}`);
        return uploadedFile.id;
    } catch (error: any) {
        console.error('[GoogleDrive] Upload error:', error.message);
        return null;
    }
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Returns true if entry is in Biblioteca.
 */
export function esBiblioteca(entry: any, bibliotecaId: string): boolean {
    const salaId = typeof entry.sala === 'string' ? entry.sala : entry.sala?.id;
    return salaId === bibliotecaId;
}

/**
 * Main pipeline – downloads Google Drive files from entry content
 * and attaches them to the entry's archivos array.
 *
 * Modifies doc.archivos in place and returns the modified doc.
 */
export async function descargarArchivosDrive(
    payload: any,
    doc: EntradaDoc,
): Promise<EntradaDoc> {
    try {
        if (!doc.contenido) {
            console.log(`[GoogleDrive] No contenido`);
            return doc;
        }

        const autorId =
            typeof doc.autor === 'string' ? doc.autor : doc.autor?.id;

        // ── 1. Extract Google Drive IDs from content ────────────────
        const driveIds = extractGoogleDriveIds(doc.contenido);
        if (driveIds.length === 0) {
            console.log(`[GoogleDrive] No Drive links found`);
            return doc;
        }

        console.log(
            `[GoogleDrive] Found ${driveIds.length} Drive link(s)`,
        );

        // ── 2. Download each file ──────────────────────────────────
        const newArchivoIds: string[] = [];

        for (const fileId of driveIds) {
            const fileData = await downloadFromGoogleDrive(fileId);
            if (!fileData) continue;

            // ── 3. Upload to archivos collection ───────────────────
            const archivoId = await uploadToArchivos(
                payload,
                fileData.buffer,
                fileData.filename,
                autorId,
            );

            if (archivoId) {
                newArchivoIds.push(archivoId);
            }

            // Be polite – 1 second between downloads
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        if (newArchivoIds.length === 0) {
            console.log(`[GoogleDrive] No files successfully downloaded`);
            return doc;
        }

        // ── 4. Attach files directly to doc.archivos array ─────────
        // Just modify doc in place – no need for payload.update() in beforeChange hook
        const existingArchivos = (doc.archivos || []).map((a: any) => ({
            archivo:
                typeof a.archivo === 'string'
                    ? a.archivo
                    : (a.archivo as any)?.id,
        }));

        const newArchivos = newArchivoIds.map((id) => ({ archivo: id }));

        doc.archivos = [...existingArchivos, ...newArchivos];

        console.log(
            `[GoogleDrive] ✓ Attached ${newArchivoIds.length} file(s)`,
        );

        return doc;
    } catch (error) {
        console.error(`[GoogleDrive] Error processing:`, error);
        return doc;
    }
}

/**
 * Payload afterChange hook for Biblioteca entries.
 * Downloads Google Drive files linked in the entry content.
 * Modifies doc in place and returns the modified doc.
 */
export const DescargarArchivosDriveBiblioteca = async ({ doc, req, operation, context }, bibliotecaId: string) => {
    if (context?.skipHooks || context?.skipDriveDownload) return doc;
    if (operation !== 'create') return doc;

    if (esBiblioteca(doc, bibliotecaId)) {
        const modifiedDoc = await descargarArchivosDrive(req.payload, doc).catch((err) => {
            console.error('[GoogleDrive] Background error:', err);
            return doc;
        });
        return modifiedDoc;
    }

    return doc;
};
