import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { getCookie } from 'cookies-next';
import type { AppRouter } from '@studious-lms/server';

const TRPC_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/trpc';

// Create tRPC client with authentication
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: TRPC_URL,
      headers() {
        const userCookie = getCookie('token');
        return {
          'x-user': userCookie ? userCookie.toString() : '',
        };
      },
    }),
  ],
});

// Helper function to set auth token
export const setAuthToken = (token: string) => {
  document.cookie = `token=${token}`;
};

// Helper function to clear auth token
export const clearAuthToken = () => {
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getCookie('token');
  return token !== null && token !== undefined;
};
