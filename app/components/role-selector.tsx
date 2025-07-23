'use client';

import { RoleCard } from '@/app/components/role-card';
import type { Role } from '@/app/types/domain.types';

interface RoleSelectorProps {
  roles: Role[];
  selectedRole: Role | null;
  onSelectRole: (role: Role) => void;
}

export function RoleSelector({ roles, selectedRole, onSelectRole }: RoleSelectorProps) {
  return (
    <div className="grid gap-3">
      {roles.map((role) => (
        <RoleCard
          key={role.id}
          role={role}
          isSelected={selectedRole?.id === role.id}
          onClick={onSelectRole}
          showPrice={true}
        />
      ))}
    </div>
  );
}