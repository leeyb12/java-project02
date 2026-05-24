import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
    timeout: 30_000,
    headers: {
        Accept: 'application/json',
    },
});

/* ─── 요청 인터셉터 ─── */
api.interceptors.request.use(
    config => {
        /* 로컬 스토리지에서 액세스 토큰을 읽어 헤더에 추가 */
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        /* multipart/form-data는 브라우저가 boundary를 설정하도록 Content-Type을 제거 */
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    error => Promise.reject(error)
);

/* ─── 응답 인터셉터 ─── */
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        /* 401 Unauthorized: 토큰 갱신 시도 */
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) throw new Error('리프레시 토큰 없음');

                const { data } = await axios.post(
                    `${api.defaults.baseURL}/auth/refresh`,
                    { refresh_token: refreshToken }
                );

                localStorage.setItem('access_token', data.access_token);
                originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                return api(originalRequest);
            } catch {
                /* 토큰 갱신 실패 시 로그아웃 처리 */
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/dashboard';
            }
        }

        /* 공통 에러 로깅 (개발 환경에서만) */
        if (import.meta.env.DEV) {
            console.error(
                `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
                error.response?.status,
                error.response?.data
            );
        }

        return Promise.reject(error);
    }
);

export default api;