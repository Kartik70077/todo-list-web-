/**
 * TaskFlow Pro - API Client
 */

const API = (function () {
  const TOKEN_KEY = 'taskflow_auth_token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  async function request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint}`;
    const token = getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          setToken(null);
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        const error = new Error(data.error || `HTTP Error ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  return {
    getToken,
    setToken,
    get: (endpoint, params = null) => {
      let url = endpoint;
      if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            searchParams.append(k, v);
          }
        });
        const query = searchParams.toString();
        if (query) url += `?${query}`;
      }
      return request(url, { method: 'GET' });
    },
    post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
    put: (endpoint, body) => request(endpoint, { method: 'PUT', body }),
    patch: (endpoint, body = {}) => request(endpoint, { method: 'PATCH', body }),
    delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  };
})();
