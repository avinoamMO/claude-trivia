import { useSession } from "./hooks/useSession";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";

export default function App() {
  const { sessionId, name, loggedIn, login, logout, loading } = useSession();

  if (!loggedIn || !sessionId || !name) {
    return <LoginPage onLogin={login} loading={loading} />;
  }

  return <MainPage sessionId={sessionId} name={name} onLogout={logout} />;
}
