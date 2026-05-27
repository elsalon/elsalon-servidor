import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import payload from 'payload';

require('dotenv').config();

const DEFAULT_TARGET = 500;
const ENTRADAS_PAGE_SIZE = 200;
const COMENTARIOS_PAGE_SIZE = 500;

type AnyObject = Record<string, any>;

interface EntradaMeta {
  id: string;
  year: number;
  salaKey: string;
}

const parseArgs = () => {
  const argMap: Record<string, string> = {};
  process.argv.slice(2).forEach((arg) => {
    if (!arg.startsWith('--')) return;
    const [rawKey, rawValue] = arg.slice(2).split('=');
    argMap[rawKey] = rawValue ?? 'true';
  });

  const targetRaw = Number.parseInt(argMap.target ?? `${DEFAULT_TARGET}`, 10);
  const target = Number.isNaN(targetRaw) || targetRaw <= 0 ? DEFAULT_TARGET : targetRaw;

  return {
    target,
  };
};

const pad2 = (value: number) => `${value}`.padStart(2, '0');

const timestampForFolder = (date: Date) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  const second = pad2(date.getSeconds());
  return `${year}${month}${day}-${hour}${minute}${second}`;
};

const toId = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return `${value}`;
  if (typeof value === 'object' && value.id) return `${value.id}`;
  return null;
};

const uniq = <T>(items: T[]) => Array.from(new Set(items));

const shuffle = <T>(items: T[]) => {
  const out = [...items];
  for (let index = out.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [out[index], out[randomIndex]] = [out[randomIndex], out[index]];
  }
  return out;
};

const groupBy = <T>(items: T[], keyGetter: (item: T) => string) => {
  const result = new Map<string, T[]>();
  items.forEach((item) => {
    const key = keyGetter(item);
    const group = result.get(key);
    if (group) {
      group.push(item);
    } else {
      result.set(key, [item]);
    }
  });
  return result;
};

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '');

const buildUrl = (baseUrl: string | undefined, prefix: string, filename: string | undefined) => {
  if (!baseUrl || !filename) return null;
  const base = trimSlashes(baseUrl);
  const cleanPrefix = trimSlashes(prefix);
  const cleanFilename = trimSlashes(filename);

  if (/^https?:\/\//i.test(baseUrl)) {
    return [base, cleanPrefix, cleanFilename].filter(Boolean).join('/');
  }

  return `https://${[base, cleanPrefix, cleanFilename].filter(Boolean).join('/')}`;
};

const normalizeUser = (user: any, cdnUrl: string | undefined) => {
  if (!user || typeof user !== 'object') return null;
  const avatarDoc = user.avatar && typeof user.avatar === 'object' ? user.avatar : null;

  return {
    id: toId(user.id),
    nombre: user.nombre ?? null,
    rol: user.rol ?? null,
    slug: user.slug ?? null,
    avatarUrl:
      avatarDoc?.url ??
      buildUrl(cdnUrl, 'media/avatares', avatarDoc?.filename) ??
      null,
  };
};

const normalizeMention = (mention: any) => {
  if (!mention) return null;
  if (typeof mention === 'string') {
    return {
      id: mention,
      type: null,
      nombre: null,
      slug: null,
    };
  }

  if (mention.relationTo && mention.value) {
    const value = mention.value;
    return {
      id: toId(value.id ?? value),
      type: mention.relationTo,
      nombre: value.nombre ?? null,
      slug: value.slug ?? null,
    };
  }

  return {
    id: toId(mention.id ?? mention),
    type: null,
    nombre: mention.nombre ?? null,
    slug: mention.slug ?? null,
  };
};

