import axios, { AxiosError, AxiosRequestConfig } from 'axios';

// API Base URL - supports both env variable names for compatibility
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Retry configuration for Render free-tier cold starts
const RETRY_CONFIG = {
    maxRetries: 3,
    initialDelayMs: 2000,  // 2 seconds initial delay
    maxDelayMs: 10000,     // 10 seconds max delay
    backoffMultiplier: 2,
};

// Cold-start wake-up flag
let isBackendAwake = false;
let wakeUpPromise: Promise<void> | null = null;

const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,  // 60 second timeout for cold starts
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Wake up the backend if it's sleeping (Render free tier cold start)
 * Uses the lightweight /health endpoint
 */
async function wakeUpBackend(): Promise<void> {
    if (isBackendAwake) return;
    
    // Deduplicate wake-up calls
    if (wakeUpPromise) return wakeUpPromise;
    
    wakeUpPromise = (async () => {
        console.log('🔄 Waking up backend (cold start)...');
        const maxAttempts = 5;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await axios.get(`${API_BASE_URL}/health`, { timeout: 30000 });
                isBackendAwake = true;
                console.log('✅ Backend is awake and ready!');
                return;
            } catch (err) {
                console.log(`⏳ Wake-up attempt ${attempt}/${maxAttempts}...`);
                if (attempt < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        }
        console.warn('⚠️ Backend may still be starting, proceeding with request...');
    })();
    
    await wakeUpPromise;
    wakeUpPromise = null;
}

/**
 * Delay helper with exponential backoff
 */
function getRetryDelay(retryCount: number): number {
    const delay = RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount);
    return Math.min(delay, RETRY_CONFIG.maxDelayMs);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: AxiosError): boolean {
    // Retry on network errors (cold start, timeout)
    if (!error.response) return true;
    
    // Retry on 5xx server errors
    const status = error.response.status;
    return status >= 500 && status < 600;
}

// Request interceptor - wake up backend before requests
client.interceptors.request.use(
    async (config) => {
        // Try to wake up backend on first request
        if (!isBackendAwake) {
            await wakeUpBackend();
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor with retry logic
client.interceptors.response.use(
    (response) => {
        isBackendAwake = true;  // Mark backend as awake on success
        return response;
    },
    async (error: AxiosError) => {
        const config = error.config as AxiosRequestConfig & { _retryCount?: number };
        
        // Initialize retry count
        if (!config._retryCount) {
            config._retryCount = 0;
        }
        
        // Retry logic for retryable errors
        if (isRetryableError(error) && config._retryCount < RETRY_CONFIG.maxRetries) {
            config._retryCount++;
            const delay = getRetryDelay(config._retryCount - 1);
            
            console.log(`🔄 Retry ${config._retryCount}/${RETRY_CONFIG.maxRetries} after ${delay}ms - ${config.url}`);
            
            // Mark backend as not awake to trigger wake-up on retry
            if (!error.response) {
                isBackendAwake = false;
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return client.request(config);
        }
        
        // Build user-friendly error message
        let customError = {
            ...error,
            message: 'An unexpected error occurred.',
            type: 'UNKNOWN',
            details: error.message,
            isRetryExhausted: config._retryCount >= RETRY_CONFIG.maxRetries
        };

        if (!error.response) {
            // Network error - could be cold start timeout
            customError.message = 'Server is starting up. Please wait a moment and try again.';
            customError.type = 'NETWORK_ERROR';
        } else {
            const status = error.response.status;
            (customError as any).status = status;

            if (status >= 500) {
                customError.message = 'Server encountered an error. Please try again in a moment.';
                customError.type = 'SERVER_ERROR';
            } else if (status === 404) {
                customError.message = 'The requested resource was not found.';
                customError.type = 'NOT_FOUND';
            } else if (status === 401 || status === 403) {
                customError.message = 'Access denied. Please login again.';
                customError.type = 'AUTH_ERROR';
            } else if (status >= 400) {
                customError.message = (error.response.data as any)?.detail || 'Invalid request.';
                customError.type = 'CLIENT_ERROR';
            }
        }

        console.error('API Error:', customError);
        return Promise.reject(customError);
    }
);

// Export wake-up function for manual use
export const ensureBackendAwake = wakeUpBackend;
export default client;
