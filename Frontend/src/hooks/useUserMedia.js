import { useState, useEffect, useCallback, useRef } from 'react';

export function useUserMedia(
    constraints = { video: true, audio: true }
) {
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('idle'); // 'idle' | 'pending' | 'active' | 'denied' | 'error'
    const [devices, setDevices] = useState({ cameras: [], microphones: [] });

    const streamRef = useRef(null);
    const constraintsRef = useRef(constraints);

    /* constraints가 바뀌면 ref 업데이트 */
    useEffect(() => {
        constraintsRef.current = constraints;
    }, [constraints]);

    /* 연결된 기기 목록 조회 */
    const enumerateDevices = useCallback(async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                console.warn('[useUserMedia] MediaDevices.enumerateDevices() 지원하지 않음');
                setDevices({ cameras: [], microphones: [] });
                return;
            }

            const deviceList = await navigator.mediaDevices.enumerateDevices();
            setDevices({
                cameras: deviceList.filter(d => d.kind === 'videoinput'),
                microphones: deviceList.filter(d => d.kind === 'audioinput'),
            });
        } catch (err) {
            console.warn('[useUserMedia] 기기 목록 조회 실패:', err);
        }
    }, []);

    /* 스트림 중지 및 트랙 해제 */
    const stopStream = useCallback((targetStream) => {
        if (targetStream) {
            targetStream.getTracks().forEach(track => track.stop());
        }
    }, []);

    /* 미디어 스트림 획득 */
    const start = useCallback(async (overrideConstraints) => {
        setStatus('pending');
        setError(null);

        const activeConstraints = overrideConstraints ?? constraintsRef.current;

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                const err = new Error('MediaDevices.getUserMedia is not available in this environment');
                setError(err);
                setStatus('error');
                console.error('[useUserMedia] getUserMedia 미지원');
                return;
            }

            // 보안 컨텍스트(HTTPS) 확인 — 모바일/원격 접속 시 반드시 필요
            if (typeof window !== 'undefined' && !window.isSecureContext) {
                const err = new Error('Insecure context: getUserMedia requires HTTPS or localhost');
                setError(err);
                setStatus('error');
                console.error('[useUserMedia] 보안 컨텍스트가 아님 (HTTPS 필요)');
                return;
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia(activeConstraints);

            /* 이전 스트림 정리 */
            stopStream(streamRef.current);

            streamRef.current = mediaStream;
            setStream(mediaStream);
            setStatus('active');

            /* 기기 목록 갱신 (권한 획득 후 레이블이 채워짐) */
            await enumerateDevices();

            /* 트랙 종료 이벤트 감지 (시스템에서 강제 종료되는 경우) */
            mediaStream.getTracks().forEach(track => {
                if (track && typeof track.addEventListener === 'function') {
                    track.addEventListener('ended', () => {
                        setStatus('idle');
                        setStream(null);
                    });
                }
            });
        } catch (err) {
            const isDenied =
                err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';

            setError(err);
            setStatus(isDenied ? 'denied' : 'error');
            console.error('[useUserMedia] 스트림 획득 실패:', err.name, err.message);
        }
    }, [enumerateDevices, stopStream]);

    /* 스트림 중지 */
    const stop = useCallback(() => {
        stopStream(streamRef.current);
        streamRef.current = null;
        setStream(null);
        setStatus('idle');
        setError(null);
    }, [stopStream]);

    /* 카메라 전환 */
    const switchCamera = useCallback(async (deviceId) => {
        const current = constraintsRef.current;
        await start({
            ...current,
            video: { ...(typeof current.video === 'object' ? current.video : {}), deviceId: { exact: deviceId } },
        });
    }, [start]);

    /* 마이크 전환 */
    const switchMicrophone = useCallback(async (deviceId) => {
        const current = constraintsRef.current;
        await start({
            ...current,
            audio: { ...(typeof current.audio === 'object' ? current.audio : {}), deviceId: { exact: deviceId } },
        });
    }, [start]);

    /* 초기 기기 목록 조회 */
    useEffect(() => {
        enumerateDevices();

        /* 기기 연결/해제 감지 */
        if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === 'function') {
            navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
            return () => {
                navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
            };
        }
        return undefined;
    }, [enumerateDevices]);

    /* 언마운트 시 스트림 정리 */
    useEffect(() => {
        return () => {
            stopStream(streamRef.current);
        };
    }, [stopStream]);

    return {
        stream,
        error,
        status,
        devices,
        start,
        stop,
        switchCamera,
        switchMicrophone,
    };
}