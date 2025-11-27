'use client';

import React from 'react';
import { useTenant } from '../providers/TenantProvider';
import { Building2 } from 'lucide-react';

export function TenantSwitcher() {
  const { tenantId, setTenantId, availableTenants } = useTenant();

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700 shadow-sm">
      <Building2 size={16} className="text-gray-500 dark:text-gray-400" />
      <select
        value={tenantId}
        onChange={(e) => setTenantId(e.target.value)}
        className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer outline-none py-1"
      >
        {availableTenants.map((tenant) => (
          <option key={tenant} value={tenant} className="bg-white dark:bg-gray-800">
            {tenant.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
