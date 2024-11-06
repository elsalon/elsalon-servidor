/*

Como unir entradas a una sala?
Cada espacio tiene un contentcontainer_id: espacio.contentcontainer_id. 
Hay que hacer una lista de por ejemplo todos los espacios relacionados a PAV1 y un array de sus posibles contentcontainer_id
{
    slug: 'pav1',
    id: 123, // id payload
    content_ids: [1,2,3,4,5]
}

Cada entrada de humhub tiene un parametro entrada.content.metadata.contentcontainer_id
Entonces tenemos que buscar si ese contentcontainer_id esta en la lista de content_ids de un espacio y si esta, asignarle el id de espacio correspondiente

Para saber si una entrada va al perfil del usuario, hay que tambien guardar los contentcontainer_id de cada usuario en user.account.contentcontainer_id


/// ejemplo de objeto post
 {
    "id": 50994,
    "message": ".",
    "content": {
        "id": 418237,
        "metadata": {
            "id": 418237,
            "guid": "a08b2527-80ed-4a39-bf90-597275e5651e",
            "object_model": "humhub\\modules\\post\\models\\Post",
            "object_id": 50994,
            "visibility": 1,
            "state": 1,
            "archived": false,
            "hidden": false,
            "pinned": false,
            "locked_comments": false,
            "created_by": {
                "id": 27,
                "guid": "641d17d0-cc04-40a6-b4f0-31250ce861df",
                "display_name": "Gonzalo Moiguer",
                "url": "http://elsalon.org/u/gonz+moiguer/"
            },
            "created_at": "2024-11-04 23:56:00",
            "updated_by": {
                "id": 27,
                "guid": "641d17d0-cc04-40a6-b4f0-31250ce861df",
                "display_name": "Gonzalo Moiguer",
                "url": "http://elsalon.org/u/gonz+moiguer/"
            },
            "updated_at": "2024-11-04 23:56:00",
            "scheduled_at": null,
            "url": "/u/gonz+moiguer/post/post/view?id=50994",
            "contentcontainer_id": 40,
            "stream_channel": "default"
        },
        "comments": {
            "total": "0",
            "latest": []
        },
        "likes": {
            "total": 0
        },
        "topics": [],
        "files":[
                    {
                        "id": 80462,
                        "guid": "5b3a14ab-7232-4072-920e-1e94808d4796",
                        "mime_type": "image/png",
                        "size": "1334182",
                        "file_name": "image.png",
                        "url": "http://elsalon.org/file/file/download?guid=5b3a14ab-7232-4072-920e-1e94808d4796&hash_sha1=35e42b8c"
                    }
                ]
    }
},
*/

import payload from 'payload'
import 'dotenv/config';
import axios from 'axios'
import path from 'path';

import fs from 'fs'; // Import the standard fs module
import fsPromises from 'fs/promises'; // Import fs/promises for async operations

import * as cheerio from 'cheerio'; // Import Cheerio for HTML parsing
var showdown  = require('showdown'),
    converter = new showdown.Converter();

const args = process.argv;
const hardLimit = args[2] || -1;
var imported = 0;
const endpoint = "post";

console.log("Import El Salon humhub. Descargando endpoint", endpoint, "con limite", hardLimit);
const filename = `humhub_importlogs_${endpoint}.json`
const {PAYLOAD_SECRET, HUMHUB_TOKEN, HUMHUB_DEFAULTPASS } = process.env

const fetchHumhub = axios.create({
    baseURL: 'https://elsalon.org/api/v1',
    timeout: 100000,
    headers: { 'Authorization': `Bearer ${HUMHUB_TOKEN}` }
});

var importedUsers = [];
var importedPosts = [];
var containerToSala = [];


const init = async () => {
    console.log("Loading Payload")
    await payload.init({
        secret: PAYLOAD_SECRET,
        local: true, // Enables local mode, doesn't spin up a server or frontend
        email: {
            transport: {
                sendMail: () => Promise.resolve(), // No-op email function
            },
            fromName: 'Test',
            fromAddress: 'test@test.com',
        },
        onInit: StartImport,
    })
}


const StartImport = async() =>{
    await LoadLogsCreatedUsers();
    await LoadContainerToSala();
    await LoadLogsCreatedPosts();
    // Una vez cargado el archivo, empiezo a descargar los datos
    RetrieveNextPage(1);
}


