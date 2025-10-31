import { LucideIcon } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Icon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">{description}</p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex gap-3 justify-center">
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface EmptyListProps {
  icon: LucideIcon;
  title: string;
  description: string;
  searchTerm?: string;
}

export function EmptyList({
  icon: Icon,
  title,
  description,
  searchTerm,
}: EmptyListProps) {
  return (
    <div className="text-center py-12 px-4">
      <Icon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-sm font-medium text-gray-900">
        {searchTerm ? `No results for "${searchTerm}"` : title}
      </h3>
      <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
        {searchTerm
          ? 'Try adjusting your search or filter to find what you\'re looking for.'
          : description}
      </p>
    </div>
  );
}

