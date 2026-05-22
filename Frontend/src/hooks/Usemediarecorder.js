import { useState, useRef, useCallback, useEffect } from 'react';

export function useMediaRecorder(
    stream,
    options = {}
) {
    const [status, setStatus] = useState('idle');
    const [duration, setDuration] = useState(0);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [recordedUrl, setRecordedUrl] = useState(null);
    const [error, setError] = useState(null);

    const recorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const resolveRef = useRef(null);
    const urlRef = useRef(null);

    /* 지원 MIME 타입 자동 선택 */
    const getMimeType = useCallback(() => {
        const candidates = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4',
        ];
        return candidates.find(type => MediaRecorder.isTypeSupported(type)) || '';
    }, []);

    /* 타이머 시작 */
    const startTimer = useCallback(() => {
        timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
    }, []);

    /* 타이머 중지 */
    const stopTimer = useCallback(() => {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }, []);

    /* 이전 Object URL 해제 */
    const revokeUrl = useCallback(() => {
        if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current);
            urlRef.current = null;
        }
    }, []);

    /* 녹화 시작 */
    const start = useCallback(() => {
        if (!stream) {
            setError(new Error('스트림이 없습니다. 카메라/마이크를 먼저 연결하세요.'));
            return;
        }

        try {
            chunksRef.current = [];
            setDuration(0);
            revokeUrl();
            setRecordedBlob(null);
            setRecordedUrl(null);
            setError(null);

            const mimeType = options.mimeType ?? getMimeType();
            const recorder = new MediaRecorder(stream, { ...options, mimeType });

            recorder.ondataavailable = e => {
                if (e.data && e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: recorder.mimeType || 'video/webm',
                });
                const url = URL.createObjectURL(blob);
                urlRef.current = url;

                setRecordedBlob(blob);
                setRecordedUrl(url);
                setStatus('stopped');
                stopTimer();

                /* stop() Promise 해결 */
                resolveRef.current?.(blob);
                resolveRef.current = null;
            };

            recorder.onerror = e => {
                setError(e.error || new Error('녹화 오류가 발생했습니다.'));
                setStatus('error');
                stopTimer();
            };

            recorder.start(250); /* 250ms 청크 간격으로 데이터 수집 */
            recorderRef.current = recorder;

            setStatus('recording');
            startTimer();
        } catch (err) {
            setError(err);
            setStatus('error');
            console.error('[useMediaRecorder] 녹화 시작 실패:', err);
        }
    }, [stream, options, getMimeType, startTimer, stopTimer, revokeUrl]);

    /* 녹화 중지 - Blob을 Promise로 반환 */
    const stop = useCallback(() => {
        return new Promise((resolve) => {
            const recorder = recorderRef.current;
            if (!recorder || recorder.state === 'inactive') {
                resolve(recordedBlob);
                return;
            }
            resolveRef.current = resolve;
            recorder.stop();
        });
    }, [recordedBlob]);

    /* 일시정지 */
    const pause = useCallback(() => {
        const recorder = recorderRef.current;
        if (recorder?.state === 'recording') {
            recorder.pause();
            stopTimer();
            setStatus('paused');
        }
    }, [stopTimer]);

    /* 재개 */
    const resume = useCallback(() => {
        const recorder = recorderRef.current;
        if (recorder?.state === 'paused') {
            recorder.resume();
            startTimer();
            setStatus('recording');
        }
    }, [startTimer]);

    /* 초기화 */
    const reset = useCallback(() => {
        recorderRef.current?.stop();
        recorderRef.current = null;
        chunksRef.current = [];
        stopTimer();
        revokeUrl();
        setStatus('idle');
        setDuration(0);
        setRecordedBlob(null);
        setRecordedUrl(null);
        setError(null);
    }, [stopTimer, revokeUrl]);

    /* 언마운트 시 정리 */
    useEffect(() => {
        return () => {
            recorderRef.current?.stop();
            stopTimer();
            revokeUrl();
        };
    }, [stopTimer, revokeUrl]);

    return {
        status,
        duration,
        recordedBlob,
        recordedUrl,
        error,
        start,
        stop,
        pause,
        resume,
        reset,
    };
}