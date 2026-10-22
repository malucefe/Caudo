import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreditsService } from './credits.service';
import { CreateCreditDto, EvaluateCreditDto, SimulateAbonoDto, SimulateCompraCarteraDto, UpdateCreditDto } from './dto/credit.dto';

@ApiTags('credits')
@Controller('credits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreditsController {
  constructor(private readonly service: CreditsService) {}

  @Post() @ApiOperation({ summary: 'Registrar un crédito existente' })
  create(@Request() req, @Body() dto: CreateCreditDto) { return this.service.create(req.user.userId, dto); }

  @Get() @ApiOperation({ summary: 'Listar créditos' })
  findAll(@Request() req) { return this.service.findAll(req.user.userId); }

  @Get('summary') @ApiOperation({ summary: 'Total de cuotas y % del ingreso comprometido' })
  summary(@Request() req) { return this.service.summary(req.user.userId); }

  @Post('evaluate') @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'Evaluar la viabilidad de un nuevo crédito' })
  evaluate(@Request() req, @Body() dto: EvaluateCreditDto) { return this.service.evaluate(req.user.userId, dto); }

  @Get(':id') @ApiOperation({ summary: 'Detalle de un crédito' })
  findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) { return this.service.findOne(req.user.userId, id); }

  @Put(':id') @ApiOperation({ summary: 'Actualizar un crédito' })
  update(@Request() req, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCreditDto) { return this.service.update(req.user.userId, id, dto); }

  @Delete(':id') @HttpCode(204) @ApiOperation({ summary: 'Eliminar un crédito' })
  remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) { return this.service.remove(req.user.userId, id); }

  @Post(':id/simulate/abono') @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'Simular abono a capital (reducir plazo o cuota)' })
  simulateAbono(@Request() req, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SimulateAbonoDto) { return this.service.simulateAbono(req.user.userId, id, dto); }

  @Post(':id/simulate/compra-cartera') @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'Simular compra de cartera' })
  simulateCompra(@Request() req, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SimulateCompraCarteraDto) { return this.service.simulateCompraCartera(req.user.userId, id, dto); }
}
