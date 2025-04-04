import payload from 'payload'
import cron from 'node-cron'

export const EliminarFijadasVencidas = async () => {
    // Todos los dias a los 2am
    cron.schedule('0 2 * * *', async () => {
      try {
        await TareaDesfijar()
      } catch (error) {
        console.error('Cron: Error limpiando fijadas vencidas:', error)
      }
    })
}

const TareaDesfijar = async () =>{
    const fijadas = await payload.find({
        collection: 'fijadas',
        where: {
            vencimiento: {
                less_than: new Date()
            }
        },
        limit: 100,
    })
    const idsVencidos = fijadas.docs.map(fijada => fijada.id)
    if(!idsVencidos.length){
        payload.logger.info('Cron: No hay fijadas vencidas para eliminar')
        return
    }
    const res = await payload.delete({
        collection: 'fijadas',
        where: {
            id: {
                in: idsVencidos
            }
        }
    })
    payload.logger.info('Cron: Fijadas vencidas eliminadas: ', res.docs.length)
    if(res.errors.length){
        payload.logger.error('Cron: Error eliminando fijadas vencidas:', res.errors)
    }
}