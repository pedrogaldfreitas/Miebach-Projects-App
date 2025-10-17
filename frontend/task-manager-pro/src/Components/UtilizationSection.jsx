import React, { useMemo, useState, useEffect } from "react";
import { DateTime } from "luxon";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Stack,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import api from "../api";

// Helpers: build week columns (Mondays) and render "Oct 13 - Oct 19"
function getWeeks(numWeeks = 5, offset = 0) {
  const weeks = [];
  let monday = DateTime.now().startOf("week").plus({ weeks: offset });
  for (let i = 0; i < numWeeks; i++) {
    weeks.push(monday.plus({ weeks: i }).toISODate());
  }
  return weeks;
}
function weekLabel(isoMonday) {
  const start = DateTime.fromISO(isoMonday);
  const end = start.plus({ days: 6 });
  return `${start.toFormat("LLL d")} - ${end.toFormat("LLL d")}`;
}

export default function UtilizationSection({ project }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const numWeeks = 5;
  const weeks = useMemo(() => getWeeks(numWeeks, weekOffset), [weekOffset]);
  const [loading, setLoading] = useState(false);
  const [grid, setGrid] = useState([]); // [{ user_id, user_name, weeks: { [isoMonday]: {staffed, actual, utilPct} } }]

  useEffect(() => {
    if (!project) return;

    const startMonday = weeks[0]; // first column
    const endMonday = weeks[weeks.length - 1]; // last column

    setLoading(true);
    api
      .get(`/projects/${project.id}/utilization`, {
        params: { start: startMonday, end: endMonday },
      })
      .then((res) => {
        const rows = res.data || [];

        // Group by user
        const byUser = new Map();
        for (const r of rows) {
          const k = r.user_id;
          if (!byUser.has(k)) {
            byUser.set(k, {
              user_id: r.user_id,
              user_name: r.user_name,
              weeks: {}, // isoMonday -> cell
            });
          }
          byUser.get(k).weeks[r.week_start] = {
            staffed: r.staffed_hours ?? 0,
            actual: r.actual_hours ?? 0,
            utilPct:
              r.utilization_pct == null
                ? null
                : Math.round((r.utilization_pct || 0) * 100),
          };
        }

        // Normalize: ensure every user has all week columns
        const normalized = Array.from(byUser.values()).map((u) => {
          const w = {};
          for (const week of weeks) {
            const cell = u.weeks[week] || { staffed: 0, actual: 0, utilPct: null };
            w[week] = cell;
          }
          return { ...u, weeks: w };
        });

        // Sort users by name
        normalized.sort((a, b) =>
          a.user_name.localeCompare(b.user_name, undefined, { sensitivity: "base" })
        );

        setGrid(normalized);
      })
      .catch((err) => {
        console.error("Utilization fetch error:", err?.response?.data || err);
        setGrid([]);
      })
      .finally(() => setLoading(false));
  }, [project, weeks]);

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <IconButton
          aria-label="Previous"
          onClick={() => setWeekOffset((prev) => prev - numWeeks)}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" gutterBottom>
          Utilization Overview
        </Typography>
        <IconButton
          aria-label="Next"
          onClick={() => setWeekOffset((prev) => prev + numWeeks)}
        >
          <ArrowForwardIcon />
        </IconButton>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Person</TableCell>
              {weeks.map((week) => (
                <TableCell key={week} align="center" sx={{ fontWeight: 600 }}>
                  {weekLabel(week)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {grid.map((u) => (
              <TableRow key={u.user_id}>
                <TableCell>{u.user_name}</TableCell>
                {weeks.map((week) => {
                  const cell = u.weeks[week] || { staffed: 0, actual: 0, utilPct: null };
                  const util = cell.utilPct; // null or %
                  const color =
                    util == null
                      ? "text.secondary"
                      : util >= 100
                      ? "success.main"
                      : util >= 80
                      ? "warning.main"
                      : "error.main";

                  return (
                    <TableCell key={week} align="center">
                      <Box>
                        <Typography variant="caption">Staffed: {cell.staffed}h</Typography>
                        <br />
                        <Typography variant="caption">Logged: {cell.actual}h</Typography>
                        <br />
                        <Typography variant="caption" sx={{ color }}>
                          Util: {util == null ? "—" : `${util}%`}
                        </Typography>
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}