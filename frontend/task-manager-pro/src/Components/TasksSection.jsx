import React, { useState } from "react";
import { Paper, Box, Button } from "@mui/material";
import CreateTaskSidebar from "./CreateTaskSidebar";
import { useEffect } from "react";
import api from "../api";
import SettingsIcon from "@mui/icons-material/Settings";
import NEWTaskContributorsSidebar from "./NEWTaskContributorsSidebar";
import { BeatLoader } from "react-spinners";

const TasksSection = ({ phase, onBudgetUpdate, disableAddTask = false }) => {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showCreateTaskSidebar, setShowCreateTaskSidebar] = useState(false);
  const [phaseTasks, setPhaseTasks] = useState([]);
  const [showAssignContributorsModal, setShowAssignContributorsModal] =
    useState(false);
  const [loadingBudgetDetails, setLoadingBudgetDetails] = useState(false);

  async function getPhaseTasks(phaseId) {
    api
      .get(`/tasks/`, { params: { phase_id: phaseId } })
      .then((response) => {
        console.log("Tasks fetched:", response.data);
        setPhaseTasks(response.data);
        getTaskActualSpend(response.data);
      })
      .catch((error) => {
        console.error("Error fetching tasks:", error);
      });
  }

  async function getTaskActualSpend(tasks) {
    setLoadingBudgetDetails(true);
    const requests = tasks.map((task) =>
      api
        .patch(`/tasks/${task.id}/actual-spend/`, {})
        .then((response) => {
          if (response.status === 200) {
            task.actual_spend = response.data.actual_spend;
          }
          console.log(
            `Success: Actual spend for task ${task.id}:`,
            response.data.actual_spend
          );
        })
        .catch((error) => {
          console.error(
            `Error fetching actual spend for task ${task.id}:`,
            error
          );
        })
    );
    Promise.all(requests).then(() => {
      setPhaseTasks([...tasks]);
      setLoadingBudgetDetails(false);
      if (onBudgetUpdate) onBudgetUpdate(tasks);
      //SET BUDGET UPDATE HERE FOR THE PHASE
    });
  }

  useEffect(() => {
    if (!phase || !phase.id) return;

    getPhaseTasks(phase.id);
  }, []);

  return (
    <>
      <Box>
        {phaseTasks.map((task, taskIdx) => (
          <Paper
            key={taskIdx}
            elevation={1}
            sx={{
              width: "auto",
              minHeight: 140,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              mb: 2,
              borderRadius: 2,
              p: 2,
              position: "relative",
            }}
          >
            {/* Title */}
            <Box
              sx={{
                fontWeight: "bold",
                fontSize: 18,
                mb: 0.5,
                textAlign: "left",
              }}
            >
              {task.title}
            </Box>
            {/* Description */}
            <Box
              sx={{
                fontSize: 13,
                color: "text.secondary",
                mb: 1,
                textAlign: "left",
              }}
            >
              {task.description}
            </Box>

            {/* Dates and Due */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Box sx={{ fontSize: 13 }}>
                {task.start_date} - {task.end_date}
              </Box>
              <Box sx={{ fontSize: 13, fontWeight: "bold", ml: 2 }}>
                DUE: {task.due_date}
              </Box>
            </Box>
            {/* Budget */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Box sx={{ fontSize: 13, mr: 3 }}>Budget: ${task.budget}</Box>
              <Box sx={{ fontSize: 13, mr: 3 }}>
                Actual Spend:{" "}
                {loadingBudgetDetails ? (
                  <BeatLoader size={10} />
                ) : (
                  `$${task.actual_spend || 0}`
                )}
              </Box>
              <Box sx={{ fontSize: 13, fontWeight: "bold" }}>
                Remaining:{" "}
                {loadingBudgetDetails ? (
                  <BeatLoader size={10} />
                ) : (
                  `$${task.budget - (task.actual_spend || 0)}`
                )}
              </Box>
            </Box>
            {/* Status and Manage Button */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                mt: 2,
              }}
            >
              <Box sx={{ pl: 1 }}>
                <span style={{ fontSize: 13 }}>Status: </span>
                <span
                  style={{ fontWeight: "bold", fontSize: 13, marginLeft: 8 }}
                >
                  {task.status}
                </span>
              </Box>
              <Box sx={{ position: "relative" }}>
                <Button
                  variant="contained"
                  sx={{
                    minWidth: 0,
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    p: 0,
                    bgcolor: "grey.200",
                    color: "primary.main",
                    boxShadow: 1,
                    "&:hover": { bgcolor: "grey.300" },
                  }}
                  onMouseEnter={() => setShowAddTaskModal(taskIdx)}
                  onMouseLeave={() => setShowAddTaskModal(false)}
                  onClick={() => setShowAssignContributorsModal(true)}
                >
                  <SettingsIcon style={{ fontSize: 22 }} />
                </Button>
                {showAddTaskModal === taskIdx && (
                  <Paper
                    elevation={3}
                    sx={{
                      position: "absolute",
                      bottom: 44,
                      right: 0,
                      px: 2,
                      py: 1,
                      zIndex: 10,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      className="material-icons"
                      style={{ fontSize: 20, verticalAlign: "middle" }}
                    >
                      Assign Contributors
                    </span>
                  </Paper>
                )}
              </Box>
            </Box>
            {showAssignContributorsModal && (
              <NEWTaskContributorsSidebar
                task={task}
                phase={phase}
                open={showAssignContributorsModal}
                onClose={() => setShowAssignContributorsModal(false)}
              />
            )}
          </Paper>
        ))}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <Button
            variant="contained"
            title={disableAddTask ? "Confirm phases to add tasks" : "Add Task"}
            disabled={disableAddTask}
            sx={{
              minWidth: 0,
              width: 40,
              height: 40,
              borderRadius: "50%",
              p: 0,
              fontSize: 28,
              bgcolor: disableAddTask ? "grey.300" : "grey.200",
              color: "primary.main",
              boxShadow: 1,
              cursor: disableAddTask ? "not-allowed" : "pointer",
              "&:hover": { bgcolor: disableAddTask ? "grey.300" : "grey.300" },
            }}
            onMouseEnter={() => setShowAddTaskModal("add")}
            onMouseLeave={() => setShowAddTaskModal(false)}
            onClick={() => !disableAddTask && setShowCreateTaskSidebar(true)}
          >
            +
          </Button>
          {/* Modal for Add Task */}
          {showAddTaskModal === "add" && (
            <Paper
              elevation={3}
              sx={{
                position: "absolute",
                mt: 5,
                left: "50%",
                transform: "translateX(-50%)",
                px: 2,
                py: 1,
                zIndex: 10,
              }}
            >
              Add Task
            </Paper>
          )}
        </Box>
      </Box>
      {showCreateTaskSidebar && (
        <CreateTaskSidebar
          phase={phase}
          open={showCreateTaskSidebar} // boolean, not a function
          onClose={() => setShowCreateTaskSidebar(false)}
          onSubmit={() => getPhaseTasks(phase.id)}
        />
      )}
    </>
  );
};

export default TasksSection;
