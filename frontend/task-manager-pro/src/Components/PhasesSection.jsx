import React, { useState, useEffect } from "react";
import { Box, Button, Paper, Stack, TextField } from "@mui/material";
import api from "../api";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, addDays, startOfDay } from "date-fns";
import TasksSection from "./TasksSection";

export default function PhasesSection({ project }) {
  const [phases, setPhases] = useState([]);
  const [initialPhases, setInitialPhases] = useState([]);
  const addPhase = () => setPhases([...phases, {}]);

  useEffect(() => {
    if (!project.id) return;
    api.get(`/projects/${project.id}/phases/`).then((response) => {
      setPhases(response.data);
      setInitialPhases(response.data); // same ref -> "Confirm" stays disabled until changes
    });
  }, [project.id]);

  // Reusable DatePicker (supports min/max/readOnly)
  function DatePickerField({ label, value, onChange, minDate, maxDate, readOnly }) {
    const [open, setOpen] = useState(false);

    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label={label}
          value={value}
          onChange={onChange}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          minDate={minDate}
          maxDate={maxDate}
          slotProps={{
            textField: {
              sx: { minWidth: 120, fontSize: 13, "& input": { fontSize: 13 }, m: 0 },
              size: "small",
              variant: "standard",
            },
          }}
          readOnly={readOnly}
        />
      </LocalizationProvider>
    );
  }

  async function confirmPhasesButton() {
    const sanitizedPhases = phases.map((phase) => {
      const sanitized = {
        project_id: project.id,
        phase_name: phase.phase_name,
        start_date: phase.start_date,
        end_date: phase.end_date,
      };
      if (phase.id !== undefined) sanitized.phase_id = phase.id; // update existing
      return sanitized;
    });

    try {
      await api.post(`/projects/${project.id}/phases/`, sanitizedPhases);
      // IMPORTANT: re-fetch so we get server-generated IDs
      const refreshed = await api.get(`/projects/${project.id}/phases/`);
      setPhases(refreshed.data);
      setInitialPhases(refreshed.data); // same ref so Confirm disables again
    } catch (error) {
      console.error("Error adding phase:", error);
    }
  }

  function isPhaseValid(phase) {
    return phase.phase_name && phase.start_date && phase.end_date;
  }

  const allPhasesValid = phases.every(isPhaseValid);
  const confirmDisabled = phases === initialPhases || !allPhasesValid;

  return (
    <Stack direction="column" alignItems="flex-start" spacing={2}>
      <Box
        sx={{
          width: "100%",
          overflowX: "auto",
          bgcolor: "grey.100",
          p: 1,
          borderRadius: 2,
          overflowY: "scroll",
          height: "60vh",
        }}
      >
        <Stack direction="row" alignItems="self-start" spacing={2}>
          {phases.map((phase, idx) => {
            const startVal = phase.start_date ? new Date(`${phase.start_date}T00:00:00`) : null;
            const endVal = phase.end_date ? new Date(`${phase.end_date}T00:00:00`) : null;

            return (
              <Paper
                key={idx}
                elevation={2}
                sx={{
                  width: 1 / 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  mx: 1,
                  flex: "0 0 auto",
                  p: 2,
                  height: "auto",
                }}
              >
                <TextField
                  id="phase-name"
                  label=""
                  value={phase.phase_name || ""}
                  onChange={(e) => {
                    const updated = [...phases];
                    updated[idx] = { ...updated[idx], phase_name: e.target.value };
                    setPhases(updated);
                  }}
                  variant="standard"
                  InputProps={{
                    sx: {
                      fontSize: 22,
                      fontWeight: 700,
                      border: "none",
                      background: "transparent",
                      p: 0,
                      textAlign: "center",
                    },
                  }}
                  slotProps={{ input: { readOnly: project.started } }}
                  inputProps={{ style: { textAlign: "center" } }}
                  placeholder={`Phase ${idx + 1}`}
                />

                <Stack direction="row" spacing={2} sx={{ width: "100%", justifyContent: "center", mt: 1 }}>
                  <DatePickerField
                    label="Start date"
                    value={startVal}
                    onChange={(date) => {
                      const formatted = date ? format(date, "yyyy-MM-dd") : null;
                      const updated = [...phases];
                      updated[idx] = { ...updated[idx], start_date: formatted };

                      // If start moves to on/after current end, clear end to force re-pick
                      if (date && endVal && startOfDay(date) >= startOfDay(endVal)) {
                        updated[idx].end_date = null;
                      }
                      setPhases(updated);
                    }}
                    maxDate={endVal ? addDays(endVal, -1) : undefined}
                    readOnly={project.started}
                  />

                  <DatePickerField
                    label="End date"
                    value={endVal}
                    onChange={(date) => {
                      const formatted = date ? format(date, "yyyy-MM-dd") : null;
                      const updated = [...phases];
                      updated[idx] = { ...updated[idx], end_date: formatted };
                      setPhases(updated);
                    }}
                    minDate={startVal ? addDays(startVal, 1) : undefined}
                    readOnly={project.started}
                  />
                </Stack>

                <Stack direction="column" spacing={1} sx={{ width: "100%", mt: 2 }}>
                  {/* Disable Add Task until this phase has an id (i.e., confirmed/saved) */}
                  <TasksSection phase={phase} disableAddTask={!phase?.id} />
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Box>

      {!project.started && (
        <Box>
          <Button variant="contained" color="primary" onClick={addPhase} sx={{ mt: 1, boxShadow: 2 }}>
            Add Phase
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={confirmPhasesButton}
            sx={{ mt: 1, boxShadow: 2, ml: 1 }}
            disabled={confirmDisabled}
          >
            Confirm Phases
          </Button>
        </Box>
      )}
    </Stack>
  );
}
