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
                track.addEventListener('ended', () => {
                    setStatus('idle');
                    setStream(null);
                });
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
        navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
        };
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