const normalizeImage = (
  imageDoc: AnyObject | null,
  cdnUrl: string | undefined,
  collectionPrefix: string,
) => {
  if (!imageDoc) return null;
  const sizes = imageDoc.sizes && typeof imageDoc.sizes === 'object' ? imageDoc.sizes : {};

  const sizeUrls: Record<string, string | null> = {};
  Object.entries(sizes).forEach(([sizeName, sizeValue]) => {
    const sizeDoc = sizeValue as AnyObject;
    sizeUrls[sizeName] =
      (sizeDoc?.url as string | undefined) ??
      buildUrl(cdnUrl, collectionPrefix, sizeDoc?.filename as string | undefined);
  });

  return {
    id: toId(imageDoc.id),
    filename: imageDoc.filename ?? null,
    mimeType: imageDoc.mimeType ?? null,
    width: imageDoc.width ?? null,
    height: imageDoc.height ?? null,
    urls: {
      original:
        imageDoc.url ??
        buildUrl(cdnUrl, collectionPrefix, imageDoc.filename),
      ...sizeUrls,
    },
    uploader: normalizeUser(imageDoc.uploader, cdnUrl),
  };
};

const normalizeFile = (
  fileDoc: AnyObject | null,
  cdnUrl: string | undefined,
  collectionPrefix: string,
) => {
  if (!fileDoc) return null;
  return {
    id: toId(fileDoc.id),
    filename: fileDoc.filename ?? null,
    mimeType: fileDoc.mimeType ?? null,
    filesize: fileDoc.filesize ?? null,
    url:
      fileDoc.url ??
      buildUrl(cdnUrl, collectionPrefix, fileDoc.filename),
    uploader: normalizeUser(fileDoc.uploader, cdnUrl),
  };
};

const mediaFromArray = (
  data: AnyObject | undefined,
  fieldName: 'imagenes' | 'archivos',
  cdnUrl: string | undefined,
) => {
  const collectionPrefix = fieldName === 'imagenes' ? 'media/imagenes' : 'media/archivos';
  const relationKey = fieldName === 'imagenes' ? 'imagen' : 'archivo';
  const docs = Array.isArray(data?.[fieldName]) ? data[fieldName] : [];

  if (fieldName === 'imagenes') {
    return docs
      .map((entry: AnyObject) => normalizeImage(entry?.[relationKey] ?? null, cdnUrl, collectionPrefix))
      .filter(Boolean);
  }

  return docs
    .map((entry: AnyObject) => normalizeFile(entry?.[relationKey] ?? null, cdnUrl, collectionPrefix))
    .filter(Boolean);
};

const extractPlainText = (value: any) => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const looksLikeHtml = /<[^>]+>/.test(trimmed);
  if (!looksLikeHtml) {
    return trimmed.replace(/\s+/g, ' ');
  }

  const $ = cheerio.load(trimmed);
  $('script, style, iframe, noscript, svg, canvas, audio, video, source').remove();
  $('br').replaceWith('\n');
  $('p, div, li, h1, h2, h3, h4, h5, h6, blockquote, section, article').each((_, element) => {
    const existing = $(element).text();
    $(element).text(`${existing}\n`);
  });

  const text = $.root().text().replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').replace(/[ \t]+/g, ' ');
  return text.replace(/\n{3,}/g, '\n\n').trim() || null;
};

