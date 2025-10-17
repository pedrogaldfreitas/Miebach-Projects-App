import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Checkbox,
  FormControlLabel,
  Box,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format as formatDate, isAfter, isBefore } from "date-fns";
import api from "../api";

function toLocalMidnight(yyyyMmDd) {
  if (!yyyyMmDd) return null;
  // Safe parse "YYYY-MM-DD" as local midnight
  return new Date(`${yyyyMmDd}T00:00:00`);
}

const LogHoursPopup = ({ open, onClose, task, onSubmit, auth_user_id }) => {
  // Clamp bounds (inclusive)
  const minDate = useMemo(
    () => toLocalMidnight(task?.start_date),
    [task?.start_date]
  );
  const maxDate = useMemo(
    () => toLocalMidnight(task?.due_date),
    [task?.due_date]
  );

  // Choose an initial value in-range: today clamped to [min, max]
  const initialDate = useMemo(() => {
    const today = toLocalMidnight(formatDate(new Date(), "yyyy-MM-dd"));
    if (minDate && isBefore(today, minDate)) return minDate;
    if (maxDate && isAfter(today, maxDate)) return maxDate;
    return today || minDate || maxDate || new Date();
  }, [minDate, maxDate]);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [hours, setHours] = useState("");
  const [billable, setBillable] = useState(true);

  // When opening, ensure selectedDate is in-range and the calendar opens inside the window
  useEffect(() => {
    if (!open) return;
    setSelectedDate((prev) => {
      const val = prev || initialDate;
      if (minDate && isBefore(val, minDate)) return minDate;
      if (maxDate && isAfter(val, maxDate)) return maxDate;
      return val;
    });
  }, [open, initialDate, minDate, maxDate]);

  const submitLog = async () => {
    if (!selectedDate || hours === "" || Number.isNaN(parseFloat(hours)))
      return;

    const newLog = {
      task_id: task.id,
      user_id: auth_user_id,
      work_date: formatDate(selectedDate, "yyyy-MM-dd"),
      hours: parseFloat(hours),
      is_billable: billable,
    };

    try {
      const response = await api.post("/tasks/timeentries/", newLog);
      console.log("Hours logged successfully:", response.data);

      await api.patch(
        `/tasks/${task.id}/users/${auth_user_id}/total-hours/`,
        {}
      );
      await api.patch(`/tasks/${task.id}/actual-spend/`, {});
      if (onSubmit) onSubmit();
      if (onClose) onClose();
    } catch (err) {
      console.error("Error logging hours:", err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Log Hours
        <Box
          component="button"
          onClick={onClose}
          sx={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 20,
            lineHeight: 1,
            padding: 0,
            color: "grey.700",
          }}
          aria-label="Close"
        >
          &#10005;
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box display="flex" alignItems="center" gap={2} mt={1}>
          <DatePicker
            label="Date"
            value={selectedDate}
            onChange={(d) => setSelectedDate(d)}
            // Hard lock to [start_date, due_date] inclusive
            minDate={minDate || undefined}
            maxDate={maxDate || undefined}
            // Ensure first open lands inside the valid window
            defaultCalendarMonth={(selectedDate ?? minDate) || undefined} // MUI v5 compat
            referenceDate={(selectedDate ?? minDate) || undefined} // MUI v6 compat
            slotProps={{ textField: { size: "small" } }}
          />

          <TextField
            label="Hours"
            type="number"
            size="small"
            value={hours}
            onChange={(e) => setHours(e.target.value.replace(/[^0-9.]/g, ""))}
            inputProps={{ min: 0, step: 0.1 }}
            sx={{ width: 100 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={billable}
                onChange={(e) => setBillable(e.target.checked)}
              />
            }
            label="Billable"
          />
        </Box>

        <Box mt={3} display="flex" justifyContent="flex-end">
          <button
            type="button"
            disabled={
              !selectedDate || hours === "" || Number.isNaN(parseFloat(hours))
            }
            style={{
              padding: "8px 20px",
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: !selectedDate || hours === "" ? "not-allowed" : "pointer",
              opacity: !selectedDate || hours === "" ? 0.6 : 1,
            }}
            onClick={submitLog}
          >
            Add Log
          </button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LogHoursPopup;
