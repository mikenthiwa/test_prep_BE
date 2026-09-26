import { STATUS_CODES } from 'node:http';

export const PROBLEM_JSON_CONTENT_TYPE = 'application/problem+json';

export type ProblemDetails = {
    type: string;
    title: string;
    status: number;
    detail?: string;
    instance?: string;
    requestId?: string;
};

export type ProblemDetailsContext = Pick<ProblemDetails, 'instance' | 'requestId'>;

export function createProblemDetails(
    status: number,
    detail?: string,
    context?: ProblemDetailsContext,
): ProblemDetails {
    const title = STATUS_CODES[status];

    if (!Number.isInteger(status) || status < 400 || status > 599 || !title) {
        throw new RangeError(`Unsupported HTTP error status: ${status}`);
    }

    return {
        type: 'about:blank',
        title,
        status,
        ...(detail === undefined ? {} : { detail }),
        ...(context?.instance === undefined ? {} : { instance: context.instance }),
        ...(context?.requestId === undefined ? {} : { requestId: context.requestId }),
    };
}