const LoadLogsCreatedUsers = async () => {
    const filename = `humhub_importlogs_users.json`
    const filePath = `src/migracion/logs/${filename}`;

    try {
        const data = await fsPromises.readFile(filePath, 'utf8');
        importedUsers = JSON.parse(data);
    }
    catch (err) {
        console.log("No se pudo cargar el archivo de logs de usuarios creados");
    }
}

const LoadContainerToSala = async () => {
    const filename = `containerToSala.json`
    const filePath = `src/migracion/${filename}`;

    try {
        const data = await fsPromises.readFile(filePath, 'utf8');
        containerToSala = JSON.parse(data);
    }
    catch (err) {
        console.log("No se pudo cargar el archivo de containerToSala");
    }
}

const LoadLogsCreatedPosts = async () => {
    const filename = `humhub_importlogs_posts.json`
    const filePath = `src/migracion/logs/${filename}`;

    try {
        const data = await fsPromises.readFile(filePath, 'utf8');
        importedPosts = JSON.parse(data);
    }
    catch (err) {
        console.log("No se pudo cargar el archivo de logs de posts creados");
    }
}

const SaveLogs = () => {
    const filename = `humhub_importlogs_posts.json`
    const filePath = `src/migracion/logs/${filename}`;
    console.log(`Guardando ${importedPosts.length} entradas del endpoint ${endpoint} al archivo ${filename}`);
    fs.writeFile(filePath, JSON.stringify(importedPosts), 'utf8', onWriteFile)
}
const SaveUserLogs = () => {
    const filename = `humhub_importlogs_users.json`
    const filePath = `src/migracion/logs/${filename}`;
    // console.log(`Guardando ${importedUsers.length} usuarios creados al archivo ${filename}`);
    fs.writeFile(filePath, JSON.stringify(importedUsers), 'utf8', onWriteFile)
}

const onWriteFile = (err) => {
    if (err) {
      console.log("Error al escribir archivo", err)
    } else {
      console.log("Archivo logs guardado correctamente")
    }
}


const RetrieveNextPage = async (page) => {
    try {
        console.log(`Downloading endpoint ${endpoint} page: ${page}/${pages}`);
        const response = await fetchHumhub.get(`/${endpoint}?page=${page}`);
        const results = response.data.results;
        const pages = response.data.pages;
        
        
        for (const post of results) {
            if (hardLimit == -1 || imported < hardLimit) { // Check if you should import
                await ImportPost(post);
            }
        }
        
        // Move to the next page after all users on the current page are processed
        if (page < pages) {
            await RetrieveNextPage(page + 1);
        } else {
            console.log("IMPORT COMPLETE!");
        }
    } catch (error) {
        console.log("Error", error);
    }
};

const ImportPost = async (post) => {
    // Primero verifico si el post ya fue importado
    const _imported = importedPosts.find(p => p.hhid == post.id);
    if(_imported) {
        console.log("Post ya importado", post.id);
        return;
    }
    // Verifico si el post tiene un contentcontainer_id valido
    if (!post.content.metadata.contentcontainer_id) {
        console.log("Post sin contentcontainer_id", post.id);
        return;
    }
    // Verifico si el contentcontainer_id esta en la lista de containerToSala
    const container_id = post.content.metadata.contentcontainer_id;
    const sala = containerToSala.find(s => s.content_ids.includes(container_id));
    // Si la sala no existe no pasa nada, lo importo igual y queda asignado a bitácora del usuario

    // busco usuario importado que coincida con el mail
    // let autor = await payload.find({
    //     collection: 'users',
    //     where: {
    //         email: {
    //             equals: post.content.metadata.created_by.email
    //         }
    //     }
    // });
    let autor = importedUsers.find(u => u.hhid == post.content.metadata.created_by.id);

    if(!autor){
        console.log("No se encontro el autor del post", post.id, post.content.metadata.created_by.display_name, post.content.metadata.created_by.id);
        autor = await ImportUser(post.content.metadata.created_by);
        console.log("Autor importado", autor.id)
    }

    console.log("--- Importando post", post.id, post.content.metadata.created_by.display_name)


    let {imagenes, archivos, imagenesImportadas} = await ProcessUploads(post.content, autor);

    const contenido = ParseHumHubEntriesToSalon(post.message, imagenesImportadas);
    // Imagenes y archivos. Convertir array de ids en formato [{imagen:id}]
    imagenes = imagenes.map(i => ({imagen: i}));
    archivos = archivos.map(i => ({archivo: i}));

    // TODO Parse markdown y formato especial de imagenes
    let data = {
        autor: autor.id, // id es el id de payload al importar
        autoriaGrupal: false,
        contenido,
        imagenes,
        archivos,
        // mencionados TODO
        sala: sala ? sala.id : null,
        createdAt: new Date(post.content.metadata.created_at).toISOString()
    }

    try {
        const response = await payload.create({
            collection: 'entradas',
            data,
        });
        console.log("Entrada creada", response.id)
        importedPosts.push({
            id: response.id,
            hhid: post.id,
            hhguid: post.content.metadata.guid,
        });
        SaveLogs();

        // Importar Comentario
        if(post.content.comments.total > 0){
            await ImportComments(post, response);
        }

        imported++
    } catch (e) {
        console.log(e)
    }
    
}


