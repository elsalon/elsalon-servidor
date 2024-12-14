import payload from 'payload'
import cron from 'node-cron'

export class JobManager {
  constructor() {
    this.setupJobs()
  }

  setupJobs() {
    // Daily cleanup job
    cron.schedule('0 0 * * *', async () => {
      try {
        await this.runDailyCleanup()
      } catch (error) {
        console.error('Daily cleanup job failed:', error)
      }
    })

    // Hourly sync job
    cron.schedule('0 * * * *', async () => {
      try {
        await this.runHourlySync()
      } catch (error) {
        console.error('Hourly sync job failed:', error)
      }
    })

    cron.schedule('* * * * *', async () => {
        try {
            await this.runEveryMinute()
        } catch (error) {
            console.error('Every minute job failed:', error)
        }
        })
  }

  

  async runEveryMinute() {
    // Example: Sync external data or perform periodic tasks
    // const externalData = await this.fetchExternalData()
    // await payload.create({
    //   collection: 'sync-logs',
    //   data: {
    //     timestamp: new Date(),
    //     status: 'completed',
    //     dataCount: externalData.length
    //   }
    // })
    // console.log('Every minute job')
  }

  async runDailyCleanup() {
    // Example: Remove old logs or temporary data
    // await payload.delete({
    //   collection: 'logs',
    //   where: {
    //     createdAt: {
    //       less_than: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days old
    //     }
    //   }
    // })
  }

  async runHourlySync() {
    // Example: Sync external data or perform periodic tasks
    // const externalData = await this.fetchExternalData()
    // await payload.create({
    //   collection: 'sync-logs',
    //   data: {
    //     timestamp: new Date(),
    //     status: 'completed',
    //     dataCount: externalData.length
    //   }
    // })
    console.log()
  }

  async fetchExternalData() {
    // Implement your data fetching logic
    return []
  }
}