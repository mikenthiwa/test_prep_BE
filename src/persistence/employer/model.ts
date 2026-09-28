import { model, Schema } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const employerStatuses = ['active', 'inactive'] as const;

const employerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    status: { type: String, enum: employerStatuses, default: 'active' },
  },
  { timestamps: true }
);

export type EmployerRecord = InferSchemaType<typeof employerSchema>;

export const Employer = model<EmployerRecord>('Employer', employerSchema);
