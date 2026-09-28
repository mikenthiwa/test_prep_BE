import { describe, expect, test } from 'vitest';
import { createSuccessResponse } from '../src/api-response.ts';
import type { ApiResponse } from '../src/api-response.ts';

describe('createSuccessResponse', () => {
  test('returns exactly the success fields with an object payload', () => {
    const employee = { id: 'employee-123' };
    const response: ApiResponse<typeof employee> = createSuccessResponse(
      'Employee loaded',
      employee
    );

    expect(response).toEqual({
      success: true,
      message: 'Employee loaded',
      data: employee,
    });
  });

  test('allows a null payload', () => {
    const response: ApiResponse<null> = createSuccessResponse('No employee', null);

    expect(response).toEqual({
      success: true,
      message: 'No employee',
      data: null,
    });
  });
});
