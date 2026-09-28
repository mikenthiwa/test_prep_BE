import { model, Schema } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const userRoles = ['service_provider_admin', 'employer_admin'] as const;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: userRoles },
    employer: { type: Schema.Types.ObjectId, ref: 'Employer' },
  },
  { timestamps: true }
);

userSchema.pre('validate', function () {
  if (this.role === 'employer_admin' && !this.employer) {
    this.invalidate('employer', 'Employer admins must have an employer.');
  } else if (this.role === 'service_provider_admin' && this.employer) {
    this.invalidate(
      'employer',
      'Service-provider admins cannot have an employer.'
    );
  }
});

export type UserRecord = InferSchemaType<typeof userSchema>;

export const User = model<UserRecord>('User', userSchema);