async function ImportComments(hhpost, salonpost){
    /*
    {
        "id": 39065,
        "message": "[https://drive.google.com/file/d/1aS_4NrqO5rVNskJaCdNlS4354mAwxL0r/view?usp=drivesdk](https://drive.google.com/file/d/1aS_4NrqO5rVNskJaCdNlS4354mAwxL0r/view?usp=drivesdk)",
        "objectModel": "humhub\\modules\\post\\models\\Post",
        "objectId": 50950,
        "createdBy": {
            "id": 4479,
            "guid": "adf545d4-860b-4850-92b5-af80fab5c27c",
            "display_name": "Ines Amanzio",
            "url": "http://elsalon.org/u/inesamanzio/"
        },
        "createdAt": "2024-11-01 09:52:00",
        "likes": {
            "total": 0
        },
        "files": []
    },
    */
    const content_id = hhpost.content.id;
    const response = await fetchHumhub.get(`/comment/content/${content_id}`);
    const results = response.data.results;
    
    
    for (const comment of results) {
        if (hardLimit == -1 || imported < hardLimit) { // Check if you should import
            await ImportComment(comment, salonpost);
        }
    }
}

async function ImportComment(hhcomment, salonpost){
    // busco usuario importado que coincida con el mail
    let autor = importedUsers.find(u => u.hhid == hhcomment.createdBy.id);

    if(!autor){
        console.log("No se encontro el autor del comentario", hhcomment.id, hhcomment.createdBy.display_name, hhcomment.createdBy.id);
        autor = await ImportUser(hhcomment.createdBy);
    }

    console.log("--- Importando comentario", hhcomment.id, hhcomment.createdBy.display_name)

    let {imagenes, archivos, imagenesImportadas} = await ProcessUploads(hhcomment, autor);

    const contenido = ParseHumHubEntriesToSalon(hhcomment.message, imagenesImportadas);
    // Imagenes y archivos. Convertir array de ids en formato [{imagen:id}]
    imagenes = imagenes.map(i => ({imagen: i}));
    archivos = archivos.map(i => ({archivo: i}));
    let data = {
        autor: autor.id, // id es el id de payload al importar
        entrada: salonpost.id, // entrada parent
        contenido,
        imagenes,
        archivos,
        createdAt: new Date(hhcomment.createdAt).toISOString()
    }

    try {
        const response = await payload.create({
            collection: 'comentarios',
            data,
        });
        console.log("Comentario creada", response.id)
    } catch (e) {
        console.log(e)
    }
}


async function ProcessUploads(entry, autor){
    let imagenes = [],
        imagenesImportadas = [],
        archivos = [];

    for(const file of entry.files){
        // console.log("Archivo", file)
        const { id, file_name, guid } = file;
        const tempFilePath = path.resolve("temp", file_name);

        await DownloadFileSalon(`/file/download/${id}`, tempFilePath);
        console.log("File downloaded")

        // Salteo los videos
        if(file.mime_type?.includes("video") ){
            console.log("Video salteado")
            continue;
        }
        if(file.mime_type?.includes("image") ){
            // GUARDO Y SUBO LA IMAGEN
            const res = await payload.create({
                collection: 'imagenes',
                filePath: tempFilePath,
                data: {
                    uploader: autor.id,
                    focalX: 0.5,
                    focalY: 0.5,
                }
            });
            if (res) {
                console.log("Imagen subida correctamente")
                imagenes.push(res.id);
                imagenesImportadas.push({
                    id: res.id,
                    hhid: id,
                    hhguid: guid,
                });
            }
        }else{
            // GUARDO Y SUBO EL ARCHIVO
            const res = await payload.create({
                collection: 'archivos',
                filePath: tempFilePath,
                data:{
                    uploader: autor.id,
                }
            });
            if (res) {
                console.log("Archivo subido correctamente")
                archivos.push(res.id);
            }
        }
        // Clean up temporary file
        await fsPromises.unlink(tempFilePath)
    }
    return {imagenes, archivos, imagenesImportadas};
}

