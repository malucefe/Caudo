import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BudgetsService } from './budgets.service';
import { SetBudgetDto } from './dto/set-budget.dto';
import { currentMonth } from '../common/utils/date.util';

@ApiTags('budgets')
@Controller('budgets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BudgetsController {
  constructor(private readonly service: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Definir (o actualizar) el tope mensual de una categoría de gasto' })
  set(@Request() req, @Body() dto: SetBudgetDto) {
    return this.service.set(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Topes del mes con consumo y porcentaje' })
  @ApiQuery({ name: 'mes', required: false, type: Number })
  @ApiQuery({ name: 'anio', required: false, type: Number })
  list(@Request() req, @Query('mes') mes?: string, @Query('anio') anio?: string) {
    const c = currentMonth();
    return this.service.list(req.user.userId, Number(mes) || c.mes, Number(anio) || c.anio);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Alertas de sobreconsumo (≥80% y ≥100% del tope)' })
  @ApiQuery({ name: 'mes', required: false, type: Number })
  @ApiQuery({ name: 'anio', required: false, type: Number })
  alerts(@Request() req, @Query('mes') mes?: string, @Query('anio') anio?: string) {
    const c = currentMonth();
    return this.service.alerts(req.user.userId, Number(mes) || c.mes, Number(anio) || c.anio);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar un tope' })
  remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(req.user.userId, id);
  }
}
