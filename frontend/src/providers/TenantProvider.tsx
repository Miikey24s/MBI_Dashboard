'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface TenantContextType {
  tenantId: string;
  setTenantId: (id: string) => void;
  availableTenants: string[];
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const AVAILABLE_TENANTS = ['tenant-01', 'tenant-02', 'tenant-03'];
export const DEFAULT_TENANT = 'tenant-01';

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tenantId, setTenantIdState] = useState(DEFAULT_TENANT);

  // Sync state with URL params
  useEffect(() => {
    const paramTenant = searchParams.get('tenantId');
    if (paramTenant && AVAILABLE_TENANTS.includes(paramTenant)) {
      setTenantIdState(paramTenant);
    }
  }, [searchParams]);

  const setTenantId = (id: string) => {
    if (AVAILABLE_TENANTS.includes(id)) {
      setTenantIdState(id);
      const params = new URLSearchParams(searchParams.toString());
      params.set('tenantId', id);
      router.push(`?${params.toString()}`);
    }
  };

  return (
    <TenantContext.Provider value={{ tenantId, setTenantId, availableTenants: AVAILABLE_TENANTS }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
