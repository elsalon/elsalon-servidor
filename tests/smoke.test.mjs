// Smoke tests: verifican que servidor e interfaz levantan, se conectan y que lo básico
// (login, lectura, publicar, comentar, aprecio, subir imagen) funciona.
// Sin dependencias: usa node:test + fetch nativos (Node 18+).
//
// Uso:  yarn test:smoke   (lee tests/smoke.env, ver tests/smoke.env.example)
// Correr contra local o test, NUNCA contra prod: crea y borra contenido real.

import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Carga tests/smoke.env si existe (KEY=valor por línea); las variables de entorno tienen prioridad
try {
    const file = readFileSync(new URL('./smoke.env', import.meta.url), 'utf8')
    for (const line of file.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
        if (m && !(m[1] in process.env)) process.env[m[1]] = m[2]
    }
} catch { }

const API = process.env.API_URL || 'http://localhost:3000'
const FRONT = process.env.FRONT_URL || 'http://localhost:8081'
const { TEST_EMAIL, TEST_PASSWORD } = process.env

let token
const creados = [] // [coleccion, id] para limpiar al final

async function api(path, { method = 'GET', body, form } = {}) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    if (body) headers['Content-Type'] = 'application/json'
    const res = await fetch(API + path, { method, headers, body: form ?? (body && JSON.stringify(body)) })
    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch { }
    assert.ok(res.ok, `${method} ${path} -> ${res.status} ${text.slice(0, 300)}`)
    return json
}

// --- Servidor ---

test('servidor responde y lee la base de datos (sala el-salon)', async () => {
    const res = await api('/api/salas?where[slug][equals]=el-salon&depth=0')
    assert.equal(res.docs.length, 1)
})

test('login', { skip: !TEST_EMAIL && 'falta TEST_EMAIL/TEST_PASSWORD' }, async () => {
    const res = await api('/api/users/login', { method: 'POST', body: { email: TEST_EMAIL, password: TEST_PASSWORD } })
    assert.ok(res.token)
    token = res.token
})

// Tests que requieren login: se saltean en ejecución si el login no corrió
const testAuth = (nombre, fn) => test(nombre, t => token ? fn(t) : t.skip('sin login'))

testAuth('usuario actual (/me)', async () => {
    const res = await api('/api/users/me')
    assert.equal(res.user?.email?.toLowerCase(), TEST_EMAIL.toLowerCase())
})

testAuth('feed, búsqueda y notificaciones', async () => {
    const feed = await api('/api/salas/feed')
    assert.ok(Array.isArray(feed.docs))
    await api('/api/busqueda?query=a&categorias=entradas,usuarios')
    await api('/api/notificaciones/nuevas')
})

let imagenId
testAuth('subir imagen (S3 + sharp)', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
    const form = new FormData()
    form.append('file', new Blob([png], { type: 'image/png' }), `smoke-test-${Date.now()}.png`)
    const res = await api('/api/imagenes', { method: 'POST', form })
    imagenId = res.doc.id
    creados.push(['imagenes', imagenId])
    assert.ok(res.doc.sizes?.thumbnail, 'sharp no generó thumbnail')
})

let entradaId
testAuth('publicar entrada en bitácora y leerla', async () => {
    const contenido = `<p>smoke test ${new Date().toISOString()}</p>`
    const res = await api('/api/entradas', {
        method: 'POST',
        // Mismo body que manda CrearEntradaDrawer.vue (sala null = bitácora)
        body: {
            contenido, autoriaGrupal: false, sala: null,
            imagenes: imagenId ? [{ imagen: imagenId }] : [], archivos: [],
            mencionados: [], etiquetas: [], embedsYoutube: [], embedsVimeo: [],
        },
    })
    entradaId = res.doc.id
    creados.push(['entradas', entradaId])
    const leida = await api(`/api/entradas/${entradaId}`)
    assert.equal(leida.contenido, contenido)
})

testAuth('comentar y apreciar la entrada', async () => {
    assert.ok(entradaId, 'no se creó la entrada')
    const com = await api('/api/comentarios', { method: 'POST', body: { entrada: entradaId, contenido: '<p>comentario smoke test</p>', autoriaGrupal: false, imagenes: [], archivos: [], mencionados: [], etiquetas: [], embedsYoutube: [], embedsVimeo: [] } })
    creados.push(['comentarios', com.doc.id])
    const ap = await api('/api/aprecio', { method: 'POST', body: { contenidoid: entradaId, contenidotipo: 'entrada' } })
    creados.push(['aprecio', ap.doc.id])
})

after(async () => {
    for (const [coleccion, id] of creados.reverse()) {
        await api(`/api/${coleccion}/${id}`, { method: 'DELETE' }).catch(e => console.warn('No se pudo borrar', coleccion, id, e.message))
    }
})

// --- Interfaz ---

test('interfaz renderiza (SSR) /login', async () => {
    const res = await fetch(`${FRONT}/login`)
    assert.equal(res.status, 200)
    assert.match(await res.text(), /<html/i)
})

test('interfaz se conecta al servidor (/cache/config trae salas)', async () => {
    const res = await fetch(`${FRONT}/cache/config`)
    assert.equal(res.status, 200)
    assert.match(await res.text(), /el-salon/)
})
