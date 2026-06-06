import React, { useEffect, useState } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { getCurrentUser } from './lib/auth';
import { AuthState } from './types';
import { Toaster } from 'react-hot-toast';

function App() {
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then(state => {
      setAuthState(state);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      {authState?.user ? <Dashboard user={authState.user} /> : <Login />}
    </>
  );
}

export default App;