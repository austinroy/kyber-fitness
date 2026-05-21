import { getAuth } from '@clerk/tanstack-start/server';
import { getRequest } from '@tanstack/react-start/server';

export async function getAuthUser() {
  try {
    const request = getRequest();
    if (!request) return null;
    const auth = await getAuth(request);
    return auth;
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error('Error fetching Clerk auth in server context:', error);
    return null;
  }
}

export async function requireAuthUser() {
  const auth = await getAuthUser();
  if (!auth || !auth.userId) {
    throw new Error('Unauthorized');
  }
  return auth;
}

