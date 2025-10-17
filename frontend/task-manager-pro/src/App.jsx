import "./App.css";
import ManagerLandingPage from "./Components/ManagerLandingPage";
import ProjectSetup from "./Components/ProjectSetup";
import SignInPage from "./Components/SignInPage";
import { Routes, Route } from "react-router-dom";
import ContributorLandingPage from "./Components/ContributorLandingPage";
import { useEffect, useState } from "react";
import RequireRole from "./Components/RequireRole";

function App() {
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState(0);

  useEffect(() => {
    sessionStorage.removeItem("auth_user_id");
    sessionStorage.removeItem("auth_role");
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <SignInPage
            onSignIn={(user) => {
              sessionStorage.setItem("auth_user_id", String(user.user_id));
              sessionStorage.setItem("auth_role", user.role);
              setUserId(user.user_id);
              setUserRole(user.role);
            }}
          />
        }
      />
      <Route
        path="/manager"
        element={
          <RequireRole role="manager">
            <ManagerLandingPage />
          </RequireRole>
        }
      />
      <Route
        path="/contributor"
        element={
          <RequireRole role="contributor">
            <ContributorLandingPage />
          </RequireRole>
        }
      />
    </Routes>
  );
}

export default App;
