//
//            COMO USAR ESTE SCRIPT
//
// La manera de usar este script es corriendo desde linea de comando
// Y agregar como parametro la url que se quiere obtener
// Este script va a descargar todas las paginas que encuentra de esa API
// Y luego las guarda en un archivo json
//


import axios from 'axios'
var fs = require('fs');

const args = process.argv;
const endpoint = args[2] || "user";
console.log("Import El Salon humhub. Descargando endpoint", endpoint);
const filename = `humhub_${endpoint}.json`


const token = "XSKsjaD7cVqpPDTgwkWuUUzPMzp4ylmRHt0GgSUJEWrSgXQ-Oy8LnXipQfU7v_vLIxe-7QYzK5tJMH5XiPd2zr"
const fetchHumhub = axios.create({
  baseURL: 'https://elsalon.org/api/v1',
  timeout: 100000,
  headers: {'Authorization': `Bearer ${token}`}
});

var documents = []
const RetrieveNextPage = (page) => {
    fetchHumhub.get(`/${endpoint}?page=${page}`).then((response) => {
        const results = response.data.results
        // console.log(usuarios)
        const pages = response.data.pages;
        console.log(`descargando ${endpoint}: ${page}/${pages}`)
        
        documents = documents.concat(results)
        if (page < pages) {
            RetrieveNextPage(page + 1)
        } else {
            SaveDocsToFile()
        }
    }).catch((error) => {
        console.log("Error", error)
    })
}

const SaveDocsToFile = () => {
    console.log(`Guardando ${documents.length} entradas del endpoint ${endpoint} al archivo ${filename}`);
    fs.writeFile(`src/migracion/${filename}`, JSON.stringify(documents), 'utf8', onWriteFile)
}

const onWriteFile = (err) => {
  if (err) {
    console.log("Error al escribir archivo", err)
  } else {
    console.log("Archivo guardado correctamente")
  }
}

RetrieveNextPage(1);