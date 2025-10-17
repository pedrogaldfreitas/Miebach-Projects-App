// src/components/InvoiceCreateForm.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Select,
  MenuItem,
  Button,
  TextField,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, startOfDay, isBefore, startOfWeek, endOfWeek } from "date-fns";
import api from "../api";

/**
 * Props:
 * - initialProjectId?: number | string
 * - initialClientName?: string
 */
export default function InvoiceCreateForm({
  initialProjectId,
  initialClientName,
}) {
  // Projects + selection
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(
    initialProjectId ? String(initialProjectId) : ""
  );
  const [clientName, setClientName] = useState(initialClientName || "");

  // Period
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Preview data
  const [items, setItems] = useState([]); // [{task_title, phase_name, hours, rate, amount}]
  const [previewTotal, setPreviewTotal] = useState(0);

  // UX
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Default to current week (Mon–Sun)
  useEffect(() => {
    setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
    setEndDate(endOfWeek(new Date(), { weekStartsOn: 1 }));
  }, []);

  // Load projects
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingProjects(true);
      setError("");
      try {
        const res = await api.get("/projects/");
        if (!mounted) return;
        const list = res.data || [];
        setProjects(list);

        if (!initialProjectId && list.length > 0) {
          setProjectId(String(list[0].id));
          setClientName(list[0].client_name || "");
        }
      } catch {
        if (!mounted) return;
        setError("Failed to load projects.");
      } finally {
        if (mounted) setLoadingProjects(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [initialProjectId]);

  // Update client name when project changes (if empty)
  useEffect(() => {
    if (!projectId) return;
    const p = projects.find((p) => String(p.id) === String(projectId));
    if (p) setClientName((prev) => (prev ? prev : p.client_name || ""));
  }, [projectId, projects]);

  // Valid date range?
  const endBeforeStart = useMemo(() => {
    if (!startDate || !endDate) return false;
    return isBefore(startOfDay(endDate), startOfDay(startDate));
  }, [startDate, endDate]);

  const canPreview =
    Boolean(projectId) &&
    Boolean(startDate) &&
    Boolean(endDate) &&
    !endBeforeStart;

  // getInvoiceTable: fetch preview (runs whenever inputs change)
  const getInvoiceTable = useCallback(async () => {
    if (!canPreview) {
      setItems([]);
      setPreviewTotal(0);
      return;
    }
    setLoadingPreview(true);
    setError("");
    setSuccessMsg("");

    try {
      const ps = format(startOfDay(startDate), "yyyy-MM-dd");
      const pe = format(startOfDay(endDate), "yyyy-MM-dd");

      const res = await api.get(
        `/projects/${projectId}/invoice-table/?start_date=${ps}&end_date=${pe}`
      );

      const payload = res.data ?? {};
      // Support several possible shapes returned by the API
      const rows = Array.isArray(payload)
        ? payload
        : payload.items ?? payload.rows ?? payload.table ?? [];
      const total =
        payload.total_amount ?? payload.total ?? payload.totalAmount ?? 0;

      setItems(rows);
      setPreviewTotal(total);
    } catch {
      setError("Failed to compute invoice preview.");
      setItems([]);
      setPreviewTotal(0);
    } finally {
      setLoadingPreview(false);
    }
  }, [projectId, startDate, endDate, canPreview]);

  // Call getInvoiceTable whenever any input changes (projectId, dates, clientName)
  useEffect(() => {
    getInvoiceTable();
  }, [getInvoiceTable, clientName]);

  const canSubmit =
    Boolean(projectId) &&
    Boolean(clientName.trim()) &&
    Boolean(startDate) &&
    Boolean(endDate) &&
    !endBeforeStart &&
    !loadingPreview;

  const handleCreateInvoice = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    const payload = {
      client_name: clientName,
      period_start: format(startOfDay(startDate), "yyyy-MM-dd"),
      period_end: format(startOfDay(endDate), "yyyy-MM-dd"),
    };

    try {
      const res = await api.post(
        `/projects/${projectId}/invoices/generate`,
        payload
      );
      const inv = res?.data?.invoice;
      setSuccessMsg(`Invoice created successfully.`);
    } catch {
      setError("Failed to create invoice. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper
        sx={{ p: 3, height: "100%", boxSizing: "border-box", width: "100%" }}
        elevation={0}
      >
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>
            Create Invoice
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {successMsg && <Alert severity="success">{successMsg}</Alert>}
          {/* Project + client */}
          <Box>
            <Box sx={{ minWidth: 260, mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Project
              </Typography>
              <Select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                fullWidth
                size="small"
                disabled={loadingProjects || submitting}
              >
                {projects.map((p) => (
                  <MenuItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={{ minWidth: 260 }}>
              <Typography variant="caption" color="text.secondary">
                Client Name
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {clientName || <span style={{ color: "#888" }}>—</span>}
              </Typography>
            </Box>
          </Box>
          {/* Period */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="flex-start"
          >
            <Box sx={{ minWidth: 220 }}>
              <Typography variant="caption" color="text.secondary">
                Period Start
              </Typography>
              <DatePicker
                value={startDate}
                onChange={(d) => {
                  setStartDate(d);
                  if (
                    d &&
                    endDate &&
                    isBefore(startOfDay(endDate), startOfDay(d))
                  ) {
                    setEndDate(d);
                  }
                }}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
                maxDate={endDate || undefined}
                disabled={submitting}
              />
            </Box>

            <Box sx={{ minWidth: 220 }}>
              <Typography variant="caption" color="text.secondary">
                Period End
              </Typography>
              <DatePicker
                value={endDate}
                onChange={(d) => setEndDate(d)}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
                minDate={startDate || undefined}
                defaultCalendarMonth={startDate || undefined}
                disabled={submitting}
              />
            </Box>

            <Box sx={{ flexGrow: 1 }} />
          </Stack>
          {/* Preview table */}
          <Paper variant="outlined" sx={{ p: 2, overflowX: "auto" }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Preview
              </Typography>
              {loadingPreview && <CircularProgress size={16} />}
            </Stack>

            <Table
              size="small"
              sx={{
                minWidth: { xs: 650, sm: 820 },
                tableLayout: "auto",
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Task</TableCell>
                  <TableCell>Phase</TableCell>
                  <TableCell>Contributor</TableCell>
                  <TableCell align="right">Hours</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      style={{ color: "#888" }}
                    >
                      {canPreview
                        ? "No billable time in this period."
                        : "Select project and period."}
                    </TableCell>
                  </TableRow>
                )}
                {items.map((it, i) => (
                  <TableRow key={i}>
                    <TableCell>{it.task}</TableCell>
                    <TableCell>{it.phase}</TableCell>
                    <TableCell>
                      {it.task_contributor || it.contributor || (
                        <span style={{ color: "#888" }}>—</span>
                      )}
                    </TableCell>
                    <TableCell align="right">{it.hours}</TableCell>
                    <TableCell align="right">
                      ${(it.rate ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      ${(it.amount ?? 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total row */}
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="right"
                    style={{ fontWeight: 700 }}
                  >
                    Total:
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: 700 }}>
                    ${previewTotal.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
          {/* Create Invoice */}
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={handleCreateInvoice}
              disabled={!canSubmit || submitting || loadingProjects}
              startIcon={submitting ? <CircularProgress size={18} /> : null}
            >
              {submitting ? "Creating…" : "Create Invoice"}
            </Button>
          </Stack>
          <Divider />
          <Typography variant="body2" color="text.secondary">
            Preview computes from your data: billable time entries within the
            period × assignment rate, grouped by task.
          </Typography>
        </Stack>
      </Paper>
    </LocalizationProvider>
  );
}
