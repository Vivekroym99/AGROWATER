import { cn } from '@/lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  hoverable?: boolean;
}

export function Card({ className, title, hoverable, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm',
        hoverable && 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-shadow cursor-pointer',
        className
      )}
      {...props}
    >
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-4 py-3 border-b border-gray-200 dark:border-gray-700', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg', className)} {...props}>
      {children}
    </div>
  );
}
