import { useState, useMemo } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, addDays, startOfDay } from 'date-fns';
import api from "../api";

import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
} from "@mui/material";

const ProjectSetup = ({ open, onClose, onSubmit }) => {
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Derived validation
  const endInvalid = useMemo(() => {
    if (!startDate || !endDate) return false;
    return startOfDay(endDate) <= startOfDay(startDate); // strictly after
  }, [startDate, endDate]);

  const handleStartChange = (date) => {
    setStartDate(date);
    // If the new start collides with or passes current end, clear end to force a re-pick
    if (date && endDate && startOfDay(endDate) <= startOfDay(date)) {
      setEndDate(null);
    }
  };

  const handleEndChange = (date) => {
    setEndDate(date);
  };

  const handleSubmit = async () => {
    // Final guard against invalid range
    if (endInvalid) {
      alert("End date must be after Start date.");
      return;
    }

    const startDateFormatted = startDate ? format(startDate, 'yyyy-MM-dd') : null;
    const endDateFormatted = endDate ? format(endDate, 'yyyy-MM-dd') : null;

    await api.post('/projects/', {
      name: projectName,
      client_name: clientName,
      start_date: startDateFormatted,
      end_date: endDateFormatted,
      started: false,
    }).then(() => {
      if (onSubmit) {
        onSubmit({ projectName, clientName, startDate, endDate });
      }
      setProjectName("");
      setClientName("");
      setStartDate(null);
      setEndDate(null);
    }).catch((err) => {
      console.error('Error creating project', err);
    });

    if (onClose) onClose();
  };

  const submitDisabled = !projectName || !clientName || !startDate || !endDate || endInvalid;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Drawer anchor="right" open={open} onClose={onClose}>
        <Box sx={{ width: 350, p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Project Setup
            </Typography>
            <IconButton onClick={onClose} aria-label="Close">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <TextField
            label="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            fullWidth
            margin="normal"
          />

          <TextField
            label="Client Name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            fullWidth
            margin="normal"
          />

          <Box sx={{ mb: 2 }}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={handleStartChange}
              // Optional: prevent picking a start date on/after current end date
              maxDate={endDate ? addDays(endDate, -1) : undefined}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  margin="normal"
                  error={Boolean(endDate && startDate && startOfDay(startDate) >= startOfDay(endDate))}
                  helperText={
                    endDate && startDate && startOfDay(startDate) >= startOfDay(endDate)
                      ? 'Start date must be before End date'
                      : params?.inputProps?.placeholder || undefined
                  }
                />
              )}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={handleEndChange}
              // Enforce strictly AFTER start date
              minDate={startDate ? addDays(startDate, 1) : undefined}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  margin="normal"
                  error={endInvalid}
                  helperText={endInvalid ? 'End date must be after Start date' : undefined}
                />
              )}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={submitDisabled}
            fullWidth
          >
            Create Project
          </Button>
        </Box>
      </Drawer>
    </LocalizationProvider>
  );
};

export default ProjectSetup;
