'use client'

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancel·lar',
    onConfirm,
    onCancel,
    variant = 'warning'
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const getVariantStyles = () => {
        switch (variant) {
            case 'danger':
                return {
                    confirmButton: 'bg-red-500 hover:bg-red-600 text-white',
                    icon: '⚠️'
                };
            case 'warning':
                return {
                    confirmButton: 'bg-yellow-500 hover:bg-yellow-600 text-white',
                    icon: '⚠️'
                };
            case 'info':
                return {
                    confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white',
                    icon: 'ℹ️'
                };
            default:
                return {
                    confirmButton: 'bg-yellow-500 hover:bg-yellow-600 text-white',
                    icon: '⚠️'
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <div className="flex items-center mb-4">
                    <span className="text-2xl mr-3">{styles.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                </div>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                    {message}
                </p>
                
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${styles.confirmButton}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}