import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { MonitoringService } from '../../monitoring/monitoring.service';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly monitoring: MonitoringService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { user?: { userId?: string } }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Error interno del servidor';

    // Solo los errores del servidor (5xx) se guardan para el monitoreo del administrador.
    if (status >= 500) {
      const detalle = exception instanceof Error ? exception.message : String(exception);
      this.logger.error(`${request.method} ${request.url} -> ${status}: ${detalle}`);
      void this.monitoring.recordError({
        statusCode: status,
        metodo: request.method,
        ruta: (request.originalUrl ?? request.url ?? '').split('?')[0],
        mensaje: detalle,
        userId: request.user?.userId ?? null,
      });
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
