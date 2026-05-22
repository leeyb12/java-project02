import api from './api.js';

/**
 * interviewService
 * 면접 관련 API 호출을 추상화합니다.
 * - 질문 목록 호출
 * - 녹화 영상 파일(Blob) 업로드
 * - 세션 관리
 */

/* ─── 면접 세션 ─── */

/**
 * 새 면접 세션을 생성합니다.
 * @param {{ category?: string, difficulty?: string, questionCount?: number }} params
 * @returns {Promise<{ sessionId: string, startedAt: string }>}
 */
export async function createSession(params = {}) {
    const { data } = await api.post('/interviews/sessions', params);
    return data;
}

/**
 * 세션 정보를 조회합니다.
 * @param {string} sessionId
 */
export async function getSession(sessionId) {
    const { data } = await api.get(`/interviews/sessions/${sessionId}`);
    return data;
}

/**
 * 세션을 종료 처리합니다.
 * @param {string} sessionId
 */
export async function endSession(sessionId) {
    const { data } = await api.patch(`/interviews/sessions/${sessionId}/end`);
    return data;
}

/* ─── 질문 ─── */

/**
 * 세션의 질문 목록을 가져옵니다.
 * @param {string} sessionId
 * @returns {Promise<Array<{ id: string, text: string, category: string, timeLimit: number }>>}
 */
export async function fetchQuestions(sessionId) {
    const { data } = await api.get(`/interviews/sessions/${sessionId}/questions`);
    return data;
}

/**
 * 단일 질문을 조회합니다.
 * @param {string} questionId
 */
export async function fetchQuestion(questionId) {
    const { data } = await api.get(`/interviews/questions/${questionId}`);
    return data;
}

/* ─── 답변 영상 업로드 ─── */

/**
 * 녹화된 비디오 Blob을 서버에 전송합니다.
 * multipart/form-data로 업로드하며, 진행률 콜백을 지원합니다.
 *
 * @param {string} sessionId - 면접 세션 ID
 * @param {string} questionId - 답변한 질문 ID
 * @param {Blob} videoBlob - 녹화된 비디오 Blob
 * @param {{ onUploadProgress?: (percent: number) => void }} options
 * @returns {Promise<{ answerId: string, uploadedAt: string }>}
 */
export async function submitAnswer(sessionId, questionId, videoBlob, options = {}) {
    const formData = new FormData();
    formData.append('video', videoBlob, `answer_${questionId}.webm`);
    formData.append('sessionId', sessionId);
    formData.append('questionId', questionId);

    const { data } = await api.post(
        `/interviews/sessions/${sessionId}/answers`,
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: event => {
                if (options.onUploadProgress && event.total) {
                    const percent = Math.round((event.loaded * 100) / event.total);
                    options.onUploadProgress(percent);
                }
            },
        }
    );

    return data;
}

/* ─── 피드백 ─── */

/**
 * 세션 피드백 리포트를 가져옵니다.
 * @param {string} sessionId
 * @returns {Promise<{
 *   sessionId: string,
 *   overallScore: number,
 *   answers: Array<{
 *     questionId: string,
 *     questionText: string,
 *     score: number,
 *     feedback: string,
 *     keywords: string[],
 *     videoUrl: string,
 *   }>
 * }>}
 */
export async function fetchFeedback(sessionId) {
    const { data } = await api.get(`/interviews/sessions/${sessionId}/feedback`);
    return data;
}

/* ─── 기기 테스트 ─── */

/**
 * 기기 테스트용 더미 비디오를 서버에 전송해 연결을 확인합니다.
 * @param {Blob} testBlob
 * @returns {Promise<{ ok: boolean, latencyMs: number }>}
 */
export async function testDeviceUpload(testBlob) {
    const formData = new FormData();
    formData.append('test_video', testBlob, 'device_test.webm');

    const { data } = await api.post('/interviews/device-test', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 10_000,
    });

    return data;
}