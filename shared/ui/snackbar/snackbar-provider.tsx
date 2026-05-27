"use client";

import {
  Alert,
  AlertTitle,
  Snackbar,
  type AlertColor,
} from "@mui/material";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type SnackbarSeverity = AlertColor;

export type SnackbarOptions = {
  message: string;
  title?: string;
  severity?: SnackbarSeverity;
  durationMs?: number;
};

type SnackbarContextValue = {
  showSnackbar: (options: SnackbarOptions) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

type SnackbarState = {
  open: boolean;
  message: string;
  title?: string;
  severity: SnackbarSeverity;
  durationMs: number;
};

const DEFAULT_DURATION = 6000;

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info",
    durationMs: DEFAULT_DURATION,
  });

  const showSnackbar = useCallback((options: SnackbarOptions) => {
    setState({
      open: true,
      message: options.message,
      title: options.title,
      severity: options.severity ?? "info",
      durationMs: options.durationMs ?? DEFAULT_DURATION,
    });
  }, []);

  const value = useMemo<SnackbarContextValue>(
    () => ({
      showSnackbar,
      showSuccess: (message, title) =>
        showSnackbar({ message, title, severity: "success" }),
      showError: (message, title = "Error") =>
        showSnackbar({ message, title, severity: "error", durationMs: 8000 }),
      showWarning: (message, title = "Attention") =>
        showSnackbar({ message, title, severity: "warning", durationMs: 7000 }),
      showInfo: (message, title) =>
        showSnackbar({ message, title, severity: "info" }),
    }),
    [showSnackbar],
  );

  const handleClose = (_?: unknown, reason?: string) => {
    if (reason === "clickaway") return;
    setState((prev) => ({ ...prev, open: false }));
  };

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={state.durationMs}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleClose}
          severity={state.severity}
          variant="filled"
          elevation={6}
          sx={{ width: "100%", maxWidth: 420 }}
        >
          {state.title ? <AlertTitle>{state.title}</AlertTitle> : null}
          {state.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    throw new Error("useSnackbar must be used within SnackbarProvider");
  }
  return ctx;
}
