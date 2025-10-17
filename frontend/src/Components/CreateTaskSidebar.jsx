import React, { useState, useMemo } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  Drawer,
  Typography,
  TextField,
  Button,
  Box,
  InputAdornment,
} from "@mui/material";
import api from "../api";
import {
  format,
  addDays,
  startOfDay,
  isBefore,
  isAfter,
  isEqual,
} from "date-fns";

const CreateTaskSidebar = ({ phase, open, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [budget, setBudget] = useState("");

  // Track picker validation errors from MUI (v6+)
  const [startError, setStartError] = useState(null);
  const [endError, setEndError] = useState(null);

  // Derived validation flag: end date must be strictly after start date (at day granularity)
  const endBeforeOrSameAsStart = useMemo(() => {
    if (!startDate || !endDate) return false;
    const s = startOfDay(startDate);
    const e = startOfDay(endDate);
    return isEqual(e, s) || isBefore(e, s);
  }, [startDate, endDate]);

  const isFormValid =
    Boolean(title.trim()) &&
    Boolean(description.trim()) &&
    Boolean(startDate) &&
    Boolean(endDate) &&
    Boolean(dueDate) &&
    Boolean(budget.trim()) &&
    !endBeforeOrSameAsStart &&
    !startError &&
    !endError;

  const handleBudgetChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setBudget(value);
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    // If start moves to on/after current end, clear end to force a re-pick
    if (date && endDate) {
      const s = startOfDay(date);
      const e = startOfDay(endDate);
      if (isEqual(e, s) || isBefore(e, s)) {
        setEndDate(null);
      }
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const handleSubmit = async () => {
    // Final guard on submit in case something slips through
    if (!isFormValid) {
      alert(
        "Please fix the date range: End must be after Start (strictly)."
      );
      return;
    }

    const startDateFormatted = startDate ? format(startDate, "yyyy-MM-dd") : null;
    const endDateFormatted = endDate ? format(endDate, "yyyy-MM-dd") : null;
    const dueDateFormatted = dueDate ? format(dueDate, "yyyy-MM-dd") : null;

    const taskData = {
      phase_id: phase.id,
      title: title,
      description: description,
      start_date: startDateFormatted,
      end_date: endDateFormatted,
      due_date: dueDateFormatted,
      status: "Not Started",
      budget: parseInt(budget),
    };

    api
      .post(`/tasks/`, taskData)
      .then(() => {
        if (onSubmit) onSubmit();
      })
      .catch((error) => {
        console.error("Error adding task:", error);
      });

    if (onClose) onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 400,
          p: 3,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          boxSizing: "border-box",
        },
      }}
    >
      <Box sx={{ position: "relative", mb: 2 }}>
        <Typography variant="h4" align="left" gutterBottom>
          Create Task
        </Typography>
        <Button
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            minWidth: 0,
            width: 32,
            height: 32,
            p: 0,
            borderRadius: "50%",
            fontSize: 18,
          }}
        >
          ×
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flex: 1,
          overflowY: "auto",
        }}
      >
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          sx={{ textAlign: "left" }}
          inputProps={{ style: { textAlign: "left" } }}
        />

        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          minRows={3}
          fullWidth
          sx={{ textAlign: "left" }}
          inputProps={{ style: { textAlign: "left" } }}
        />

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-start" }}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={handleStartDateChange}
              maxDate={endDate ? addDays(endDate, -1) : undefined}
              shouldDisableDate={(day) => {
                if (!endDate) return false;
                const d = startOfDay(day);
                const e = startOfDay(endDate);
                return isEqual(d, e) || isAfter(d, e);
              }}
              onError={setStartError}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { textAlign: "left" },
                  inputProps: { style: { textAlign: "left" } },
                  error: Boolean(startError),
                  helperText:
                    startError === "maxDate"
                      ? "Start must be before End"
                      : startError === "invalidDate"
                      ? "Invalid date"
                      : undefined,
                },
              }}
            />

            <DatePicker
              label="End Date"
              value={endDate}
              onChange={handleEndDateChange}
              minDate={startDate ? addDays(startDate, 1) : undefined}
              shouldDisableDate={(day) => {
                if (!startDate) return false;
                const d = startOfDay(day);
                const s = startOfDay(startDate);
                return isEqual(d, s) || isBefore(d, s);
              }}
              onError={setEndError}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { textAlign: "left" },
                  inputProps: { style: { textAlign: "left" } },
                  error: Boolean(endError) || endBeforeOrSameAsStart,
                  helperText:
                    endError === "minDate"
                      ? "End must be after Start"
                      : endError === "invalidDate"
                      ? "Invalid date"
                      : endBeforeOrSameAsStart
                      ? "End must be after Start"
                      : undefined,
                },
              }}
            />
          </Box>

          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-start" }}>
            <DatePicker
              label="Due Date"
              value={dueDate}
              onChange={setDueDate}
              // Must be between Start and End (inclusive)
              minDate={startDate || undefined}
              maxDate={endDate || undefined}
              shouldDisableDate={(day) => {
                if (!startDate || !endDate) return false;
                const d = startOfDay(day);
                const s = startOfDay(startDate);
                const e = startOfDay(endDate);
                return isBefore(d, s) || isAfter(d, e);
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { textAlign: "left" },
                  inputProps: { style: { textAlign: "left" } },
                  error:
                    !!dueDate &&
                    ((startDate && isBefore(startOfDay(dueDate), startOfDay(startDate))) ||
                      (endDate && isAfter(startOfDay(dueDate), startOfDay(endDate)))),
                  helperText:
                    !!dueDate &&
                    ((startDate && isBefore(startOfDay(dueDate), startOfDay(startDate)))
                      ? "Due date cannot be before Start"
                      : (endDate && isAfter(startOfDay(dueDate), startOfDay(endDate)))
                      ? "Due date cannot be after End"
                      : undefined),
                },
              }}
            />
          </Box>
        </LocalizationProvider>

        <TextField
          label="Budget"
          value={budget}
          onChange={handleBudgetChange}
          fullWidth
          sx={{ textAlign: "left" }}
          inputProps={{ style: { textAlign: "left" }, inputMode: "numeric" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">$</InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          disabled={!isFormValid}
          onClick={handleSubmit}
        >
          Create Task
        </Button>
      </Box>
    </Drawer>
  );
};

export default CreateTaskSidebar;
