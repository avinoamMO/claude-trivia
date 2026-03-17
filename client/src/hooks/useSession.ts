import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { joinUser } from "../lib/api";

const STORAGE_SESSION_KEY = "trivia_sessionId";
const STORAGE_NAME_KEY = "trivia_name";

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_SESSION_KEY)
  );
  const [name, setName] = useState<string | null>(
    () => localStorage.getItem(STORAGE_NAME_KEY)
  );
  const [loading, setLoading] = useState(false);

  const loggedIn = Boolean(sessionId && name);

  const login = useCallback(async (userName: string) => {
    setLoading(true);
    try {
      const id = uuidv4();
      await joinUser(id, userName);
      localStorage.setItem(STORAGE_SESSION_KEY, id);
      localStorage.setItem(STORAGE_NAME_KEY, userName);
      setSessionId(id);
      setName(userName);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_SESSION_KEY);
    localStorage.removeItem(STORAGE_NAME_KEY);
    setSessionId(null);
    setName(null);
  }, []);

  // Re-join on mount if session exists (re-register with server)
  useEffect(() => {
    if (sessionId && name) {
      joinUser(sessionId, name).catch(() => {
        // Server might be down — that's fine, we'll retry on next action
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { sessionId, name, loggedIn, login, logout, loading };
}
