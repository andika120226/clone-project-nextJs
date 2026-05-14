"use client";

import {
  AdminAccount,
  AdminCatalog,
  AdminSession,
  clearAdminSession,
  ensureAdminSession,
  getTenantCatalog,
} from "@/lib/admin-store";

export type AdminTenantContext = {
  ready: boolean;
  session: AdminSession | null;
  account: AdminAccount | null;
  catalog: AdminCatalog | null;
};

export function useAdminTenant() {
  const value = ensureAdminSession();
  if (!value) {
    clearAdminSession();
    return {
      ready: true,
      session: null,
      account: null,
      catalog: null,
    } satisfies AdminTenantContext;
  }

  return {
    ready: true,
    session: value.session,
    account: value.account,
    catalog: getTenantCatalog(value.session.assignedCatalogId),
  } satisfies AdminTenantContext;
}
