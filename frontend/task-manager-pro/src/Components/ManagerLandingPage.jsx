import api from "../api";
import ProjectPopup from "./ProjectPopup";
import ProjectSetup from "./ProjectSetup";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { useEffect, useState } from "react";

const ManagerLandingPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [projectSetupOpen, setProjectSetupOpen] = useState(false);
  const [projectPopupOpen, setProjectPopupOpen] = useState(false);
  const [projectSelected, setProjectSelected] = useState(null);
  const [projects, setProjects] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [targetProject, setTargetProject] = useState(null);

  async function getProjects() {
    api
      .get("/projects/")
      .then((response) => setProjects(response.data))
      .catch((error) => console.error("Error fetching projects:", error));
  }

  useEffect(() => {
    getProjects();
  }, []);

  const openDeleteModal = (e, project) => {
    e.stopPropagation();
    setTargetProject(project);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetProject) return;
    setDeletingId(targetProject.id);
    try {
      await api.delete(`/projects/${targetProject.id}`);
      await getProjects();
      setDeleteModalOpen(false);
      if (projectPopupOpen && projectSelected?.id === targetProject.id) {
        setProjectPopupOpen(false);
        setProjectSelected(null);
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
      alert("Failed to delete project. Check console for details.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div
        style={{ position: "relative", minHeight: "100vh", padding: "2rem" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
            overflowY: "auto",
            width: "100%",
            alignItems: "center",
          }}
        >
          {projects.map((project) => (
            <div
              key={project.id}
              style={{
                minHeight: 140,
                background: "#ebebebff",
                color: "#0b0d22ff",
                padding: 24,
                borderRadius: 8,
                width: "100vw",
                maxWidth: 900,
                transition: "background 0.2s",
                cursor: "pointer",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f9ffa0ff")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#ebebebff")
              }
              onClick={() => {
                setProjectSelected(project);
                setProjectPopupOpen(true);
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <h2 style={{ margin: 0, fontSize: "2rem", fontWeight: 700 }}>
                  {project.name}
                </h2>
                <div style={{ marginTop: 4, fontSize: "1rem", color: "#555" }}>
                  {project.client_name}
                </div>
                <div
                  style={{ marginTop: 8, fontSize: "0.95rem", color: "#aaa" }}
                >
                  {project.start_date} – {project.end_date}
                </div>
              </div>

              {/* Delete Button */}
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  right: 16,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <button
                  style={{
                    background: "#d32f2f",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: "1rem",
                    cursor:
                      deletingId === project.id ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                    opacity: deletingId === project.id ? 0.7 : 1,
                  }}
                  onClick={(e) => openDeleteModal(e, project)}
                  disabled={deletingId === project.id}
                >
                  {deletingId === project.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Floating '+' button */}
        <div style={{ position: "fixed", bottom: 32, right: 32, zIndex: 1000 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <button
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                background: "#1976d2",
                color: "#fff",
                fontSize: 48,
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
              onMouseEnter={() => setShowModal(true)}
              onMouseLeave={() => setShowModal(false)}
              onClick={() => setProjectSetupOpen(true)}
            >
              +
            </button>
            {showModal && (
              <div
                style={{
                  position: "absolute",
                  bottom: 80,
                  right: 0,
                  background: "#fff",
                  color: "#333",
                  padding: "12px 24px",
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  whiteSpace: "nowrap",
                }}
              >
                Create Project
              </div>
            )}
          </div>
        </div>
      </div>

      <ProjectSetup
        open={projectSetupOpen}
        onClose={() => setProjectSetupOpen(false)}
        onSubmit={getProjects}
      />

      {projectPopupOpen && (
        <ProjectPopup
          project={projectSelected}
          onClose={() => setProjectPopupOpen(false)}
        />
      )}

      {/* 🧱 Delete confirmation modal */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        projectName={targetProject?.name}
        loading={deletingId === targetProject?.id}
      />
    </>
  );
};

export default ManagerLandingPage;
