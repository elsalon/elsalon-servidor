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

*/



import payload from 'payload'
import 'dotenv/config';
import axios from 'axios'
import path from 'path';

import fs from 'fs'; // Import the standard fs module
import fsPromises from 'fs/promises'; // Import fs/promises for async operations



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




const RetrieveNextPage = async (page) => {
    try {
        const response = await fetchHumhub.get(`/${endpoint}?page=${page}`);
        const results = response.data.results;
        const pages = response.data.pages;
        
        console.log(`Downloading endpoint ${endpoint} page: ${page}/${pages}`);
        
        for (const user of results) {
            if (hardLimit == -1 || imported < hardLimit) { // Check if you should import
                await importUser(user);
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