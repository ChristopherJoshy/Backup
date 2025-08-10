import { useState, useEffect } from "react";
import BootScreen from "@/components/BootScreen";
import NeuralInterface from "@/components/NeuralInterface";

export default function NeuralBrew() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Check for stored authentication
    const storedUser = localStorage.getItem("neural_brew_user");
    if (storedUser) {
      setUsername(storedUser);
      setIsAuthenticated(true);
    }
  }, []);

  const handleUsernameSubmit = async (user: string) => {
    setUsername(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("neural_brew_user");
    setIsAuthenticated(false);
    setUsername("");
  };

  return (
    <>
      {!isAuthenticated ? (
        <BootScreen onAuthenticated={handleUsernameSubmit} />
      ) : (
        <NeuralInterface username={username} onLogout={handleLogout} />
      )}
    </>
  );
}
