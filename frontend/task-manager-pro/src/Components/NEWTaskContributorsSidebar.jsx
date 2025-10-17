import React, { useEffect, useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import {
  Drawer,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import api from '../api';

const NEWTaskContributorsSidebar = ({ open, onClose, task, phase }) => {
  const [contributors, setContributors] = useState([]);
  const [originalContributors, setOriginalContributors] = useState([]); // keep server snapshot to detect unsaved changes
  const [usersList, setUsersList] = useState([]);
  const [allStaffingList, setAllStaffingList] = useState([]);

  // Normalize API data — ensure all rows include assignment_id (backend uses it for updates)
  const normalizeAssignments = (rows = []) =>
    rows.map((a) => ({
      id: a?.id ?? null,
      assignment_id: a?.assignment_id ?? a?.id ?? null,
      user_id: a?.user_id ?? '',
      task_id: a?.task_id ?? task.id,
      hourly_rate: a?.hourly_rate ?? 0,
    }));

  // For reliable equality comparison between state and original server data
  const comparable = (rows) =>
    [...rows]
      .map((r) => ({
        assignment_id: r.assignment_id ?? null,
        user_id: r.user_id ?? '',
        hourly_rate: Number(r.hourly_rate) || 0,
      }))
      .sort((a, b) =>
        (a.assignment_id ?? 0) - (b.assignment_id ?? 0) ||
        String(a.user_id).localeCompare(String(b.user_id))
      );

  const isEqualDeep = (a, b) =>
    JSON.stringify(comparable(a)) === JSON.stringify(comparable(b));

  // Fast lookup for display names
  const byUserId = useMemo(() => {
    const map = new Map();
    usersList.forEach((u) => map.set(u.id, u));
    return map;
  }, [usersList]);

  // Load all possible users and project staffing (for hourly rate lookup)
  const fetchUsersAndStaffing = async () => {
    try {
      const usersRes = await api.get('/users/', { params: { role: 'contributor' } });
      setUsersList(usersRes.data || []);
    } catch (err) {
      console.error('Error fetching contributors list:', err);
      setUsersList([]);
    }

    try {
      const staffingRes = await api.get(`/projects/${phase.project_id}/staffing/`);
      setAllStaffingList(staffingRes.data || []);
    } catch (err) {
      console.error('Error fetching project staffing:', err);
      setAllStaffingList([]);
    }
  };

  // Fetch current task → contributor assignments from server
  const fetchAssignments = async () => {
    try {
      const res = await api.get('/projects/tasks/assignments', { params: { task_id: task.id } });
      const normalized = normalizeAssignments(res.data || []);
      setContributors(normalized);
      setOriginalContributors(normalized); // record baseline for dirty detection
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setContributors([]);
      setOriginalContributors([]);
    }
  };

  // Refresh data every time the drawer opens — ensures up-to-date view of contributors
  useEffect(() => {
    if (!open || !task?.id || !phase?.project_id) return;
    fetchAssignments();
    fetchUsersAndStaffing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id, phase?.project_id]);

  // Prevent adding multiple blank rows; blank rows confuse validation
  const handleAddContributor = () => {
    if (contributors.some((c) => !c.user_id)) return;
    setContributors((prev) => [
      ...prev,
      { id: null, assignment_id: null, user_id: '', task_id: task.id, hourly_rate: 0 },
    ]);
  };

  // Update contributor inline; pulls hourly rate automatically from staffing table
  const handleContributorChange = (index, field, value) => {
    setContributors((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        if (field === 'user_id') {
          const staffing = allStaffingList.find((s) => s.user_id === value);
          return {
            ...row,
            user_id: value,
            hourly_rate: staffing?.hourly_rate ?? row.hourly_rate ?? 0,
          };
        }
        return { ...row, [field]: value };
      })
    );
  };

  // Send minimal changes to backend — upserts by assignment_id to prevent duplicates
  const confirmChanges = async () => {
    const byUser = new Map(); // ensure one row per user
    for (const c of contributors) {
      if (!c.user_id) continue;
      byUser.set(c.user_id, c);
    }

    const payload = Array.from(byUser.values()).map((c) => ({
      assignment_id: c.assignment_id ?? c.id ?? undefined, // backend uses this for update logic
      user_id: c.user_id,
      task_id: task.id,
      hourly_rate: Number(c.hourly_rate) || 0,
    }));

    try {
      await api.put(`/projects/tasks/${task.id}/assignments`, payload);
      // refetch to reset local dirty flag and display updated values
      await fetchAssignments();
      if (onClose) onClose();
    } catch (err) {
      console.error('Error updating assignments:', err);
    }
  };

  // --- Button enablement logic ---
  const hasRows = contributors.length > 0;
  const allChosen = hasRows && contributors.every((r) => r.user_id !== '');
  const hasDupes = (() => {
    const seen = new Set();
    for (const r of contributors) {
      if (!r.user_id) continue;
      if (seen.has(r.user_id)) return true; // duplicate user assigned twice
      seen.add(r.user_id);
    }
    return false;
  })();
  const isDirty = !isEqualDeep(contributors, originalContributors); // only enable if unsaved changes exist
  const canConfirm = hasRows && allChosen && !hasDupes && isDirty;

  // Merge staffing info + user display names for dropdown
  const staffedUsers = allStaffingList.map((s) => {
    const u = byUserId.get(s.user_id);
    return { id: s.user_id, name: u?.name ?? 'Unknown' };
  });

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 400 } }}>
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Assign Contributors to Task
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddContributor}
          sx={{ mb: 2 }}
        >
          Assign Contributor
        </Button>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Hourly Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contributors.map((row, idx) => {
              const stableKey =
                (row.assignment_id && `aid-${row.assignment_id}`) ||
                (row.id && `id-${row.id}`) ||
                `temp-${idx}`;

              return (
                <TableRow key={stableKey}>
                  <TableCell>
                    <Select
                      value={row.user_id}
                      onChange={(e) => handleContributorChange(idx, 'user_id', e.target.value)}
                      displayEmpty
                      fullWidth
                    >
                      <MenuItem value="">
                        <em>Select User</em>
                      </MenuItem>
                      {staffedUsers.map((u) => {
                        const alreadyChosen = contributors.some(
                          (c, i) => i !== idx && c.user_id === u.id
                        );
                        return (
                          <MenuItem key={u.id} value={u.id} disabled={alreadyChosen}>
                            {u.name}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </TableCell>

                  <TableCell>
                    {row.hourly_rate ? `$${row.hourly_rate}` : '--'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Box sx={{ flexGrow: 1 }} />

        {/* Disabled until user actually changes something or adds a contributor */}
        <Button
          variant="contained"
          color="primary"
          disabled={!canConfirm}
          sx={{ mt: 2 }}
          fullWidth
          onClick={confirmChanges}
        >
          Confirm Changes
        </Button>
      </Box>
    </Drawer>
  );
};

export default NEWTaskContributorsSidebar;