const allocateYearTargets = (yearBuckets: Map<number, EntradaMeta[]>, target: number) => {
  const years = Array.from(yearBuckets.keys()).sort((a, b) => a - b);
  const result = new Map<number, number>();
  if (years.length === 0) return result;

  const totalAvailable = years.reduce((acc, year) => acc + (yearBuckets.get(year)?.length ?? 0), 0);
  const cappedTarget = Math.min(target, totalAvailable);
  const giveEveryYearOne = cappedTarget >= years.length;

  years.forEach((year) => {
    const available = yearBuckets.get(year)?.length ?? 0;
    const base = giveEveryYearOne ? Math.min(available, 1) : 0;
    result.set(year, base);
  });

  let assigned = Array.from(result.values()).reduce((a, b) => a + b, 0);
  let remaining = Math.max(cappedTarget - assigned, 0);

  if (remaining === 0) return result;

  const remainders: Array<{ year: number; fraction: number }> = [];

  years.forEach((year) => {
    const available = yearBuckets.get(year)?.length ?? 0;
    const current = result.get(year) ?? 0;
    const extraCapacity = Math.max(available - current, 0);
    if (extraCapacity <= 0) return;

    const proportionalRaw = (available / totalAvailable) * remaining;
    const proportionalFloor = Math.floor(proportionalRaw);
    const toAdd = Math.min(proportionalFloor, extraCapacity);

    result.set(year, current + toAdd);
    assigned += toAdd;
    remainders.push({ year, fraction: proportionalRaw - proportionalFloor });
  });

  remaining = Math.max(cappedTarget - assigned, 0);
  if (remaining === 0) return result;

  remainders
    .sort((a, b) => b.fraction - a.fraction)
    .forEach(({ year }) => {
      if (remaining <= 0) return;
      const available = yearBuckets.get(year)?.length ?? 0;
      const current = result.get(year) ?? 0;
      if (current >= available) return;
      result.set(year, current + 1);
      remaining -= 1;
    });

  if (remaining > 0) {
    years.forEach((year) => {
      if (remaining <= 0) return;
      const available = yearBuckets.get(year)?.length ?? 0;
      const current = result.get(year) ?? 0;
      if (current >= available) return;
      result.set(year, current + 1);
      remaining -= 1;
    });
  }

  return result;
};

const sampleWithSalaDiversity = (items: EntradaMeta[], target: number) => {
  if (target <= 0 || items.length === 0) return [] as EntradaMeta[];

  const bySala = groupBy(items, (item) => item.salaKey || 'sin-sala');
  const salaKeys = shuffle(Array.from(bySala.keys()));
  salaKeys.forEach((key) => {
    bySala.set(key, shuffle(bySala.get(key) ?? []));
  });

  const picked: EntradaMeta[] = [];
  let index = 0;

  while (picked.length < target) {
    const salaKey = salaKeys[index % salaKeys.length];
    const salaBucket = bySala.get(salaKey) ?? [];
    const next = salaBucket.pop();
    if (next) {
      picked.push(next);
    }

    const hasAnyLeft = salaKeys.some((key) => (bySala.get(key)?.length ?? 0) > 0);
    if (!hasAnyLeft) break;
    index += 1;
  }

  return picked;
};

const normalizeComentario = (comment: AnyObject, cdnUrl: string | undefined) => ({
  id: toId(comment.id),
  createdAt: comment.createdAt ?? null,
  updatedAt: comment.updatedAt ?? null,
  contenido: comment.contenido ?? null,
  autor: normalizeUser(comment.autor, cdnUrl),
  imagenes: mediaFromArray(comment, 'imagenes', cdnUrl),
  archivos: mediaFromArray(comment, 'archivos', cdnUrl),
  etiquetas: Array.isArray(comment.etiquetas)
    ? comment.etiquetas.map((tag: AnyObject) => ({
        id: toId(tag.id ?? tag),
        nombre: tag.nombre ?? null,
        slug: tag.slug ?? null,
      }))
    : [],
  mencionados: Array.isArray(comment.mencionados)
    ? comment.mencionados.map(normalizeMention).filter(Boolean)
    : [],
});

const normalizeEntrada = (
  entrada: AnyObject,
  comentarios: AnyObject[],
  cdnUrl: string | undefined,
) => {
  const createdAt = entrada.createdAt ? new Date(entrada.createdAt) : null;
  const year = createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.getFullYear() : null;

  return {
    id: toId(entrada.id),
    createdAt: entrada.createdAt ?? null,
    updatedAt: entrada.updatedAt ?? null,
    year,
    contenido: extractPlainText(entrada.contenido),
    autoriaGrupal: Boolean(entrada.autoriaGrupal),
    sala: entrada.sala
      ? {
          id: toId(entrada.sala.id ?? entrada.sala),
          nombre: entrada.sala.nombre ?? null,
          slug: entrada.sala.slug ?? null,
        }
      : null,
    grupo: entrada.grupo
      ? {
          id: toId(entrada.grupo.id ?? entrada.grupo),
          nombre: entrada.grupo.nombre ?? null,
          slug: entrada.grupo.slug ?? null,
        }
      : null,
    autor: normalizeUser(entrada.autor, cdnUrl),
    embedsYoutube: Array.isArray(entrada.embedsYoutube) ? entrada.embedsYoutube : [],
    embedsVimeo: Array.isArray(entrada.embedsVimeo) ? entrada.embedsVimeo : [],
    etiquetas: Array.isArray(entrada.etiquetas)
      ? entrada.etiquetas.map((tag: AnyObject) => ({
          id: toId(tag.id ?? tag),
          nombre: tag.nombre ?? null,
          slug: tag.slug ?? null,
        }))
      : [],
    mencionados: Array.isArray(entrada.mencionados)
      ? entrada.mencionados.map(normalizeMention).filter(Boolean)
      : [],
    imagenes: mediaFromArray(entrada, 'imagenes', cdnUrl),
    archivos: mediaFromArray(entrada, 'archivos', cdnUrl),
    comentarios: comentarios.map((comment) => normalizeComentario(comment, cdnUrl)),
  };
};

