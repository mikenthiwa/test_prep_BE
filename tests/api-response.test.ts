import { describe, expect, expectTypeOf, test } from 'vitest';
import { apiResponse } from '../src/api-response.ts';
import type { ApiResponse } from '../src/api-response.ts';

describe('apiResponse', () => {
  test('returns exactly the success fields with an object payload', () => {
    const employee = { id: 'employee-123' };
    const response = apiResponse({
      success: true,
      status: 200,
      message: 'Employee loaded',
      data: employee,
    });

    expectTypeOf(response).toEqualTypeOf<ApiResponse<typeof employee>>();
    expect(response).toStrictEqual({
      success: true,
      status: 200,
      message: 'Employee loaded',
      data: employee,
    });
  });

  test('preserves a null payload', () => {
    expect(
      apiResponse({
        success: true,
        status: 200,
        message: 'No employee',
        data: null,
      })
    ).toStrictEqual({
      success: true,
      status: 200,
      message: 'No employee',
      data: null,
    });
  });

  test.each([true, false])(
    'omits absent optional fields with success=%s',
    (success) => {
      const response = apiResponse({ success, status: 422, message: '' });

      expect(response).toStrictEqual({ success, status: 422, message: '' });
      expect(response).not.toHaveProperty('data');
      expect(response).not.toHaveProperty('error');
    }
  );

  test.each([{}, { username: 'Unknown username' }])(
    'preserves supplied error details: %j',
    (error) => {
      expect(
        apiResponse({
          success: false,
          status: 400,
          message: 'Invalid username',
          error,
        })
      ).toStrictEqual({
        success: false,
        status: 400,
        message: 'Invalid username',
        error,
      });
    }
  );

  test('allows callers to choose payload combinations', () => {
    const response: ApiResponse<number> = {
      success: true,
      status: 200,
      message: 'Completed with details',
      data: 0,
      error: {},
    };

    expect(apiResponse(response)).toStrictEqual(response);
  });

  test('requires object error details at compile time', () => {
    expectTypeOf<ApiResponse['success']>().toEqualTypeOf<boolean>();
    expectTypeOf<ApiResponse['status']>().toEqualTypeOf<number>();
    expectTypeOf<{
      success: boolean;
      message: string;
    }>().not.toExtend<ApiResponse>();
    expectTypeOf<{
      success: boolean;
      message: string;
      status: string;
    }>().not.toExtend<ApiResponse>();
    const response: ApiResponse = {
      success: false,
      status: 400,
      message: 'Invalid username',
      // @ts-expect-error Error details must be an object, not a primitive.
      error: 'Unknown username',
    };

    expect(response.success).toBe(false);
  });
});
