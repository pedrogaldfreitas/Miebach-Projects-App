import React from "react";
import { Box, Container, Grid, Paper, Typography } from "@mui/material";
import ContributorTaskView from "./ContributorTaskView";
import { useEffect, useState } from "react";
import api from "../api";

const ContributorLandingPage = () => {
  const [tasks, setTasks] = useState([]);
  const [authUserId, setAuthUserId] = useState(() => {
    const v = Number(sessionStorage.getItem("auth_user_id"));
    return Number.isFinite(v) && v > 0 ? v : null;
  });

  useEffect(() => {
    if (authUserId) return;
    (async () => {
      try {
        const { data } = await api.get("/me");
        setAuthUserId(data.id);
        sessionStorage.setItem("auth_user_id", String(data.id));
      } catch {
        setAuthUserId(null);
      }
    })();
  }, [authUserId]);

  useEffect(() => {
    if (!authUserId) return;
    api
      .get(`/tasks/`, { params: { user_id: authUserId } })
      .then((response) => {
        setTasks(response.data);
      })
      .catch((error) => {
        console.error("Error fetching tasks:", error);
      });
  }, [authUserId]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Contributor Tasks
      </Typography>
      <Grid container spacing={3}>
        {tasks.map((task, idx) => (
          <Grid item xs={12} sm={6} md={4} key={task.id || idx}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                backgroundColor: "#fff",
                minHeight: 120,
                minWidth: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ContributorTaskView task={task} auth_user_id={authUserId} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ContributorLandingPage;
