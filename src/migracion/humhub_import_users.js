//
//            COMO USAR ESTE SCRIPT
//
// La manera de usar este script es corriendo desde linea de comando
// Y agregar como parametro la url que se quiere obtener
// Este script va a descargar todas las paginas que encuentra de esa API
// Y luego las guarda en un archivo json
//
import payload from 'payload'
import 'dotenv/config';
import axios from 'axios'
import path from 'path';

import fs from 'fs'; // Import the standard fs module
import fsPromises from 'fs/promises'; // Import fs/promises for async operations



const args = process.argv;
const endpoint = "user";
const hardLimit = args[2] || -1;
var imported = 0;

console.log("Import El Salon humhub. Descargando endpoint", endpoint, "con limite", hardLimit);
const filename = `humhub_importlogs_users.json`
const {PAYLOAD_SECRET, HUMHUB_TOKEN, HUMHUB_DEFAULTPASS } = process.env

const fetchHumhub = axios.create({
    baseURL: 'https://elsalon.org/api/v1',
    timeout: 100000,
    headers: { 'Authorization': `Bearer ${HUMHUB_TOKEN}` }
});

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
    await LoadLogsFile();
    
    // Una vez cargado el archivo, empiezo a descargar los datos
    RetrieveNextPage(1);
}

var documents = []
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

const SaveLogs = () => {
    console.log(`Guardando ${documents.length} entradas del endpoint ${endpoint} al archivo ${filename}`);
    fs.writeFile(`src/migracion/logs/${filename}`, JSON.stringify(documents), 'utf8', onWriteFile)
}
const onWriteFile = (err) => {
    if (err) {
      console.log("Error al escribir archivo", err)
    } else {
      console.log("Archivo guardado correctamente")
    }
}

const LoadLogsFile = async () => {
    const filePath = `src/migracion/logs/${filename}`;
    
    // Ensure the file exists and is initialized with an empty array if needed
    try {
        await fsPromises.access(filePath); // Check if the file exists
        const stats = await fsPromises.stat(filePath); // Get file stats
        if (stats.size === 0) {
            await fsPromises.writeFile(filePath, '[]', 'utf8'); // Write an empty array if file is empty
            console.log(`Archivo '${filename}' creado con contenido inicial []`);
        }
    } catch (error) {
        // If the file doesn't exist, create it
        await fsPromises.writeFile(filePath, '[]', 'utf8'); // Create file with initial content
        console.log(`Archivo '${filename}' creado con contenido inicial []`);
    }

    // Now read the file
    console.log(`Cargando archivo '${filename}'`);
    try {
        const data = await fsPromises.readFile(filePath, 'utf8'); // Read the file with 'utf8' encoding
        documents = JSON.parse(data); // Parse the JSON data
        console.log("Archivo cargado correctamente");
    } catch (err) {
        console.log("Error al leer archivo", err);
    }
};


const importUser = async (user) => {
    const { display_name, account } = user;
    const { email, username } = account;
    console.log("---- Importando usuario", display_name)
    const userExists = await payload.find({
        collection: 'users',
        where: {
            email: {
                equals: email,
            },
        },
    });

    if (userExists.docs.length > 0) {
        console.log("Usuario ya existe", email)
        return
    }
    try {
        const userData = {
            nombre: display_name,
            email: email,
            password: HUMHUB_DEFAULTPASS,
            _verified: true,
        }
        console.log("Creando usuario", userData.email)

        // Subo la imagen de perfil
        const imageUrl = "https://elsalon.org/uploads/profile_image/" + user.guid + ".jpg"
        const filename = username + ".jpg"
        const imageResponse = await UploadImageFromUrl(imageUrl, filename)
        if (imageResponse.success) {
            console.log("Imagen subida correctamente")
            userData.avatar = imageResponse.data.id
        }

        const response = await payload.create({
            collection: 'users',
            data: userData,
        });

        console.log("Usuario creado", response.id)
        const logData = {
            hhid: user.id,
            hhguid: user.guid,
            email: user.email,
            id: response.id,
            contentcontainer_id: user.account.contentcontainer_id,
        }
        documents.push(logData)
        SaveLogs();

        imported++

    } catch (e) {
        console.log(e)
    }
}

async function UploadImageFromUrl(imageUrl, filename = 'image-from-url.jpg') {  
    try {
        const folder = "temp";
        const tempFilePath = path.resolve(folder, filename);
        await DownloadFile(imageUrl, tempFilePath);

        // Upload to PayloadCMS
        const uploadResponse = await payload.create({
            collection: 'avatares',
            filePath: tempFilePath,
            data: {
                focalX: 0.5,
                focalY: 0.5,
            }
        });
        // Clean up temporary file
        await fsPromises.unlink(tempFilePath)
        
        return {
            success: true,
            data: uploadResponse
        };
    } catch (error) {
        console.error('Error uploading image');

        // Clean up if the file exists
        try {
            await fsPromises.unlink(tempFilePath);
        } catch (cleanupError) {
            // Ignore cleanup errors and log them if necessary
            console.error('Cleanup error');
        }

        return {
            success: false,
            error: error.message
        };
    }
}

async function DownloadFile(url, destinationPath) {
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


init();