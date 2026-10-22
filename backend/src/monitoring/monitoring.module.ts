import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { ErrorLog } from './entities/error-log.entity';
import { WebhookRun } from './entities/webhook-run.entity';
import { MonitoringService } from './monitoring.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, ErrorLog, WebhookRun])],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
