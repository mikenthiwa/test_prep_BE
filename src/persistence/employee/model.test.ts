import mongoose from 'mongoose';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { Employer } from '../employer/model.ts';
import { Employee } from './model.ts';
import type { EmployeeRecord } from './model.ts';
import { useMongoMemoryServer } from '../../../tests/support/mongo.ts';

function employeeData(employer: mongoose.Types.ObjectId) {
  return {
    employer,
    employeeNumber: 'E-001',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    jobTitle: 'Engineer',
    hireDate: new Date('2025-01-15'),
  };
}

describe('Employee model', () => {
  const mongo = useMongoMemoryServer();

  beforeEach(async () => {
    await mongoose.connect(mongo.uri);
    await Employee.init();
  });

  afterEach(async () => {
    await Employee.deleteMany({});
    await Employer.deleteMany({});
    await mongoose.disconnect();
  });

  test('saves and retrieves an active employee with an employer reference', async () => {
    const employer = await Employer.create({ name: 'Acme', code: 'ACME' });
    const created = await Employee.create(employeeData(employer._id));
    const found = await Employee.findById(created._id);

    expect(created._id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(found?.employer).toEqual(employer._id);
    expect(found?.status).toBe('active');
    expect(found?.compensation).toBeUndefined();
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  test('normalizes identity and optional contact and job fields', async () => {
    const employer = await Employer.create({ name: 'Acme', code: 'ACME' });
    const employee = await Employee.create({
      ...employeeData(employer._id),
      employeeNumber: '  e-001  ',
      firstName: '  Ada  ',
      lastName: '  Lovelace  ',
      email: '  ADA@Example.COM  ',
      jobTitle: '  Engineer  ',
      phone: '  555-0100  ',
      department: '  Technology  ',
    });

    expect(employee.employeeNumber).toBe('E-001');
    expect(employee.firstName).toBe('Ada');
    expect(employee.lastName).toBe('Lovelace');
    expect(employee.email).toBe('ada@example.com');
    expect(employee.jobTitle).toBe('Engineer');
    expect(employee.phone).toBe('555-0100');
    expect(employee.department).toBe('Technology');
  });

  test('requires the core employee fields', async () => {
    const employer = await Employer.create({ name: 'Acme', code: 'ACME' });

    for (const field of [
      'employer',
      'employeeNumber',
      'firstName',
      'lastName',
      'email',
      'jobTitle',
      'hireDate',
    ] as const) {
      await expect(
        Employee.create({ ...employeeData(employer._id), [field]: undefined })
      ).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
    }

    await expect(
      Employee.create({
        ...employeeData(employer._id),
        employeeNumber: '   ',
      })
    ).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
  });

  test('stores termination fields but rejects unsupported statuses', async () => {
    const employer = await Employer.create({ name: 'Acme', code: 'ACME' });
    const terminationDate = new Date('2025-09-30');
    const terminated = await Employee.create({
      ...employeeData(employer._id),
      status: 'terminated',
      terminationDate,
      terminationReason: '  Resigned  ',
    });

    expect(terminated.status).toBe('terminated');
    expect(terminated.terminationDate).toEqual(terminationDate);
    expect(terminated.terminationReason).toBe('Resigned');
    await expect(
      Employee.create({
        ...employeeData(employer._id),
        status: 'on_leave' as EmployeeRecord['status'],
      })
    ).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
  });

  test('stores complete salary or hourly compensation without a subdocument ID', async () => {
    const employer = await Employer.create({ name: 'Acme', code: 'ACME' });
    const salary = await Employee.create({
      ...employeeData(employer._id),
      compensation: { payType: 'salary', rate: 75000, currency: 'USD' },
    });
    const hourly = await Employee.create({
      ...employeeData(employer._id),
      employeeNumber: 'E-002',
      email: 'grace@example.com',
      compensation: { payType: 'hourly', rate: 42.5, currency: 'USD' },
    });

    expect(salary.toObject().compensation).toEqual({
      payType: 'salary',
      rate: 75000,
      currency: 'USD',
    });
    expect(hourly.toObject().compensation).toEqual({
      payType: 'hourly',
      rate: 42.5,
      currency: 'USD',
    });
  });

  test('rejects incomplete or invalid compensation', async () => {
    const employer = await Employer.create({ name: 'Acme', code: 'ACME' });
    const invalidCompensation = [
      { payType: 'salary', currency: 'USD' },
      { rate: 100, currency: 'USD' },
      { payType: 'salary', rate: 100 },
      { payType: 'weekly', rate: 100, currency: 'USD' },
      { payType: 'salary', rate: 0, currency: 'USD' },
      { payType: 'hourly', rate: -1, currency: 'USD' },
      { payType: 'salary', rate: Infinity, currency: 'USD' },
      { payType: 'salary', rate: 100, currency: 'EUR' },
    ];

    for (const compensation of invalidCompensation) {
      await expect(
        Employee.create({
          ...employeeData(employer._id),
          compensation: compensation as NonNullable<
            EmployeeRecord['compensation']
          >,
        })
      ).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
    }
  });

  test('keeps employee numbers and emails unique within each employer', async () => {
    const firstEmployer = await Employer.create({ name: 'Acme', code: 'ACME' });
    const secondEmployer = await Employer.create({
      name: 'Other',
      code: 'OTHER',
    });
    await Employee.create(employeeData(firstEmployer._id));

    await expect(
      Employee.create({
        ...employeeData(firstEmployer._id),
        employeeNumber: ' e-001 ',
        email: 'other@example.com',
      })
    ).rejects.toMatchObject({ code: 11000 });
    await expect(
      Employee.create({
        ...employeeData(firstEmployer._id),
        employeeNumber: 'E-002',
        email: ' ADA@EXAMPLE.COM ',
      })
    ).rejects.toMatchObject({ code: 11000 });

    const otherEmployerEmployee = await Employee.create(
      employeeData(secondEmployer._id)
    );
    expect(otherEmployerEmployee.employeeNumber).toBe('E-001');
    expect(otherEmployerEmployee.email).toBe('ada@example.com');
  });
});
