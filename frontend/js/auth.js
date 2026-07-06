// Authentication helper
window.Auth = {
  login: async function(email, password) {
    try {
      const data = await window.apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data.token) {
        localStorage.setItem('pg_token', data.token);
        localStorage.setItem('pg_user', JSON.stringify(data.user));
        return data;
      }
      throw new Error('Invalid login response');
    } catch (error) {
      throw error;
    }
  },

  logout: function() {
    localStorage.removeItem('pg_token');
    localStorage.removeItem('pg_user');
    window.location.href = '/login.html';
  },

  getCurrentUser: function() {
    const userStr = localStorage.getItem('pg_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: function() {
    return localStorage.getItem('pg_token') !== null;
  },

  checkSession: function() {
    if (!this.isAuthenticated()) {
      if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = '/login.html';
      }
    } else {
      if (window.location.pathname.endsWith('login.html')) {
        window.location.href = '/management-dashboard.html';
      }
    }
  }
};
