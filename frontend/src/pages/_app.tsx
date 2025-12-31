import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { initializeAuth } from '@/hooks/useAuth';
import '@/styles/globals.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initialize = async () => {
      try {
        const isAuthenticated = await initializeAuth();
        
        // Only redirect if we're on a protected route and not authenticated
        const publicRoutes = ['/login', '/register', '/'];
        const isPublicRoute = publicRoutes.includes(router.pathname);
        
        if (!isAuthenticated && !isPublicRoute) {
          // Only redirect to login if not on a public route
          router.replace('/login');
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // On error, only redirect if not on public routes
        const publicRoutes = ['/login', '/register', '/'];
        const isPublicRoute = publicRoutes.includes(router.pathname);
        
        if (!isPublicRoute) {
          router.replace('/login');
        }
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, [router]);

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {/* React Query DevTools - Disabled due to port mismatch issues */}
      {/* {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )} */}
    </QueryClientProvider>
  );
}