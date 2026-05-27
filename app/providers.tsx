"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import type { ReactNode } from "react";
import { AuthProvider } from "@/features/auth/model/auth-provider";
import { AppThemeProvider } from "@/shared/theme";
import { SnackbarProvider } from "@/shared/ui/snackbar";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <AppRouterCacheProvider options={{ key: "mui", enableCssLayer: true }}>
      <AppThemeProvider>
        <AuthProvider>
          <SnackbarProvider>{children}</SnackbarProvider>
        </AuthProvider>
      </AppThemeProvider>
    </AppRouterCacheProvider>
  );
}
