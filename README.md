# Payload Blank Template

A blank template for [Payload](https://github.com/payloadcms/payload) to help you get up and running quickly. This repo may have been created by running `npx create-payload-app@latest` and selecting the "blank" template or by cloning this template on [Payload Cloud](https://payloadcms.com/new/clone/blank).

See the official [Examples Directory](https://github.com/payloadcms/payload/tree/main/examples) for details on how to use Payload in a variety of different ways.

## Development

To spin up the project locally, follow these steps:

1. First clone the repo
1. Then `cd YOUR_PROJECT_REPO && cp .env.example .env`
1. Next `yarn && yarn dev` (or `docker-compose up`, see [Docker](#docker))
1. Now Open [http://localhost:3000/admin](http://localhost:3000/admin)  to access the admin panel
1. Create your first admin user using the form on the page

That's it! Changes made in `./src` will be reflected in your app.

### Docker

*Para correr en desarrollo*
`docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d`

*Para correr en producción*
`docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d`


Alternatively, you can use [Docker](https://www.docker.com) to spin up this project locally. To do so, follow these steps:

1. Follow [steps 1 and 2 from above](#development), the docker-compose file will automatically use the `.env` file in your project root
1. Next run `docker-compose up`
1. Follow [steps 4 and 5 from above](#development) to login and create your first admin user

That's it! The Docker instance will help you get up and running quickly while also standardizing the development environment across your teams.

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. First invoke the `payload build` script by running `yarn build` or `npm run build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Then run `yarn serve` or `npm run serve` to run Node in production and serve Payload from the `./build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).

## Scripts

### Procesar Biblioteca

Script manual para procesar todas las entradas de la sala Biblioteca. Realiza dos operaciones:

1. **Descarga archivos de Google Drive**: Detecta enlaces de Drive en el contenido de las entradas y descarga los archivos PDF, adjuntándolos automáticamente.
2. **Generacion de portadas**: Para entradas sin imagenes, genera miniaturas desde el PDF usando CloudConvert (con fallback a ApyHub).

**Ejecutar dentro de Docker:**

```bash
docker-compose run --rm payload yarn procesar-biblioteca
```

**Guardar salida en archivo log:**

```bash
docker-compose run --rm payload yarn procesar-biblioteca > biblioteca-$(date +%Y%m%d-%H%M%S).log 2>&1
```

El script muestra progreso detallado en tiempo real y al finalizar presenta estadísticas completas de archivos descargados y portadas encontradas.
