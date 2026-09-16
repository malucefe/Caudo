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

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => ({}),
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
});
