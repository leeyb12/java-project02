import { useEffect, useRef } from 'react';

const sizeMap = {
    sm: '400px',
    md: '560px',
    lg: '720px',
    xl: '960px',
};

export default function Modal({
    isOpen,
    onClose,
    title,
    size = 'md',
    closeOnBackdrop = true,
    closeOnEsc = true,
    footer,
    children,
}) {
    const dialogRef = useRef(null);

    /* ESC 키 핸들러 */
    useEffect(() => {
        if (!closeOnEsc) return;
        const handler = e => {
            if (e.key === 'Escape' && isOpen) onClose?.();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose, closeOnEsc]);

    /* 모달 열릴 때 스크롤 잠금 */
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const backdropStyle = {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 'var(--space-md)',
        animation: 'modal-fade-in 200ms ease',
    };

    const dialogStyle = {
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: sizeMap[size],
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'modal-slide-in 250ms ease',
    };

    return (
        <>
            <style>{`
        @keyframes modal-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modal-slide-in {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

            {/* 백드롭 */}
            <div
                style={backdropStyle}
                onClick={closeOnBackdrop ? e => {
                    if (e.target === e.currentTarget) onClose?.();
                } : undefined}
            >
                {/* 다이얼로그 */}
                <div ref={dialogRef} role="dialog" aria-modal="true" style={dialogStyle}>
                    {/* 헤더 */}
                    {(title || onClose) && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 'var(--space-lg)',
                                borderBottom: '1px solid var(--color-border)',
                                flexShrink: 0,
                            }}
                        >
                            {title && (
                                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', margin: 0 }}>
                                    {title}
                                </h3>
                            )}
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    aria-label="모달 닫기"
                                    style={{
                                        background: 'none',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text-muted)',
                                        borderRadius: 'var(--radius-sm)',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all var(--transition-fast)',
                                        fontSize: '18px',
                                        lineHeight: 1,
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.color = 'var(--color-text-primary)';
                                        e.currentTarget.style.borderColor = 'var(--color-text-muted)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.color = 'var(--color-text-muted)';
                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    )}

                    {/* 콘텐츠 */}
                    <div
                        style={{
                            padding: 'var(--space-lg)',
                            overflowY: 'auto',
                            flex: 1,
                        }}
                    >
                        {children}
                    </div>

                    {/* 푸터 */}
                    {footer && (
                        <div
                            style={{
                                padding: 'var(--space-md) var(--space-lg)',
                                borderTop: '1px solid var(--color-border)',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 'var(--space-sm)',
                                flexShrink: 0,
                            }}
                        >
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}