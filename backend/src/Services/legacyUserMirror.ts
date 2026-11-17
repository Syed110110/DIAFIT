import { Types } from 'mongoose';
import { User } from '../models/User';
import { UserRole } from '../types/roles';

export const ensureLegacyUserMirror = async (identity: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}): Promise<void> => {
  if (identity.role === 'ADMIN') return;

  const id = new Types.ObjectId(identity.id);
  const existing = await User.findById(id);
  if (existing) {
    existing.name = identity.name;
    existing.email = identity.email;
    existing.username = identity.id;
    existing.role = identity.role;
    await existing.save();
    return;
  }

  await User.create({
    _id: id,
    name: identity.name,
    email: identity.email,
    username: identity.id,
    role: identity.role,
  });
};