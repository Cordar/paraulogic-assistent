interface ButtonProps {
    fun: () => void;
    children: React.ReactNode;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
    type?: 'button' | 'submit';
    className?: string;
}

export default function Button({
    fun,
    children,
    disabled = false,
    variant = 'primary',
    type = 'button',
    className = ''
}: ButtonProps) {
    const baseClasses = "px-3 py-2 rounded-md transition-colors";
    const variantClasses = {
        primary: disabled 
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
            : 'bg-green-200 hover:bg-green-300',
        secondary: disabled 
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-200 hover:bg-blue-300',
        danger: disabled 
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
            : 'bg-red-200 hover:bg-red-300'
    };
    
    return (
        <button 
            type={type}
            onClick={fun} 
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        >
            {children}
        </button>
    );
}