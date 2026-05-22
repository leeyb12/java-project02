import { forwardRef } from 'react';


const sizeStyles = {
    sm: { padding: '6px 14px', fontSize: '13px', gap: '6px', borderRadius: '8px' },
    md: { padding: '10px 22px', fontSize: '15px', gap: '8px', borderRadius: '10px' },
    lg: { padding: '14px 32px', fontSize: '17px', gap: '10px', borderRadius: '12px' },
};

const variantStyles = {
    primary: {
        background: 'var(--color-accent-primary)',
        color: '#fff',
        border: '1px solid transparent',
        boxShadow: 'var(--shadow-accent)',
    },
    secondary: {
        background: 'var(--color-bg-card)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border)',
    },
    ghost: {
        background: 'transparent',
        color: 'var(--color-text-secondary)',
        border: '1px solid transparent',
    },
    danger: {
        background: 'rgba(239, 68, 68, 0.12)',
        color: 'var(--color-accent-danger)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
    },
};

const Spinner = () => (
    <svg
        width="16"
        height="16"
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
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" />
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
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
        letterSpacing: '0.01em',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'all var(--transition-fast)',
        userSelect: 'none',
        whiteSpace: 'nowrap',
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
                if (!isDisabled) e.currentTarget.style.filter = 'brightness(1.12)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.filter = '';
            }}
            onMouseDown={e => {
                if (!isDisabled) e.currentTarget.style.transform = 'scale(0.97)';
            }}
            onMouseUp={e => {
                e.currentTarget.style.transform = '';
            }}
            {...rest}
        >
            {loading ? <Spinner /> : leftIcon}
            {children}
            {!loading && rightIcon}
        </button>
    );
});

export default Button;