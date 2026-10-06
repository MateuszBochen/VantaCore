import {Link} from 'react-router-dom';
import {cn} from '@/lib/utils';
import type {ActionLinkProps} from './types';

const BASE_CLASSES =
  'flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accent/30 bg-accent/5 px-3 py-2.5 text-sm font-medium text-accent transition-colors';

// `disabled` renders a non-navigating placeholder with the same look, for
// actions that are visually planned but not wired up to anything yet.
const ActionLink = ({to, children, className, disabled}: ActionLinkProps) => {
  if (disabled) {
    return (
      <button type="button" disabled className={cn(BASE_CLASSES, 'cursor-not-allowed opacity-50', className)}>
        {children}
      </button>
    );
  }

  return (
    <Link to={to} className={cn(BASE_CLASSES, 'hover:border-accent/60 hover:bg-accent/10', className)}>
      {children}
    </Link>
  );
};

export default ActionLink;
