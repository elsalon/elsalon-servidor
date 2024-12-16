import payload from 'payload'
import cron from 'node-cron'

export const EliminarNotificacionesViejas = async () => {
    // Todos los dias a los 2:10am
    cron.schedule('10 2 * * *', async () => {
      try {
        await TareaEliminarNotificaciones()
      } catch (error) {
        console.error('Cron: Error limpiando fijadas vencidas:', error)
      }
    })
}

const TareaEliminarNotificaciones = async () =>{
    const haceDosSemanas = new Date()
    haceDosSemanas.setDate(haceDosSemanas.getDate() - 14)

    const notificaciones = await payload.find({
        collection: 'notificaciones',
        where: {
            and: [
                {
                    leida: {
                        equals: true
                    },
                    createdAt: {
                        less_than: haceDosSemanas
                    }
                }
            ]
        },
        limit: 100,
    })
    const idsViejas = notificaciones.docs.map(notificacion => notificacion.id)
    if(!idsViejas.length){
        payload.logger.info('Cron: No hay notificaciones viejas para eliminar')
        return
    }
    const res = await payload.delete({
        collection: 'notificaciones',
        where: {
            id: {
                in: idsViejas
            }
        }
    })
    payload.logger.info('Cron: Notificaciones viejas eliminadas: ', res.docs.length)
    if(res.errors.length){
        payload.logger.error('Cron: Error eliminando notificaciones viejas:', res.errors)
    }
}