import React, { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Select, MenuItem, TextField, Button, InputAdornment, Box
} from '@mui/material';
import api from '../api';

const initialRow = {
    user_id: '',
    role_name: '',
    hourly_rate: '',
    forecast_hours: '',
};

function calculateBudget(rate, hours) {
    const r = parseInt(rate, 10);
    const h = parseInt(hours, 10);
    if (isNaN(r) || isNaN(h)) return '';
    return `$${r * h}`;
}

function isRowValid(row) {
    return (
        row.user_id &&
        row.role_name &&
        /^\d+$/.test(row.hourly_rate) &&
        /^\d+$/.test(row.forecast_hours_remaining)
    );
}

export default function ProjectStaffingSection({ projectId }) {
    const [rows, setRows] = useState([]);
    const [contributors, setContributors] = useState([]);
    const [changesMade, setChangesMade] = useState(false);
    
    let rowsOnLoad = [];
    
    React.useEffect(() => {
        // Fetch staffing data for the project
        api.get(`/projects/${projectId}/staffing/`).then(response => {
            if (response?.data?.length === 0) {
                setRows([]);
            } else {
                setRows(response.data);
            }
            rowsOnLoad = response.data;
            
            // Fetch contributor names for dropdown
            api.get('/users/').then(res => {
                const usersFetched = res.data.filter(user => user.role === 'contributor').map(user => ({ id: user.id, name: user.name }));
                setContributors(usersFetched);
            }).catch(err => {
                console.error('Error fetching contributor names:', err);
            });
            
        }).catch(error => {
            console.error('Error fetching staffing data:', error);
        }
    );
}, [projectId]);

const handleChange = (idx, field, value) => {
    if (field === 'user_id') {
        value = contributors.find(c => c.name === value)?.id;
    }
    const updatedRows = rows.map((row, i) =>
        i === idx ? { ...row, [field]: value } : row
    );

    setRows(updatedRows);
    if (JSON.stringify(rows) !== JSON.stringify(rowsOnLoad)) {
        setChangesMade(true);
    } else {
        setChangesMade(false);
    }
};

function applyChanges(rows, projectId) {
    const sanitizedRows = rows.map(row => {
        const hours = row.forecast_hours_remaining;
        const rate = row.hourly_rate;
        const user_id = row.user_id;

        const sanitizedRow = {
            project_id: projectId,
            user_id,
            role_name: row.role_name,
            hourly_rate: rate,
            forecast_hours_initial: hours,
            forecast_hours_remaining: hours,
        };
        if (row.id !== undefined) {
            sanitizedRow.staffing_id = row.id;
        }

        return sanitizedRow;
    });

    api.put(`/projects/${projectId}/staffing/`, sanitizedRows).then(response => {
        console.log('Staffing data saved successfully!');
        setChangesMade(false);
        rowsOnLoad = [...rows];
    }).catch(error => {
        console.error('Error saving staffing data:', error);
    });
}

const handleAddRow = () => {
    setRows([...rows, { ...initialRow }]);
};

    const allRowsValid = rows.every(isRowValid);

    return (
        <Box>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Rate</TableCell>
                            <TableCell>Forecasted Hours</TableCell>
                            <TableCell>Forecasted Budget</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row, idx) => {
                            const valid = isRowValid(row);
                            return (
                                <TableRow
                                    key={idx}
                                    sx={{
                                        '& td': !valid
                                            ? {
                                                border: '2px solid red',
                                                borderRadius: '4px',
                                            }
                                            : {},
                                    }}
                                >
                                    <TableCell>
                                        <Select
                                            value={contributors.find(c => c.id === row.user_id)?.name || ''}
                                            onChange={e => handleChange(idx, 'user_id', e.target.value)}
                                            displayEmpty
                                            fullWidth
                                            size="small"
                                            error={!row.user_id}
                                        >
                                            <MenuItem value="">
                                                <em>Select Name</em>
                                            </MenuItem>
                                            {contributors.map(contributor => (
                                                <MenuItem key={contributor.id} value={contributor.name}>{contributor.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            value={row.role_name}
                                            onChange={e => handleChange(idx, 'role_name', e.target.value)}
                                            variant="outlined"
                                            size="small"
                                            fullWidth
                                            placeholder="Role"
                                            error={!row.role_name}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            value={row.hourly_rate}
                                            onChange={e => {
                                                // Only allow numbers
                                                const val = e.target.value.replace(/\D/g, '');
                                                handleChange(idx, 'hourly_rate', parseInt(val, 10));
                                            }}
                                            variant="outlined"
                                            size="small"
                                            fullWidth
                                            placeholder="Rate"
                                            slotProps={{
                                                input: {
                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                                    inputMode: 'numeric',
                                                    pattern: '[0-9]*'
                                                }
                                            }}
                                            error={!/^\d+$/.test(row.hourly_rate)} />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            value={row.forecast_hours_remaining}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                handleChange(idx, 'forecast_hours_remaining', parseInt(val, 10));
                                            }}
                                            variant="outlined"
                                            size="small"
                                            fullWidth
                                            placeholder="Hours"
                                            slotProps={{
                                                input: {
                                                    inputMode: 'numeric',
                                                    pattern: '[0-9]*'
                                                }
                                            }}
                                            error={!/^\d+$/.test(row.forecast_hours_remaining)}
                                        />
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            backgroundColor: 'grey.200',
                                            fontWeight: 'bold',
                                            color: 'grey.900',
                                        }}
                                    >
                                        {calculateBudget(row.hourly_rate, row.forecast_hours_remaining)}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        <TableRow>
                            <TableCell colSpan={5} align="center">
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={handleAddRow}
                                    variant="outlined"
                                    size="small"
                                >
                                    Add Row
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    disabled={!allRowsValid || !changesMade}
                    onClick={() => applyChanges(rows, projectId)}
                >
                    Apply Changes
                </Button>
            </Box>
        </Box>
    );
}