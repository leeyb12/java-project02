import { useEffect, useRef, useCallback } from 'react';

export default function AudioVisualizer({
    stream,
    barCount = 32,
    height = 64,
    color = '#4f6ef7',
    activeColor = '#7c3aed',
    smoothing = 0.8,
    active = true,
    style,
}) {
    const canvasRef = useRef(null);
    const animFrameRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const audioCtxRef = useRef(null);

    /* 오디오 컨텍스트 및 분석기 설정 */
    const setupAudio = useCallback(() => {
        if (!stream) return;

        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = barCount * 4;
            analyser.smoothingTimeConstant = smoothing;

            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);

            audioCtxRef.current = ctx;
            analyserRef.current = analyser;
            sourceRef.current = source;
        } catch (err) {
            console.warn('[AudioVisualizer] 오디오 컨텍스트 생성 실패:', err);
        }
    }, [stream, barCount, smoothing]);

    /* 오디오 정리 */
    const teardownAudio = useCallback(() => {
        cancelAnimationFrame(animFrameRef.current);
        sourceRef.current?.disconnect();
        audioCtxRef.current?.close().catch(() => { });
        analyserRef.current = null;
        sourceRef.current = null;
        audioCtxRef.current = null;
    }, []);

    /* 스트림 변경 시 재설정 */
    useEffect(() => {
        teardownAudio();
        if (stream && active) setupAudio();
        return teardownAudio;
    }, [stream, active, setupAudio, teardownAudio]);

    /* 캔버스 렌더 루프 */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const draw = () => {
            animFrameRef.current = requestAnimationFrame(draw);

            const w = canvas.width / dpr;
            const h = canvas.height / dpr;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            /* 분석기가 없을 때 정적 기본 바 렌더 */
            if (!analyserRef.current || !active) {
                const gap = 3;
                const barW = (w - gap * (barCount - 1)) / barCount;
                for (let i = 0; i < barCount; i++) {
                    const x = i * (barW + gap) * dpr;
                    const barH = (h * 0.15) * dpr;
                    const y = (h - barH / dpr) * dpr;
                    ctx.fillStyle = 'rgba(79, 110, 247, 0.2)';
                    ctx.beginPath();
                    ctx.roundRect(x, y, barW * dpr, barH, 2);
                    ctx.fill();
                }
                return;
            }

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserRef.current.getByteFrequencyData(dataArray);

            const gap = 3;
            const barW = (w - gap * (barCount - 1)) / barCount;
            const step = Math.floor(bufferLength / barCount);

            for (let i = 0; i < barCount; i++) {
                const value = dataArray[i * step] / 255;
                const barH = Math.max(value * h * 0.95, h * 0.06);

                const x = i * (barW + gap) * dpr;
                const y = (h - barH) * dpr;

                /* 볼륨에 따라 색상 혼합 */
                const blendedColor = value > 0.6 ? activeColor : color;
                const alpha = 0.4 + value * 0.6;

                ctx.fillStyle = blendedColor + Math.round(alpha * 255).toString(16).padStart(2, '0');
                ctx.beginPath();
                ctx.roundRect(x, y, barW * dpr, barH * dpr, 3);
                ctx.fill();
            }
        };

        /* 캔버스 DPR 보정 크기 설정 */
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width } = entry.contentRect;
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                ctx.scale(dpr, dpr);
            }
        });
        resizeObserver.observe(canvas.parentElement || canvas);

        draw();

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            resizeObserver.disconnect();
        };
    }, [barCount, height, color, activeColor, active]);

    return (
        <div
            style={{
                width: '100%',
                height: `${height}px`,
                position: 'relative',
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                }}
                aria-label="오디오 시각화"
                role="img"
            />
        </div>
    );
}