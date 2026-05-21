import { getAuth } from '@clerk/tanstack-start/server';
import { getEvent } from 'vinxi/http';

export async function getAuthUser() {
  const event = getEvent();
  if (!event) return null;
  try {
    const auth = await getAuth(event.request);
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
