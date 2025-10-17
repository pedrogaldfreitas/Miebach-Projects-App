import React, { useEffect, useState } from 'react';
import {
    Button,
    Container,
    Box,
    Typography,
    Tabs,
    Tab,
    IconButton,
    Paper,
    Stack,
    Drawer,                
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ProjectStaffingSection from './ProjectStaffingSection';
import api from '../api';
import PhasesSection from './PhasesSection';
import StartProjectSection from './StartProjectSection';
import UtilizationSection from './UtilizationSection';
import InvoiceCreateForm from './InvoiceCreateForm'; // NEW (the form that POSTs /invoices/ with InvoicesBase)

const ProjectPopup = ({ project, onClose }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [projectDetails, setProjectDetails] = useState({});
    const [openInvoice, setOpenInvoice] = useState(false); // NEW

        async function getProjectDetails(projectId) {
                api.get(`/projects/${projectId}/`).then(response => {
                        console.log('Project details fetched:', response.data);
                        setProjectDetails(response.data);
                        api.get(`/projects/${projectId}/total-spend/`).then(response => {
                                console.log('Total spend fetched:', response.data);
                                setProjectDetails(prevDetails => ({ ...prevDetails, total_actual_spend: response.data.total_project_spent}));
                        }).catch(error => {
                                console.error('Error fetching total spend:', error);
                        });
                        api.get(`/projects/${projectId}/forecast-cost/`).then(response => {
                                console.log('Forecasted cost fetched:', response.data);
                                setProjectDetails(prevDetails => ({ ...prevDetails, total_forecasted_cost: response.data.total_project_forecast}));
                        }).catch(error => {
                                console.error('Error fetching forecasted cost:', error);
                        });
                }).catch(error => {
                        console.error('Error fetching project details:', error);
                });
        }

    useEffect(() => {
        getProjectDetails(project.id);
    }, []);

    function startProjectClick() {
        getProjectDetails(project.id);
    }

    return (
        <>
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    height: 'auto',
                }}
            >
                <Container className="project-popup" sx={{ height: 'auto' }}>
                    <Paper elevation={6} sx={{ borderRadius: 2, p: 3, position: 'relative', height: '90vh' }}>
                        {/* Positioned controls: Generate Invoice to the left of the close button */}
                        <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 1, zIndex: 2 }}>
                            <Button variant="contained" onClick={() => setOpenInvoice(true)}>
                                Generate Invoice
                            </Button>
                            <IconButton aria-label="close" onClick={onClose}>
                                <CloseIcon fontSize="large" />
                            </IconButton>
                        </Box>

                        <Box mb={2}>
                                <Typography variant="h5" component="h2" gutterBottom>
                                        {projectDetails.name}
                                </Typography>
                                <Stack direction="row" spacing={3} mb={2}>
                                        <Typography variant="body1"><strong>Client:</strong> {projectDetails.client_name}</Typography>
                                        <Typography variant="body1"><strong>Start Date:</strong> {projectDetails.start_date}</Typography>
                                        <Typography variant="body1"><strong>End Date:</strong> {projectDetails.end_date}</Typography>
                                </Stack>
                                <Stack direction={"row"} spacing={3} mb={2}>
                                        <Typography variant="body1">Forecasted Budget: {projectDetails.total_forecasted_cost ? `$${projectDetails.total_forecasted_cost}` : "--"}</Typography>
                                        <Typography variant="body1">Total Spent: {projectDetails.total_actual_spend ? `$${projectDetails.total_actual_spend}` : "--"}</Typography>
                                        <Typography variant="body1"><strong>Remaining:</strong> {(projectDetails.total_actual_spend && projectDetails.total_forecasted_cost) ? `$${projectDetails.total_forecasted_cost - projectDetails.total_actual_spend}` : "--"}</Typography>
                                </Stack>
                        </Box>

                        {/* Tabs */}
                        <Box>
                            <Tabs
                                value={activeTab}
                                onChange={(_, v) => setActiveTab(v)}
                                indicatorColor="primary"
                                textColor="primary"
                                sx={{ mb: 2 }}
                            >
                                <Tab label="Staffing" />
                                <Tab label="Phases" />
                                <Tab label="Resource Utilization" />
                                <Tab label="Start Project" />
                            </Tabs>

                            <Box sx={{ bgcolor: '#f9f9f9', borderRadius: 2, p: 2 }}>
                                {activeTab === 0 && <ProjectStaffingSection projectId={projectDetails.id} />}
                                {activeTab === 1 && <PhasesSection project={projectDetails} />}
                                {activeTab === 2 && <UtilizationSection project={projectDetails} />}
                                {activeTab === 3 && <StartProjectSection project={projectDetails} onSubmit={startProjectClick} />}
                            </Box>
                        </Box>
                    </Paper>
                </Container>
            </Box>

            {/* NEW: Invoice Drawer (uses /invoices/ with InvoicesBase payload) */}
            <Drawer
                anchor="right"
                open={openInvoice}
                onClose={() => setOpenInvoice(false)}
                PaperProps={{ sx: { width: 520, p: 2 } }}
            >
                <Box sx={{ p: 2, height: '100%', boxSizing: 'border-box' }}>
                    <InvoiceCreateForm
                        initialProjectId={projectDetails?.id}
                        initialClientName={projectDetails?.client_name}
                    />
                </Box>
            </Drawer>
        </>
    );
};

export default ProjectPopup;
