import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { currentMonth } from '../common/utils/date.util';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Balance mensual y resumen consolidado' })
  @ApiQuery({ name: 'mes', required: false, type: Number })
  @ApiQuery({ name: 'anio', required: false, type: Number })
  get(@Request() req, @Query('mes') mes?: string, @Query('anio') anio?: string) {
    const c = currentMonth();
    const m = Number(mes);
    return this.service.get(req.user.userId, m >= 1 && m <= 12 ? m : c.mes, Number(anio) || c.anio);
  }
}
