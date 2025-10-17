import React, { useState } from 'react';
import {
    Drawer,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Stack,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../api';
import { useEffect } from 'react';

// Props to be passed in later:
// contributors: [{ id, name, hourlyRate }]
// availableContributors: [{ id, name, hourlyRate }]
const TaskContributorsSidebar = ({
    task,
    open,
    onClose,
    contributors = [],
    availableContributors = [],
    onConfirmAssignment
}) => {
    const [newRows, setNewRows] = useState([]);
    const [allStaffingList, setAllStaffingList] = useState(contributors);
    const [contributorsInTask, setContributorsInTask] = useState(contributors);
    const [assignments, setAssignments] = useState([]);

    async function getContributorsStaffedInProject() {

        api.get(`/projects/${task.project_id}/staffing/`).then((response) => {
            console.log("Contributors staffed in project fetched:", response.data);
            setAllStaffingList(response.data);
        }).catch((error) => {
            console.error("Error fetching contributors staffed in project:", error);
        });
    }

    async function getContributorsInTask() {
        api.get(`/projects/tasks/${task.id}/contributors/`).then((response) => {
            console.log("Contributors in task:", response.data);
            setContributorsInTask(response.data);
        }).catch((error) => {
            console.error("Error fetching contributors in task:", error);
        });
    }

    useEffect(() => {  
        getContributorsStaffedInProject();
        getContributorsInTask();
        api.get(`/projects/tasks/${task.id}/assignments/`).then((response) => {
            console.log("Assignments in task:", response.data);
            setAssignments(response.data);
        }).catch((error) => {
            console.error("Error fetching contributors assignments in task:", error);
        });
    }, []);

    // Handle dropdown change
    const handleContributorChange = (index, contributorId) => {
        //const selected = availableContributors.find(c => c.id === contributorId);
        const selected = allStaffingList.find(c => c.id === contributorId);
        const updatedRows = [...newRows];
        updatedRows[index] = selected ? { ...selected } : null;
        setNewRows(updatedRows);
        setContributorsInTask([...contributorsInTask, selected]);
    };

    // Add new row
    const handleAddRow = () => {
        setNewRows([...newRows, null]);
        console.log("Rows after adding:", newRows)
    };

    // Confirm assignment
    const handleConfirm = () => {

        const taskAssignments = contributorsInTask.map(c => {
            const sanitizedRow = {
                task_id: task.id,
                user_id: c.id,
                hourly_rate: c.hourlyRate || 50 // Placeholder, replace with actual rate
            }
            return sanitizedRow;
        })
        console.log("Task Assignments to Assign: ", taskAssignments);

        api.put(`/projects/tasks/${task.id}/contributors/`, taskAssignments).then((response) => {
            console.log("Contributors assigned:", response.data);
            if (onConfirmAssignment) {
                onConfirmAssignment(newRows.filter(Boolean));
                setNewRows([]);
                api.patch(`/tasks/${task.id}/actual-spend/`, {}).then(() => {
                    console.log("Actual spend updated after assigning contributors.");
                }).catch((error) => {      
                    console.error("Error updating actual spend after assigning contributors:", error);
                }); 
            }
        }).catch((error) => {
            console.error("Error assigning contributors:", error);
        });

        if (onClose) onClose();
    };

    // Check if all new rows are selected
    const canConfirm = newRows.length > 0 && newRows.every(row => row);

    return (
        <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 600 } }}>
            <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Assign Contributors
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Button variant="contained" onClick={handleAddRow}>
                        Add Contributor
                    </Button>
                </Stack>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Hourly Rate</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {assignments.map((a) => {
                            const rowName = allStaffingList.find(s => s.user_id === a.user_id)?.name || 'Unknown';
                            return (
                            <TableRow key={a.id}>
                                <TableCell>{rowName}</TableCell>
                                <TableCell>{a.hourly_rate}</TableCell>
                            </TableRow>
                        )})}
                        {newRows.map((row, idx) => (
                            <TableRow key={`new-${idx}`}>
                                <TableCell>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Select Contributor</InputLabel>
                                        <Select
                                            value={row ? row.id : ''}
                                            label="Select Contributor"
                                            onChange={e => handleContributorChange(idx, e.target.value)}
                                        >
                                            {allStaffingList.map(c => (
                                                <MenuItem key={c.id} value={c.id}>
                                                    {c.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </TableCell>
                                <TableCell>
                                    {row ? row.hourlyRate : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                    variant="contained"
                    color="primary"
                    disabled={!canConfirm}
                    onClick={handleConfirm}
                    sx={{ mt: 2 }}
                >
                    Confirm Assignment
                </Button>
            </Box>
        </Drawer>
    );
};

export default TaskContributorsSidebar;