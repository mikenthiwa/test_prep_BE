import { model, Schema } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const employeeStatuses = ['active', 'terminated'] as const;
const payTypes = ['salary', 'hourly'] as const;

const compensationSchema = new Schema(
  {
    payType: { type: String, required: true, enum: payTypes },
    rate: {
      type: Number,
      required: true,
      validate: {
        validator: (rate: number) => Number.isFinite(rate) && rate > 0,
        message: 'Compensation rate must be a finite positive number.',
      },
    },
    currency: { type: String, required: true, enum: ['USD'] },
  },
  { _id: false }
);

const employeeSchema = new Schema(
  {
    employer: { type: Schema.Types.ObjectId, ref: 'Employer', required: true },
    employeeNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    jobTitle: { type: String, required: true, trim: true },
    department: { type: String, trim: true },
    hireDate: { type: Date, required: true },
    status: { type: String, enum: employeeStatuses, default: 'active' },
    terminationDate: Date,
    terminationReason: { type: String, trim: true },
    compensation: compensationSchema,
  },
  { timestamps: true }
);

employeeSchema.index({ employer: 1, employeeNumber: 1 }, { unique: true });
employeeSchema.index({ employer: 1, email: 1 }, { unique: true });

export type EmployeeRecord = InferSchemaType<typeof employeeSchema>;

export const Employee = model<EmployeeRecord>('Employee', employeeSchema);
