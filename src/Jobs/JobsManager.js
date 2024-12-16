import { EliminarFijadasVencidas } from './EliminarFijadasVencidas'

export class JobManager {
  constructor() {
    this.setupJobs()
  }

  setupJobs() {
    EliminarFijadasVencidas(); 
  }
}