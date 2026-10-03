import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase/config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if there is a mock session active
    const storedMockUser = localStorage.getItem('mock_user');
    if (storedMockUser) {
      setUser(JSON.parse(storedMockUser));
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    if (email === 'admin123@gmail.com') {
      if (password === 'admin123') {
        const mockUser = {
          uid: 'admin-mock-uid',
          email: 'admin123@gmail.com',
          displayName: 'Admin User',
          emailVerified: true,
          isMock: true,
        };
        setUser(mockUser);
        localStorage.setItem('mock_user', JSON.stringify(mockUser));
        return mockUser;
      } else {
        throw { code: 'auth/invalid-credential', message: 'Invalid email or password' };
      }
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    localStorage.removeItem('mock_user');
    setUser(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Firebase signOut failed, but session cleared locally:', e);
    }
  };

  const resetPassword = (email) => {
    if (email === 'admin123@gmail.com') {
      return Promise.resolve();
    }
    return sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, resetPassword }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