const fetchEntradaMetadata = async () => {
  const metadata: EntradaMeta[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await payload.find({
      collection: 'entradas',
      where: {
        isDeleted: {
          not_equals: true,
        },
      },
      page,
      limit: ENTRADAS_PAGE_SIZE,
      depth: 0,
      sort: 'createdAt',
      overrideAccess: true,
      context: {
        skipHooks: true,
      },
    });

    result.docs.forEach((doc: AnyObject) => {
      const createdAt = doc.createdAt ? new Date(doc.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return;

      const year = createdAt.getFullYear();
      if (year < 2018) return;

      const salaKey = toId(doc.sala) ?? 'sin-sala';
      const id = toId(doc.id);
      if (!id) return;

      metadata.push({
        id,
        year,
        salaKey,
      });
    });

    hasNextPage = result.hasNextPage;
    page += 1;
  }

  return metadata;
};

const fetchEntradasByIds = async (ids: string[]) => {
  if (ids.length === 0) return [] as AnyObject[];

  const response = await payload.find({
    collection: 'entradas',
    where: {
      and: [
        {
          id: {
            in: ids,
          },
        },
        {
          isDeleted: {
            not_equals: true,
          },
        },
      ],
    },
    limit: ids.length,
    depth: 2,
    overrideAccess: true,
    context: {
      skipHooks: true,
      skipPopulateComentarios: true,
    },
  });

  return response.docs as AnyObject[];
};

const fetchComentariosByEntradaIds = async (entradaIds: string[]) => {
  const all: AnyObject[] = [];
  if (entradaIds.length === 0) return all;

  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await payload.find({
      collection: 'comentarios',
      where: {
        and: [
          {
            entrada: {
              in: entradaIds,
            },
          },
          {
            isDeleted: {
              not_equals: true,
            },
          },
        ],
      },
      page,
      limit: COMENTARIOS_PAGE_SIZE,
      sort: 'createdAt',
      depth: 2,
      overrideAccess: true,
      context: {
        skipHooks: true,
      },
    });

    all.push(...(response.docs as AnyObject[]));
    hasNextPage = response.hasNextPage;
    page += 1;
  }

  return all;
};

const comentariosByEntrada = (comentarios: AnyObject[]) => {
  const grouped = new Map<string, AnyObject[]>();
  comentarios.forEach((comment) => {
    const entradaId = toId(comment.entrada);
    if (!entradaId) return;
    const current = grouped.get(entradaId);
    if (current) {
      current.push(comment);
    } else {
      grouped.set(entradaId, [comment]);
    }
  });
  return grouped;
};

const distributionFromEntries = (entries: AnyObject[]) => {
  const yearDistribution: Record<string, number> = {};
  const salaDistribution: Record<string, number> = {};

  entries.forEach((entry) => {
    const year = entry.year ?? 'unknown';
    const sala = entry.sala?.slug ?? entry.sala?.id ?? 'sin-sala';

    yearDistribution[`${year}`] = (yearDistribution[`${year}`] ?? 0) + 1;
    salaDistribution[`${sala}`] = (salaDistribution[`${sala}`] ?? 0) + 1;
  });

  return {
    yearDistribution,
    salaDistribution,
  };
};

