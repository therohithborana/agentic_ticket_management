import { useState, useEffect } from "react";

export default function AuthDebug() {
  const [authState, setAuthState] = useState({
    token: null,
    user: null,
    isLoggedIn: false
  });

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      
      setAuthState({
        token: token,
        user: user ? JSON.parse(user) : null,
        isLoggedIn: !!token
      });
    };

    checkAuth();
    
    // Listen for storage changes
    window.addEventListener('storage', checkAuth);
    
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthState({
      token: null,
      user: null,
      isLoggedIn: false
    });
  };

  const setTestAuth = () => {
    const testToken = "test-token-123";
    const testUser = { email: "test@example.com", role: "user" };
    localStorage.setItem("token", testToken);
    localStorage.setItem("user", JSON.stringify(testUser));
    setAuthState({
      token: testToken,
      user: testUser,
      isLoggedIn: true
    });
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm z-50">
      <h3 className="font-bold text-gray-800 mb-2">Auth Debug</h3>
      <div className="space-y-2 text-sm text-gray-800">
        <div>
          <strong>Token:</strong> {authState.token ? "✅ Present" : "❌ Missing"}
        </div>
        <div>
          <strong>User:</strong> {authState.user?.email || "None"}
        </div>
        <div>
          <strong>Logged In:</strong> {authState.isLoggedIn ? "✅ Yes" : "❌ No"}
        </div>
        <div className="pt-2 space-x-2">
          <button 
            onClick={setTestAuth}
            className="btn btn-xs btn-primary"
          >
            Set Test Auth
          </button>
          <button 
            onClick={clearAuth}
            className="btn btn-xs btn-error"
          >
            Clear Auth
          </button>
        </div>
      </div>
    </div>
  );
} 