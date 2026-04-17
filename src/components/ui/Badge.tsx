interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray'
  children: React.ReactNode
}

const variantClass = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
}

export function Badge({ variant = 'info', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantClass[variant]}`}>
      {children}
    </span>
  )
}
