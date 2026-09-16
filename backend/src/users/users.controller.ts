import { Controller, Get, Put, Body, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const { passwordHash, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('profile')
  @ApiOperation({ summary: 'Actualizar perfil del usuario' })
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.update(req.user.userId, dto);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const { passwordHash, ...result } = user;
    return result;
  }
}
