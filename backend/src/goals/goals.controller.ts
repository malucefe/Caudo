import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GoalsService } from './goals.service';
import { AddContributionDto, CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

@ApiTags('goals')
@Controller('goals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GoalsController {
  constructor(private readonly service: GoalsService) {}

  @Post() @ApiOperation({ summary: 'Crear meta de ahorro' })
  create(@Request() req, @Body() dto: CreateGoalDto) { return this.service.create(req.user.userId, dto); }

  @Get() @ApiOperation({ summary: 'Listar metas con avance y proyección' })
  findAll(@Request() req) { return this.service.findAll(req.user.userId); }

  @Get(':id') @ApiOperation({ summary: 'Detalle de meta con historial de aportes' })
  findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) { return this.service.findOne(req.user.userId, id); }

  @Put(':id') @ApiOperation({ summary: 'Actualizar meta' })
  update(@Request() req, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGoalDto) { return this.service.update(req.user.userId, id, dto); }

  @Post(':id/contributions') @ApiOperation({ summary: 'Registrar un aporte a la meta' })
  contribute(@Request() req, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AddContributionDto) { return this.service.addContribution(req.user.userId, id, dto); }

  @Delete(':id') @HttpCode(204) @ApiOperation({ summary: 'Eliminar meta' })
  remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) { return this.service.remove(req.user.userId, id); }
}
