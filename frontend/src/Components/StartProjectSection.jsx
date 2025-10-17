import React from "react";
import { Box, Typography, Button } from "@mui/material";
import api from "../api";

const StartProjectSection = ({ project, onSubmit }) => {
  const isStarted = Boolean(project?.started);

  function startProject() {
    if (isStarted) return;
    const projectParam = { ...project, started: true };

    api
      .put(`/projects/${project.id}/`, projectParam)
      .then((response) => {
        console.log("Project started:", response.data);
        if (onSubmit) onSubmit();
        //For later: Make the START PROJECT button different; either fade it to grey or replace it with an "End Project" button.
      })
      .catch((error) => {
        console.error("Error starting project:", error);
      });
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bgcolor="background.default"
      p={10}
    >
      <Typography
        variant="h6"
        color="rgba(39, 39, 39, 1)"
        fontSize="15px"
        sx={{ mb: 3 }}
      >
        <b>
          NOTE: By beginning the project, you agree that all phase details have
          been finalized and are ready to be locked in.
        </b>
      </Typography>
      <Button
        variant="contained"
        size="large"
        disabled={isStarted}
        sx={{
          bgcolor: isStarted ? "grey.400" : "green",
          color: isStarted ? "grey.100" : "white",
          fontSize: "1.25rem",
          px: 5,
          py: 2,
          boxShadow: isStarted ? "none" : undefined,
          cursor: isStarted ? "not-allowed" : "pointer",
          "&:hover": {
            bgcolor: isStarted ? "grey.400" : "darkgreen",
          },
        }}
        onClick={startProject}
        title={isStarted ? "Project already started" : "Start project"}
      >
        {isStarted ? "PROJECT STARTED" : "START PROJECT"}
      </Button>
    </Box>
  );
};

export default StartProjectSection;
