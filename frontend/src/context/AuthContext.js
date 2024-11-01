import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize user state with debugging
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.debug('User loaded from localStorage:', parsedUser);
        return parsedUser;
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        return null; // Fallback to null if parsing fails
      }
    }
    console.debug('No user found in localStorage');
    return null; // Return null if no user is found
  });
  
  // Initialize token state with debugging
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      console.debug('Token loaded from localStorage:', storedToken);
    } else {
      console.debug('No token found in localStorage');
    }
    return storedToken;
  });

  const login = (userData, token) => {
    console.debug('Logging in user:', userData);
    setUser(userData);
    setToken(token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    console.debug('User and token stored in localStorage');
  };

  const logout = () => {
    console.debug('Logging out user');
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    console.debug('User and token removed from localStorage');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
