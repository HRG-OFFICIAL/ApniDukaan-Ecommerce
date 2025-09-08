import { useState } from 'react';

interface User {
  id: string;
  name?: string;
  email?: string;
}

interface Session {
  user: User | null;
  expires: string;
}

interface SessionContextValue {
  data: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

/**
 * A simple mock of the next-auth useSession hook
 */
export const useSession = (): SessionContextValue => {
  // For now, we'll just return a mock unauthenticated session
  // This would normally be connected to your auth provider
  return {
    data: null,
    status: 'unauthenticated'
  };
};