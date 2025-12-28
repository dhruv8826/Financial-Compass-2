import { User } from '../types';

const USERS_KEY = 'financial_tracker_users';
const SESSION_KEY = 'financial_tracker_session';

export const getUsers = (): User[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const register = (username: string, password: string): { success: boolean; message?: string; user?: User } => {
  const users = getUsers();
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, message: 'Username already exists' };
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    username,
    password, // Note: storing password in plaintext/localStorage is insecure for production apps.
    createdAt: Date.now()
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  // Auto login after register
  localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
  
  return { success: true, user: newUser };
};

export const login = (username: string, password: string): { success: boolean; message?: string; user?: User } => {
  const users = getUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return { success: true, user };
  }

  return { success: false, message: 'Invalid username or password' };
};

export const logout = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
};