async function main() {
  const startedAt = new Date();
  const { target } = parseArgs();
  const cdnUrl = process.env.DO_SPACES_CDN_URL;

  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET is required');
  }

  console.log('[export] Initializing Payload...');
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    local: true,
  });

  console.log('[export] Fetching entrada metadata...');
  const allMetadata = await fetchEntradaMetadata();
  if (allMetadata.length === 0) {
    throw new Error('No entradas found for year >= 2018');
  }

  const metadataByYear = new Map<number, EntradaMeta[]>();
  allMetadata.forEach((entry) => {
    const current = metadataByYear.get(entry.year);
    if (current) {
      current.push(entry);
    } else {
      metadataByYear.set(entry.year, [entry]);
    }
  });

  const yearTargets = allocateYearTargets(metadataByYear, target);
  const sampled: EntradaMeta[] = [];

  Array.from(metadataByYear.keys())
    .sort((a, b) => a - b)
    .forEach((year) => {
      const yearItems = metadataByYear.get(year) ?? [];
      const yearTarget = yearTargets.get(year) ?? 0;
      sampled.push(...sampleWithSalaDiversity(yearItems, yearTarget));
    });

  const sampledIds = uniq(sampled.map((item) => item.id));
  console.log(`[export] Selected ${sampledIds.length} entradas (target ${target})`);

  console.log('[export] Hydrating selected entradas...');
  const hydratedEntradas = await fetchEntradasByIds(sampledIds);
  const entradaById = new Map<string, AnyObject>();
  hydratedEntradas.forEach((entry) => {
    const id = toId(entry.id);
    if (id) entradaById.set(id, entry);
  });

  console.log('[export] Fetching comentarios...');
  const comentarios = await fetchComentariosByEntradaIds(sampledIds);
  const groupedComentarios = comentariosByEntrada(comentarios);

  const normalized = sampledIds
    .map((id) => {
      const entrada = entradaById.get(id);
      if (!entrada) return null;
      const relatedComentarios = groupedComentarios.get(id) ?? [];
      return normalizeEntrada(entrada, relatedComentarios, cdnUrl);
    })
    .filter(Boolean) as AnyObject[];

  const folderName = `json-sample/${timestampForFolder(new Date())}`;
  const outputDir = path.resolve(process.cwd(), folderName);
  await fs.mkdir(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, 'data.json');
  const jsonlPath = path.join(outputDir, 'data.jsonl');
  const metadataPath = path.join(outputDir, 'metadata.json');

  const jsonlContent = normalized.map((item) => JSON.stringify(item)).join('\n');
  await fs.writeFile(jsonPath, JSON.stringify(normalized, null, 2), 'utf8');
  await fs.writeFile(jsonlPath, jsonlContent, 'utf8');

  const sampledCounts = distributionFromEntries(normalized);
  const availableByYear = Array.from(metadataByYear.entries())
    .sort((a, b) => a[0] - b[0])
    .reduce<Record<string, number>>((acc, [year, docs]) => {
      acc[`${year}`] = docs.length;
      return acc;
    }, {});

  const metadata = {
    generatedAt: new Date().toISOString(),
    startedAt: startedAt.toISOString(),
    outputDir,
    target,
    selected: normalized.length,
    sourceFilters: {
      minYear: 2018,
      excludeDeleted: true,
    },
    availableByYear,
    selectedByYear: sampledCounts.yearDistribution,
    selectedBySala: sampledCounts.salaDistribution,
    comentariosCount: comentarios.length,
    cndUrlConfigured: Boolean(cdnUrl),
  };

  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

  console.log('[export] Completed');
  console.log(`[export] Folder: ${outputDir}`);
  console.log(`[export] Entradas: ${normalized.length}`);
  console.log(`[export] Comentarios: ${comentarios.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error('[export] Failed:', error.message);
    console.error(error);
    process.exit(1);
  });
