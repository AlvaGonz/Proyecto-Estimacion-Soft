import { describe, it, expect } from 'vitest';
import { ApiError } from '../utils/ApiError.js';

describe('ApiError', () => {
    describe('constructor', () => {
        it('should create an error with status code and message', () => {
            const error = new ApiError(400, 'Bad request');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ApiError);
            expect(error.statusCode).toBe(400);
            expect(error.message).toBe('Bad request');
            expect(error.isOperational).toBe(true);
            expect(error.name).toBe('ApiError');
        });

        it('should mark non-operational errors when specified', () => {
            const error = new ApiError(500, 'Internal error', false);

            expect(error.isOperational).toBe(false);
        });
    });

    describe('static factories', () => {
        it('should create a 400 bad request error', () => {
            const error = ApiError.badRequest('Invalid input');

            expect(error.statusCode).toBe(400);
            expect(error.message).toBe('Invalid input');
            expect(error.isOperational).toBe(true);
        });

        it('should create a 401 unauthorized error with default message', () => {
            const error = ApiError.unauthorized();

            expect(error.statusCode).toBe(401);
            expect(error.message).toBe('No autorizado');
        });

        it('should create a 403 forbidden error with default message', () => {
            const error = ApiError.forbidden();

            expect(error.statusCode).toBe(403);
            expect(error.message).toBe('Acceso denegado');
        });

        it('should create a 404 not found error with default message', () => {
            const error = ApiError.notFound();

            expect(error.statusCode).toBe(404);
            expect(error.message).toBe('Recurso no encontrado');
        });

        it('should create a 409 conflict error', () => {
            const error = ApiError.conflict('Email ya registrado');

            expect(error.statusCode).toBe(409);
            expect(error.message).toBe('Email ya registrado');
        });

        it('should create a 500 internal error marked as non-operational', () => {
            const error = ApiError.internal();

            expect(error.statusCode).toBe(500);
            expect(error.message).toBe('Error interno del servidor');
            expect(error.isOperational).toBe(false);
        });
    });
});
