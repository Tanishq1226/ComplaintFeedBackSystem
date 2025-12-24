export const setAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getAuth = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return {
    token,
    user: user ? JSON.parse(user) : null
  };
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const getUserRole = () => {
  const { user } = getAuth();
  return user?.role || null;
};

