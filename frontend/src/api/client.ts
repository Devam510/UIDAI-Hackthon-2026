import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for global error handling
client.interceptors.response.use(
    (response) => response,
    (error) => {
        let customError = {
            ...error,
            message: 'An unexpected error occurred.',
            type: 'UNKNOWN',
            details: error.message
        };

        if (!error.response) {
            // Network error
            customError.message = 'Unable to reach the server. Please check your internet connection.';
            customError.type = 'NETWORK_ERROR';
        } else {
            const status = error.response.status;
            customError.status = status;

            if (status >= 500) {
                customError.message = 'Server encountered an error. Please try again later.';
                customError.type = 'SERVER_ERROR';
            } else if (status === 404) {
                customError.message = 'The requested resource was not found.';
                customError.type = 'NOT_FOUND';
            } else if (status === 401 || status === 403) {
                customError.message = 'Access denied. Please login again.';
                customError.type = 'AUTH_ERROR';
            } else if (status >= 400) {
                customError.message = error.response.data?.detail || 'Invalid request.';
                customError.type = 'CLIENT_ERROR';
            }
        }

        console.error('API Error:', customError);
        return Promise.reject(customError);
    }
);

export default client;
