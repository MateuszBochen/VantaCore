import {cn} from '@/lib/utils';

export type StepperStep = {
  id: string;
  label: string;
};

type StepperProps = {
  steps: StepperStep[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
  // Off for tight spaces (e.g. TicketSidebar's face switcher) - drops the
  // numbered circle so each pill is just its label, a bit narrower/shorter.
  showNumbers?: boolean;
};

const Stepper = ({steps, activeId, onSelect, className, showNumbers = true}: StepperProps) => {
  return (
    <div className={cn('flex flex-wrap gap-2 border-b border-border pb-4', className)}>
      {steps.map((step, index) => {
        const isActive = step.id === activeId;

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onSelect(step.id)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'border-accent/60 bg-accent/10 text-accent'
                : 'border-border bg-transparent text-muted-foreground hover:border-accent/30 hover:text-foreground',
            )}
          >
            {showNumbers && (
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                  isActive ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground',
                )}
              >
                {index + 1}
              </span>
            )}
            {step.label}
          </button>
        );
      })}
    </div>
  );
};

export default Stepper;