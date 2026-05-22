import { forwardRef } from 'react';

// 사이즈별 스타일 정의
const sizeStyles = {
    sm: { padding: '8px 16px', fontSize: '13px', gap: '6px', borderRadius: '8px' },
    md: { padding: '12px 24px', fontSize: '15px', gap: '8px', borderRadius: '10px' },
    lg: { padding: '16px 36px', fontSize: '16px', gap: '10px', borderRadius: '12px', fontWeight: '700' },
};

// 타입별 스타일 정의 (그라디언트 및 유리 질감 적용)
const variantStyles = {
    primary: {
        background: 'linear-gradient(135deg, #4361ee 0%, #2b45cc 100%)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)',
        fontWeight: '700',
    },
    secondary: {
        background: 'rgba(255, 255, 255, 0.12)',
        color: 'var(--color-text-primary, #ffffff)', // 테마 변수 활용
        border: '1px solid var(--color-border)',
        backdropFilter: 'blur(10px)',
        fontWeight: '600',
    },
    // ghost, danger는 기존 유지
    ghost: {
        background: 'transparent',
        color: 'var(--color-text-secondary, #94a3b8)',
        border: '1px solid transparent',
    },
    danger: {
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.15) 100%)',
        color: '#ff8a8a', // 붉은색 글자를 조금 더 밝게 조정
        border: '1px solid rgba(239, 68, 68, 0.4)',
    },
};

// 로딩 스피너 컴포넌트
const Spinner = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 16 16"
        fill="none"
        style={{ animation: 'btn-spin 0.8s linear infinite' }}
    >
        <style>{`
            @keyframes btn-spin {
                from { transform: rotate(0deg); }
                to   { transform: rotate(360deg); }
            }
        `}</style>
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" opacity="0.3" />
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2.5" strokeDasharray="28" strokeDashoffset="20" strokeLinecap="round" />
    </svg>
);

const Button = forwardRef(function Button(
    {
        children,
        variant = 'primary',
        size = 'md',
        loading = false,
        disabled = false,
        leftIcon,
        rightIcon,
        type = 'button',
        style,
        onClick,
        ...rest
    },
    ref
) {
    const isDisabled = disabled || loading;

    const baseStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'inherit',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        outline: 'none',
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
    };

    return (
        <button
            ref={ref}
            type={type}
            disabled={isDisabled}
            onClick={!isDisabled ? onClick : undefined}
            style={baseStyle}
            onMouseEnter={e => {
                if (!isDisabled) {
                    e.currentTarget.style.filter = 'brightness(1.15)';
                    e.currentTarget.style.boxShadow = variant === 'primary' 
                        ? '0 6px 20px rgba(79, 110, 247, 0.45)' 
                        : '0 4px 12px rgba(255, 255, 255, 0.1)';
                }
            }}
            onMouseLeave={e => {
                if (!isDisabled) {
                    e.currentTarget.style.filter = '';
                    e.currentTarget.style.boxShadow = variantStyles[variant].boxShadow || '';
                }
            }}
            onMouseDown={e => {
                if (!isDisabled) e.currentTarget.style.transform = 'scale(0.96)';
            }}
            onMouseUp={e => {
                if (!isDisabled) e.currentTarget.style.transform = 'scale(1)';
            }}
            {...rest}
        >
            {loading ? <Spinner /> : leftIcon}
            <span style={{ marginLeft: loading || leftIcon ? '8px' : 0 }}>{children}</span>
            {!loading && rightIcon && <span style={{ marginLeft: '8px' }}>{rightIcon}</span>}
        </button>
    );
});

export default Button;