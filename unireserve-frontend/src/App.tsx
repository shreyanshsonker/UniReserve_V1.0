import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiClient from './api/client';
import { router } from './router';
import { useAuthStore } from './stores/authStore';
import type { ApiEnvelope, User } from './types/api';

const queryClient = new QueryClient();

function App() {
  const { setInitialized, setUser } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await apiClient.get<ApiEnvelope<User>>('/users/me/');
        setUser(response.data.data);
      } catch {
        setUser(null);
      } finally {
        setInitialized(true);
      }
    };
    initAuth();
  }, [setUser, setInitialized]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
