// API helper for fetch requests
const API_URL = '/api/v1';

window.apiRequest = async function(endpoint, options = {}) {
  const token = localStorage.getItem('pg_token');
  const headers = {
    ...options.headers,
  };
  
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  } else if (!options.body) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (response.status === 401) {
      if (endpoint === '/auth/login') {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || 'Invalid email or password');
      }
      // Clear session if invalid or unauthorized
      localStorage.removeItem('pg_token');
      localStorage.removeItem('pg_user');
      if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = '/login.html';
      }
      throw new Error('Session expired or unauthorized');
    }
    
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Request to ${endpoint} failed:`, error);
    throw error;
  }
};
