import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../common/roles/roles.guard';
import { Roles } from '../common/roles/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { MonitoringService } from '../monitoring/monitoring.service';
import { AdminUsersService, type Actor } from './admin-users.service';
import { AdminCategoriesService } from './admin-categories.service';
import { AdminMetricsService } from './admin-metrics.service';
import {
  AuditQueryDto, CreateCategoryDto, CreateUserAdminDto, ListUsersQueryDto,
  PageQueryDto, UpdateCategoryDto, UpdateUserAdminDto,
} from './dto/admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly usersSvc: AdminUsersService,
    private readonly categoriesSvc: AdminCategoriesService,
    private readonly metricsSvc: AdminMetricsService,
    private readonly monitoring: MonitoringService,
  ) {}

  // ---- Cuentas ----
  @Get('users')
  @ApiOperation({ summary: 'Listar cuentas (con búsqueda y filtros)' })
  listUsers(@Query() q: ListUsersQueryDto) {
    return this.usersSvc.list(q);
  }

  @Post('users')
  @ApiOperation({ summary: 'Crear una cuenta (usuario o administrador)' })
  createUser(@CurrentUser() actor: Actor, @Body() dto: CreateUserAdminDto) {
    return this.usersSvc.create(actor, dto);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Editar nombre, correo o rol de una cuenta' })
  updateUser(@CurrentUser() actor: Actor, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserAdminDto) {
    return this.usersSvc.update(actor, id, dto);
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspender una cuenta' })
  suspend(@CurrentUser() actor: Actor, @Param('id', ParseUUIDPipe) id: string) {
    return this.usersSvc.setActive(actor, id, false);
  }

  @Post('users/:id/reactivate')
  @ApiOperation({ summary: 'Reactivar una cuenta suspendida' })
  reactivate(@CurrentUser() actor: Actor, @Param('id', ParseUUIDPipe) id: string) {
    return this.usersSvc.setActive(actor, id, true);
  }

  // ---- Catálogo global de categorías ----
  @Get('categories')
  @ApiOperation({ summary: 'Listar categorías globales con su uso' })
  listCategories() {
    return this.categoriesSvc.list();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Crear categoría global' })
  createCategory(@CurrentUser() actor: Actor, @Body() dto: CreateCategoryDto) {
    return this.categoriesSvc.create(actor, dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Editar nombre o ícono de una categoría' })
  updateCategory(@CurrentUser() actor: Actor, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesSvc.update(actor, id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Eliminar categoría (solo si no está en uso)' })
  removeCategory(@CurrentUser() actor: Actor, @Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesSvc.remove(actor, id);
  }

  // ---- Métricas y monitoreo ----
  @Get('metrics')
  @ApiOperation({ summary: 'Métricas globales de uso de la plataforma' })
  metrics() {
    return this.metricsSvc.metrics();
  }

  @Get('system')
  @ApiOperation({ summary: 'Estado de la API, base de datos, n8n y webhooks' })
  system() {
    return this.metricsSvc.system();
  }

  @Get('audit')
  @ApiOperation({ summary: 'Registro de auditoría' })
  audit(@Query() q: AuditQueryDto) {
    return this.monitoring.listAudit(q.page ?? 1, q.limit ?? 20, q.accion);
  }

  @Get('errors')
  @ApiOperation({ summary: 'Errores 5xx de la API REST' })
  errors(@Query() q: PageQueryDto) {
    return this.monitoring.listErrors(q.page ?? 1, q.limit ?? 20);
  }
}
