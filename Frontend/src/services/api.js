import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  // 💡 로컬 AI 속도를 감안하여 타임아웃을 5분(300초)으로 확실하게 늘립니다.
  timeout: 300000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ─── 통합 응답 인터셉터 (하나로 합치기) ─── */
api.interceptors.response.use(
  (response) => {
    // 백엔드가 보낸 데이터가 없으면 리스폰스 객체 그대로 반환
    if (!response.data) return response;

    // 특정 success 포맷이 실패로 명시된 경우만 거름
    if (response.data.hasOwnProperty("success") && !response.data.success) {
      return Promise.reject({
        message: response.data.message || "알 수 없는 오류가 발생했습니다.",
      });
    }

    // ⭐ 중요: interviewService.js 등에서 { data } = await api.post() 구조 분해 할당을 쓰고 있으므로,
    // 여기서 response.data를 반환하는 대신 response 객체 자체를 리턴해야 프론트 코드가 깨지지 않습니다.
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 타임아웃 에러 핸들링 로그 출력
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      console.warn("[타임아웃 발생] AI 분석 시간이 5분을 초과했습니다.");
    }

    /* 401 Unauthorized: 토큰 갱신 시도 */
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("리프레시 토큰 없음");

        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refresh_token: refreshToken },
        );

        localStorage.setItem("access_token", data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch {
        /* 토큰 갱신 실패 시 로그아웃 처리 */
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/dashboard";
      }
    }

    /* 공통 에러 로깅 (개발 환경에서만) */
    if (import.meta.env.DEV) {
      console.error(
        `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        error.response?.status || "No Status",
        error.response?.data || error.message,
      );
    }

    return Promise.reject(error);
  },
);

export default api;
