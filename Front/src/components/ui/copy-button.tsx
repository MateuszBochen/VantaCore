import {useState} from 'react';
import {Check, Copy} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';

type CopyButtonProps = {
  value: string;
  className?: string;
};

const CONFIRMATION_MS = 1500;

// No clipboard-copy convention existed anywhere in the app before this (see
// the Git / VCS Integration sub-project - the first place that needs to hand
// a user a webhook secret to paste elsewhere). Same transient-local-state
// idiom as the app's click-to-confirm delete buttons, just success instead
// of destructive.
const CopyButton = ({value, className}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), CONFIRMATION_MS);
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disableRipple
      onClick={handleClick}
      leftIcon={copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      className={cn('shrink-0', className)}
    >
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
};

export {CopyButton};
