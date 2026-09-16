import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionType } from './entities/transaction.entity';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear transacción' })
  create(@Request() req, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar transacciones del usuario' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tipo', required: false, enum: TransactionType })
  @ApiQuery({ name: 'mes', required: false, type: Number })
  @ApiQuery({ name: 'anio', required: false, type: Number })
  findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('tipo') tipo?: TransactionType,
    @Query('mes') mes?: number,
    @Query('anio') anio?: number,
  ) {
    return this.transactionsService.findAll(
      req.user.userId,
      page || 1,
      limit || 20,
      tipo,
      mes,
      anio,
    );
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumen mensual (ingresos vs egresos por categoría)' })
  @ApiQuery({ name: 'mes', required: true, type: Number })
  @ApiQuery({ name: 'anio', required: true, type: Number })
  getSummary(
    @Request() req,
    @Query('mes') mes: number,
    @Query('anio') anio: number,
  ) {
    return this.transactionsService.getSummary(req.user.userId, mes, anio);
  }

  @Get('trend')
  @ApiOperation({ summary: 'Tendencia mensual de los últimos N meses' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  getMonthlyTrend(
    @Request() req,
    @Query('months') months?: number,
  ) {
    return this.transactionsService.getMonthlyTrend(
      req.user.userId,
      months || 6,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de transacción' })
  findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.transactionsService.findOne(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar transacción' })
  update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar transacción' })
  remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.transactionsService.remove(req.user.userId, id);
  }
}
