import React, { useState, useEffect } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Checkbox,
  TextField,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, startOfDay, isBefore, isAfter } from "date-fns";
import api from "../api";
import LogHoursPopup from "./LogHoursPopup";

const containerStyles = {
  display: "flex",
  width: 800,
  height: 400,
  boxShadow: 3,
  borderRadius: 2,
  overflow: "hidden",
  background: "#fff",
};
const leftStyles = {
  flex: "0 0 320px",
  padding: 3,
  borderRight: "1px solid #eee",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  height: "100%",
  boxSizing: "border-box",
};
const rightStyles = {
  flex: 1,
  padding: 3,
  display: "flex",
  flexDirection: "column",
  height: "100%",
  boxSizing: "border-box",
};
const tableContainerStyles = {
  flex: 1,
  overflowY: "auto",
  maxHeight: 280,
  marginTop: 2,
};

function toLocalMidnight(yyyyMmDd) {
  if (!yyyyMmDd) return undefined;
  return new Date(`${yyyyMmDd}T00:00:00`);
}

export default function ContributorTaskView({ task, auth_user_id }) {
  const [logs, setLogs] = useState([]);
  const [addLogHoursPopup, setAddLogHoursPopup] = useState(false);

  async function getLogs() {
    api
      .get(`/tasks/timeentries/`, {
        params: { task_id: task.id, user_id: auth_user_id },
      })
      .then((response) => setLogs(response.data))
      .catch((err) => console.error("Error fetching logs:", err));
  }

  useEffect(() => {
    if (!auth_user_id) return;
    getLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth_user_id, task.id]);

  const handleAddLog = () => setAddLogHoursPopup(true);

  const handleLogChange = (idx, field, value) => {
    const updated = logs.map((log, i) =>
      i === idx ? { ...log, [field]: value } : log
    );
    setLogs(updated);
  };

  // Inclusive bounds for this task
  const minDate = toLocalMidnight(task?.start_date);
  const maxDate = toLocalMidnight(task?.due_date);

  // Hard guard for the table DatePickers (existing rows)
  const disableOutsideRange = (day) => {
    if (!minDate || !maxDate) return false;
    const d = startOfDay(day);
    return isBefore(d, startOfDay(minDate)) || isAfter(d, startOfDay(maxDate));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={containerStyles}>
        {addLogHoursPopup && (
          <LogHoursPopup
            open={addLogHoursPopup}
            task={task}
            minDate={minDate}
            maxDate={maxDate}
            // initial date for NEW log so the picker is clamped & has a valid value on first open
            initialDate={minDate ?? new Date()}
            onClose={() => setAddLogHoursPopup(false)}
            onSubmit={() => getLogs()}
            auth_user_id={auth_user_id}
          />
        )}

        {/* LEFT PART */}
        <Box sx={leftStyles}>
          <Typography variant="h6" fontWeight={700}>
            {task.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" mt={1} />
          <Typography variant="body2" mt={2}>
            {task.description}
          </Typography>
          <Box display="flex" gap={2} mt={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Start Date
              </Typography>
              <Typography variant="body2">{task.start_date}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                End Date
              </Typography>
              <Typography variant="body2">{task.end_date}</Typography>
            </Box>
          </Box>
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              Due Date
            </Typography>
            <Typography variant="body2">{task.due_date}</Typography>
          </Box>
        </Box>

        {/* RIGHT PART */}
        <Box sx={rightStyles}>
          <Button
            variant="contained"
            size="small"
            onClick={handleAddLog}
            sx={{ alignSelf: "flex-start", mb: 1 }}
          >
            New Log
          </Button>

          <TableContainer component={Paper} sx={tableContainerStyles}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Billable</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log, idx) => {
                  const valueDate = log.work_date
                    ? toLocalMidnight(log.work_date)
                    : null;
                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        <DatePicker
                          value={valueDate}
                          onChange={(date) =>
                            handleLogChange(
                              idx,
                              "work_date",
                              date ? format(date, "yyyy-MM-dd") : null
                            )
                          }
                          minDate={minDate}
                          maxDate={maxDate}
                          shouldDisableDate={disableOutsideRange}
                          referenceDate={minDate}
                          defaultCalendarMonth={minDate} // if using MUI v5
                          slotProps={{
                            textField: {
                              variant: "standard",
                              size: "small",
                              sx: { minWidth: 130 },
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.hours}</Typography>
                      </TableCell>
                      <TableCell>
                        <Checkbox checked={!!log.is_billable} readOnly />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
