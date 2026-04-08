// Local Mock of Firebase Services

export const db = {}; // Mock database instance
export const auth = {
  get currentUser() {
    const userStr = localStorage.getItem('brandforge_user');
    return userStr ? JSON.parse(userStr) : null;
  }
};
export const googleProvider = {};

// Helper to get all users from localStorage
const getLocalUsers = () => {
  try {
    const usersStr = localStorage.getItem('brandforge_users');
    const parsed = usersStr ? JSON.parse(usersStr) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing local users:', error);
    return [];
  }
};

// Simulate onAuthStateChanged
export const onAuthStateChanged = (authObj: any, callback: (user: any) => void) => {
  callback(authObj.currentUser);
  // Realtime listening not fully needed for this, but we can listen to storage changes
  const listener = () => callback(authObj.currentUser);
  window.addEventListener('storage', listener);
  return () => window.removeEventListener('storage', listener);
};

export const signInWithGoogle = async () => {
  const dummyUser = {
    uid: 'local-user-123',
    email: 'local@brandforge.app',
    displayName: 'Local Designer',
    photoURL: ''
  };
  localStorage.setItem('brandforge_user', JSON.stringify(dummyUser));
  window.dispatchEvent(new Event('storage')); // Trigger update across logic
  window.location.reload(); // Simple reload to re-run all context cleanly
};

export const signInWithEmail = async (email: string, _: string) => {
  const users = getLocalUsers();
  const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    throw new Error('No user found with this email.');
  }

  // In a mock, we just accept any password for now
  localStorage.setItem('brandforge_user', JSON.stringify(user));
  window.dispatchEvent(new Event('storage'));
  window.location.reload();
};

export const signUpWithEmail = async (email: string, _: string, displayName: string) => {
  const users = getLocalUsers();
  if (users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Email already in use.');
  }

  const newUser = {
    uid: `user-${Math.random().toString(36).substr(2, 9)}`,
    email,
    displayName,
    photoURL: ''
  };

  users.push(newUser);
  localStorage.setItem('brandforge_users', JSON.stringify(users));
  localStorage.setItem('brandforge_user', JSON.stringify(newUser));
  localStorage.setItem('brandforge_just_signed_up', 'true');
  
  window.dispatchEvent(new Event('storage'));
  window.location.reload();
};

export const logout = async () => {
  localStorage.removeItem('brandforge_user');
  window.dispatchEvent(new Event('storage'));
  window.location.reload();
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('[LocalDB Error]', operationType, path, error);
}
