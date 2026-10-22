import { AllExceptionsFilter } from './http-exception.filter';
import {
  HttpException,
  HttpStatus,
  ArgumentsHost,
} from '@nestjs/common';
import { Response } from 'express';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: jest.Mocked<Partial<Response>>;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let monitoring: { recordError: jest.Mock };

  beforeEach(() => {
    monitoring = { recordError: jest.fn().mockResolvedValue(undefined) };
    filter = new AllExceptionsFilter(monitoring as any);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => ({ method: 'GET', originalUrl: '/api/dashboard?x=1', user: { userId: 'u1' } }),
        getNext: () => ({}),
      }),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as unknown as jest.Mocked<ArgumentsHost>;
  });

  it('should catch HttpException and return structured response', () => {
    const httpException = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(httpException, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Not Found',
        timestamp: expect.any(String),
      }),
    );
  });

  it('should catch HttpException with object message and preserve the message', () => {
    const httpException = new HttpException(
      { error: 'Validation failed', details: ['name is required'] },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(httpException, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const jsonArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
    expect(jsonArg.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(jsonArg.timestamp).toEqual(expect.any(String));
  });

  it('should catch unknown errors (non-HttpException) and return 500', () => {
    const unknownError = new Error('Something broke');

    filter.catch(unknownError, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error interno del servidor',
        timestamp: expect.any(String),
      }),
    );
  });

  it('should handle non-Error thrown values (strings, etc.) and return 500', () => {
    filter.catch('plain string error', mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error interno del servidor',
        timestamp: expect.any(String),
      }),
    );
  });

  it('registra los errores 5xx para el monitoreo del administrador', () => {
    filter.catch(new Error('boom'), mockArgumentsHost);
    expect(monitoring.recordError).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, metodo: 'GET', ruta: '/api/dashboard', mensaje: 'boom', userId: 'u1' }),
    );
  });

  it('no registra errores 4xx', () => {
    filter.catch(new HttpException('Not Found', HttpStatus.NOT_FOUND), mockArgumentsHost);
    expect(monitoring.recordError).not.toHaveBeenCalled();
  });
});
