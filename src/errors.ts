import type { ErrorRequestHandler } from 'express';
import {
    createProblemDetails,
    PROBLEM_JSON_CONTENT_TYPE,
} from './problem-details.js';

export class HttpError extends Error {
    readonly status: number;
    readonly detail: string | undefined;

    constructor(status: number, detail?: string) {
        const problem = createProblemDetails(status);
        super(detail ?? problem.title);
        this.name = 'HttpError';
        this.status = status;
        this.detail = detail;
    }
}

function isJsonParserError(error: unknown, type: string, status: number): boolean {
    return (
        error !== null &&
        typeof error === 'object' &&
        'type' in error &&
        error.type === type &&
        'status' in error &&
        error.status === status
    );
}

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    let status = 500;
    let detail: string | undefined;

    if (error instanceof HttpError) {
        status = error.status;
        detail = error.detail;
    } else if (isJsonParserError(error, 'entity.parse.failed', 400)) {
        status = 400;
        detail = 'Malformed JSON request body.';
    } else if (isJsonParserError(error, 'entity.too.large', 413)) {
        status = 413;
        detail = 'JSON request body is too large.';
    } else {
        req.log.error({ err: error }, 'Unhandled request error');
    }

    res.status(status).type(PROBLEM_JSON_CONTENT_TYPE).json(createProblemDetails(status, detail));
};
