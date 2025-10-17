import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

const DeleteConfirmModal = ({ open, onClose, onConfirm, projectName, loading }) => {
  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined}>
      <DialogTitle>Confirm Deletion</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete <strong>{projectName}</strong> and all its associated data?
          <br />
          <span style={{ color: "#d32f2f" }}>This action cannot be undone.</span>
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
        >
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmModal;
