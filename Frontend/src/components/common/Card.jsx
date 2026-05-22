const variantStyles = {
    default: {
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
    },
    elevated: {
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
    },
    outlined: {
        background: 'transparent',
        border: '1px solid var(--color-border)',
        boxShadow: 'none',
    },
    glass: {
        background: 'rgba(22, 22, 31, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(16px)',
        boxShadow: 'var(--shadow-md)',
    },
};

export default function Card({
    children,
    variant = 'default',
    hoverable = false,
    clickable = false,
    padding = 'var(--space-lg)',
    header,
    footer,
    style,
    onClick,
    ...rest
}) {
    const baseStyle = {
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        transition: 'all var(--transition-base)',
        cursor: clickable || onClick ? 'pointer' : 'default',
        ...variantStyles[variant],
        ...style,
    };

    const handleMouseEnter = e => {
        if (hoverable || onClick) {
            e.currentTarget.style.borderColor = 'rgba(79, 110, 247, 0.4)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        }
    };

    const handleMouseLeave = e => {
        if (hoverable || onClick) {
            e.currentTarget.style.borderColor = '';
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = variantStyles[variant].boxShadow || '';
        }
    };

    return (
        <div
            style={baseStyle}
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...rest}
        >
            {/* 헤더 영역 */}
            {header && (
                <div
                    style={{
                        padding,
                        borderBottom: '1px solid var(--color-border)',
                    }}
                >
                    {header}
                </div>
            )}

            {/* 메인 콘텐츠 영역 */}
            <div style={{ padding }}>{children}</div>

            {/* 푸터 영역 */}
            {footer && (
                <div
                    style={{
                        padding,
                        borderTop: '1px solid var(--color-border)',
                    }}
                >
                    {footer}
                </div>
            )}
        </div>
    );
}