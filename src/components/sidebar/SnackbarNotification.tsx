import { Snackbar, Alert } from "@mui/material";

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

interface SnackbarNotificationProps {
  snackbar: SnackbarState;
  onClose: () => void;
}

const SnackbarNotification = ({
  snackbar,
  onClose,
}: SnackbarNotificationProps) => {
  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={3500}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      TransitionProps={{
        onExited: () => {
          // Clear message after transition is complete
        },
      }}>
      <Alert
        onClose={onClose}
        severity={snackbar.severity}
        sx={{ width: "100%" }}
        variant="filled">
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
};

export default SnackbarNotification;
