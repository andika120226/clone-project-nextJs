"use client";

import { useEffect, useState } from "react";
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

const initialContext: AdminTenantContext = {
  ready: false,
  session: null,
  account: null,
  catalog: null,
};

export function useAdminTenant() {
  const [context, setContext] = useState<AdminTenantContext>(initialContext);

  useEffect(() => {
    const value = ensureAdminSession();
    if (!value) {
      clearAdminSession();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContext({
        ready: true,
        session: null,
        account: null,
        catalog: null,
      });
      return;
    }

    setContext({
      ready: true,
      session: value.session,
      account: value.account,
      catalog: getTenantCatalog(value.session.assignedCatalogId),
    });
  }, []);

  return context;
}
