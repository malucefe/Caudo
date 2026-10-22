import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CategorizationService } from './categorization.service';
import { CategoryType } from './entities/category.entity';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly categorizationService: CategorizationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las categorías' })
  @ApiQuery({ name: 'tipo', required: false, enum: CategoryType })
  async findAll(@Query('tipo') tipo?: CategoryType) {
    if (tipo) {
      return this.categoriesService.findByType(tipo);
    }
    return this.categoriesService.findAll();
  }

  @Get('suggest')
  @ApiOperation({
    summary: 'Sugerir la categoría de una transacción según su descripción',
  })
  @ApiQuery({ name: 'descripcion', required: true, type: String })
  @ApiQuery({ name: 'tipo', required: true, enum: CategoryType })
  async suggest(
    @Query('descripcion') descripcion: string,
    @Query('tipo') tipo: CategoryType,
  ) {
    return this.categorizationService.suggest(descripcion, tipo);
  }
}
