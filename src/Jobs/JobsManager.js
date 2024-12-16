import { EliminarFijadasVencidas } from './EliminarFijadasVencidas'
import { EliminarNotificacionesViejas } from './EliminarNotificacionesViejas';

export class JobManager {
  constructor() {
    this.setupJobs()
  }

  setupJobs() {
    EliminarFijadasVencidas(); 
    EliminarNotificacionesViejas();
  }
}