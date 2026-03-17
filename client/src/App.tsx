import { useEffect } from "react";
import { useSession } from "./hooks/useSession";
import { socket } from "./lib/socket";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";

export default function App() {
  const { sessionId, name, loggedIn, login, logout, loading } = useSession();

  // Connect/disconnect socket based on auth state
  useEffect(() => {
    if (loggedIn && sessionId) {
      socket.auth = { sessionId };
      socket.connect();
      return () => {
        socket.disconnect();
      };
    }
  }, [loggedIn, sessionId]);

  if (!loggedIn || !sessionId || !name) {
    return <LoginPage onLogin={login} loading={loading} />;
  }

  return <MainPage sessionId={sessionId} name={name} onLogout={logout} />;
}
