import { useState } from "react";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
} from "@mui/material";
import api from "../api";
import { useNavigate } from "react-router-dom";

const SignInPage = ({ onSignIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSignIn = (e) => {
    e.preventDefault();

    api
      .post("/login/", { email, password })
      .then((response) => {
        console.log("Login successful:", response.data);
        onSignIn(response.data);
        navigate(`/${response.data.role}`);
      })
      .catch((error) => {
        console.error("Login failed:", error);
      });
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 8 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Sign In
        </Typography>
        <Box
          component="form"
          onSubmit={handleSignIn}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Sign In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default SignInPage;
