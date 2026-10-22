import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InsightsService } from './insights.service';

@ApiTags('insights')
@Controller('insights')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InsightsController {
  constructor(private readonly service: InsightsService) {}

  @Get('patterns')
  @ApiOperation({ summary: 'Patrones de gasto (categorías, día de la semana, aumentos, recurrentes)' })
  @ApiQuery({ name: 'meses', required: false, type: Number })
  patterns(@Request() req, @Query('meses') meses?: string) {
    const n = Math.min(12, Math.max(1, Number(meses) || 3));
    return this.service.patterns(req.user.userId, n);
  }

  @Get('ant-expenses')
  @ApiOperation({ summary: 'Gastos hormiga de los últimos 30 días' })
  @ApiQuery({ name: 'umbral', required: false, type: Number })
  ant(@Request() req, @Query('umbral') umbral?: string) {
    const u = Number(umbral);
    return this.service.antExpenses(req.user.userId, u > 0 ? u : undefined);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Recomendaciones personalizadas (reglas; redacción opcional con n8n)' })
  recommendations(@Request() req) {
    return this.service.recommendations(req.user.userId);
  }
}
