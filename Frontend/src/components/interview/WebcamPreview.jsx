import { useEffect, useRef } from 'react';

export default function WebcamPreview({
    stream,
    mirrored = true,
    muted = true,
    aspectRatio = '16 / 9',
    overlay,
    showNoStreamPlaceholder = true,
    style,
    ...rest
}) {
    const videoRef = useRef(null);

    /* 스트림 변경 시 video 엘리먼트에 연결 */
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (stream) {
            video.srcObject = stream;
            video.play().catch(() => {
                /* 자동 재생 정책으로 인한 오류 무시 */
            });
        } else {
            video.srcObject = null;
        }

        return () => {
            video.srcObject = null;
        };
    }, [stream]);

    const wrapperStyle = {
        position: 'relative',
        width: '100%',
        aspectRatio,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: 'var(--color-bg-secondary)',
        ...style,
    };

    const videoStyle = {
        width: '100%',
        height: '100%',
        transform: mirrored ? 'scaleX(-1)' : 'none',
        display: stream ? 'block' : 'none',
    };

    return (
        <div style={wrapperStyle} {...rest}>
            {/* 비디오 엘리먼트 */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={muted}
                style={videoStyle}
                aria-label="웹캠 미리보기"
            />

            {/* 스트림 없을 때 플레이스홀더 */}
            {!stream && showNoStreamPlaceholder && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--space-sm)',
                        color: 'var(--color-text-muted)',
                    }}
                >
                    {/* 카메라 아이콘 */}
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="48" height="48" rx="24" fill="rgba(255,255,255,0.04)" />
                        <path
                            d="M14 18a2 2 0 0 1 2-2h3l2-3h6l2 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V18z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                        />
                        <circle cx="24" cy="25" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    <span style={{ fontSize: '14px' }}>카메라를 연결 중...</span>
                </div>
            )}

            {/* 오버레이 (녹화 표시, 타이머 등) */}
            {overlay && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                    }}
                >
                    {overlay}
                </div>
            )}
        </div>
    );
}