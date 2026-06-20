import { TriggerRepository, CopingStrategy } from '../repositories/trigger.repository';

export class CopingService {
  constructor(private triggerRepository: TriggerRepository) {}

  public async getCopingHistory(userId: string, limit = 30): Promise<CopingStrategy[]> {
    return this.triggerRepository.findCopingStrategiesByUserId(userId, limit);
  }
}