async function DownloadFileSalon(url, filePath) {
    return new Promise((resolve, reject) => {
      fetchHumhub.get(url, { responseType: 'stream' })
        .then(response => {
          const stream = response.data.pipe(fs.createWriteStream(filePath));
          stream.on('finish', resolve);
          stream.on('error', reject);
        })
        .catch(reject);
    });
}

async function DownloadAvatarSalon(url, destinationPath) {
    try {
        // Ensure the destination directory exists
        
        const directory = path.dirname(destinationPath);
        await fsPromises.mkdir(directory, { recursive: true });

        // Make the GET request with axios
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
        });

        // Create a writable stream to the destination file
        const writer = fs.createWriteStream(destinationPath);

        // Pipe the response data to the file
        response.data.pipe(writer);

        // Return a promise that resolves when the write stream finishes
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Error downloading file:', error);
        throw error; // Re-throw the error for further handling if needed
    }
}

function ParseHumHubEntriesToSalon(markdown, imagenesImportadas){
    // Convierto en html
    var html = converter.makeHtml(markdown);
    // Convierto las imagenes en formato propio de salon [image:id]
    html = ReplaceImgTags(html, imagenesImportadas);
    // Quito tags innecesario que no puedo desactivar en showdown
    html = RemoveHeadBodyTags(html);
    return html;
}

function RemoveHeadBodyTags(html){
    // Load the HTML into Cheerio
    const $ = cheerio.load(html);
    // Remove the <head> and <body> tags
    var bodyContent = $('body').html();
    // Return the modified HTML as a string
    return bodyContent;
}


function ReplaceImgTags(htmlString, imagenesImportadas) {
    // Load the HTML into Cheerio
    const $ = cheerio.load(htmlString);
    
    // Select all <img> tags
    $('img').each((index, img) => {
        const src = $(img).attr('src'); // Get the src attribute
        
        if (src && src.startsWith("file-guid:")) {
            const fileGuid = src.split(":")[1];
            const image = imagenesImportadas.find(i => i.hhguid == fileGuid);
            const replacement = `[image:${image.id}]` // Formato propio de salon
            console.log(`Found image with src: ${src}`, image.id, replacement);
            // Replace the entire <img> tag with the replacement content
            $(img).replaceWith(replacement);
        }
    });
    
    // Return the modified HTML as a string
    return $.html();
}


async function ImportUser(user){
    const { display_name, guid, id } = user;
    // Get account
    const response = await fetchHumhub.get(`/user/${id}`);
    const _user = response.data;
    const { email, username, contentcontainer_id } = _user.account;
    console.log("---- Importando usuario", display_name, email, contentcontainer_id, id, guid)
    const userExists = await payload.find({
        collection: 'users',
        where: {
            email: {
                equals: email,
            },
        },
    });

    if (userExists.docs.length > 0) {
        console.log("Usuario ya existe en db", email)
        return userExists.docs[0];
    }
    try {
        const userData = {
            nombre: display_name,
            email: email,
            password: HUMHUB_DEFAULTPASS,
            _verified: true,
        }
        console.log("Creando usuario", userData.email)
        const imageUrl = "https://elsalon.org/uploads/profile_image/" + guid + ".jpg"
        const filename = username + ".jpg"
        const tempFilePath = path.resolve("temp", filename);
        try{
            await DownloadAvatarSalon(imageUrl, tempFilePath);
            console.log("File downloaded", tempFilePath);
            const res = await payload.create({
                collection: 'avatares',
                filePath: tempFilePath,
                data: {
                    focalX: 0.5,
                    focalY: 0.5,
                }
            });
            if(res.id){
                console.log("Avatar subido correctamente")
                userData.avatar = res.id;
            }
            // Clean up temporary file
            await fsPromises.unlink(tempFilePath)
        }catch(e){
            console.log("Error al subir avatar. Prosigo.")
        }

        // Creo el usuario
        const response = await payload.create({
            collection: 'users',
            data: userData,
        });

        console.log("Usuario creado", response.id)
        const logData = {
            hhid: id,
            hhguid: guid,
            email: email,
            id: response.id,
            contentcontainer_id: contentcontainer_id,
        }
        importedUsers.push(logData);
        SaveUserLogs();
        return response;
    } catch (e) {
        console.log(e)
    }
}

init();