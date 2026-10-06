import {forwardRef, useCallback, useImperativeHandle, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import {Field, Form, Formik} from 'formik';
import type {FieldProps, FormikProps} from 'formik';
import {ChevronDown, ChevronRight} from 'lucide-react';
import ValidationSchema from '../../Formik/ValidationSchema.ts';
import {Input} from '@/components/ui/input';
import {Select} from '@/components/ui/select';
import {DateInput} from '@/components/ui/date-input';
import {cn} from '@/lib/utils';
import {RELEASE_STATUSES} from '@/lib/Release/releaseStatuses';
import {AFTER_CARE_PERIODS} from '@/lib/Release/afterCarePeriods';
import TicketRow from '../../Pages/Panel/Project/Tickets/TicketRow';
import ReleaseTicketPicker from '../../Pages/Panel/Project/VersionTracker/ReleaseTicketPicker';
import type {ReleaseTicket} from '@/lib/Release/Type/types';
import type {ReleaseFormData, ReleaseFormProps, ReleaseFormRef} from './types';

const yup = ValidationSchema.getBuilder();

// Mirrors the Api's UpsertReleaseRequest (@NotBlank / @Size(max = 255)) so
// these are caught here instead of coming back as a failed-save toast.
const schema = yup.object({
  versionNumber: yup.string().trim().required('Version number is required').max(255, 'Maximum 255 characters'),
  name: yup.string().trim().required('Name is required').max(255, 'Maximum 255 characters'),
  status: yup.string().required('Status is required'),
  plannedReleaseDate: yup.string().required('Planned release date is required'),
});

const FieldLabel = ({children}: {children: ReactNode}) => (
  <p className="whitespace-nowrap text-left text-xs uppercase tracking-widest text-muted-foreground">{children}</p>
);

const FieldError = ({name, form}: {name: keyof ReleaseFormData; form: FieldProps['form']}) => {
  const error = form.touched[name] ? (form.errors[name] as string | undefined) : undefined;
  return error ? <p className="text-xs text-red-400">{error}</p> : null;
};

const hasError = (name: keyof ReleaseFormData, form: FieldProps['form']): boolean => Boolean(form.touched[name] && form.errors[name]);

const invalidClassName = 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30';

type TextFieldProps = {
  name: 'versionNumber' | 'name';
  label: string;
  placeholder: string;
  disabled?: boolean;
  // Width/flex of the field in the row - Name grows, Version number doesn't.
  className: string;
};

const TextField = ({name, label, placeholder, disabled, className}: TextFieldProps) => (
  <Field name={name}>
    {({field, form}: FieldProps) => (
      <div className={cn('flex flex-col gap-1', className)}>
        <FieldLabel>{label}</FieldLabel>
        <Input {...field} id={name} placeholder={placeholder} disabled={disabled} className={cn(hasError(name, form) && invalidClassName)} />
        <FieldError name={name} form={form} />
      </div>
    )}
  </Field>
);

type SelectFieldProps = {
  name: 'status' | 'afterCarePeriod';
  label: string;
  options: {value: string; label: string}[];
  placeholder?: string;
  disabled?: boolean;
};

const SelectField = ({name, label, options, placeholder, disabled}: SelectFieldProps) => (
  <Field name={name}>
    {({field, form}: FieldProps) => (
      <div className="flex w-44 flex-col gap-1">
        <FieldLabel>{label}</FieldLabel>
        <Select
          id={name}
          value={field.value}
          onValueChange={(value) => form.setFieldValue(name, value)}
          placeholder={placeholder}
          disabled={disabled}
          options={options}
        />
        <FieldError name={name} form={form} />
      </div>
    )}
  </Field>
);

// DateInput isn't a native input Formik can wire through `field` - value in,
// setFieldValue out, and touched is set on change so a cleared date shows
// its "required" error right away rather than only after a submit attempt.
const DateField = ({disabled}: {disabled?: boolean}) => (
  <Field name="plannedReleaseDate">
    {({field, form}: FieldProps) => (
      <div className="flex w-48 flex-col gap-1">
        <FieldLabel>Planned release date</FieldLabel>
        <DateInput
          value={field.value}
          onChange={(value) => {
            form.setFieldTouched('plannedReleaseDate', true, false);
            form.setFieldValue('plannedReleaseDate', value);
          }}
          disabled={disabled}
          className={cn(hasError('plannedReleaseDate', form) && invalidClassName)}
        />
        <FieldError name="plannedReleaseDate" form={form} />
      </div>
    )}
  </Field>
);

type TicketsSectionProps = Pick<ReleaseFormProps, 'projectId' | 'ticketDetailsById' | 'issueTypes' | 'statuses' | 'flags'> & {
  ticketIds: string[];
  onTicketIdsChange: (ticketIds: string[]) => void;
};

const TicketsSection = ({projectId, ticketDetailsById, issueTypes, statuses, flags, ticketIds, onTicketIdsChange}: TicketsSectionProps) => {
  // Collapsed by default - once a version has more than a couple of
  // tickets, every card rendering its full TicketRow list (which itself can
  // expand into children) at once makes the version list unreadable.
  const [expanded, setExpanded] = useState(false);

  const selectedTickets = ticketIds.flatMap((id) => {
    const ticket = ticketDetailsById.get(id);
    return ticket ? [ticket] : [];
  });
  const isDone = (ticket: ReleaseTicket): boolean => statuses.find((candidate) => candidate.id === ticket.statusId)?.isDone ?? false;
  const doneCount = selectedTickets.filter(isDone).length;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          disabled={selectedTickets.length === 0}
          className="flex items-center gap-1.5 text-left disabled:cursor-default"
        >
          {selectedTickets.length > 0 &&
            (expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            ))}
          <FieldLabel>Tickets{selectedTickets.length > 0 ? ` (${selectedTickets.length})` : ''}</FieldLabel>
        </button>

        {selectedTickets.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {doneCount}/{selectedTickets.length} done
          </span>
        )}
      </div>

      <ReleaseTicketPicker
        projectId={projectId}
        ticketIds={ticketIds}
        onTicketIdsChange={onTicketIdsChange}
        initialTicketDetails={Array.from(ticketDetailsById.values())}
      />

      {expanded && selectedTickets.length > 0 && (
        <div className="mt-1 flex flex-col gap-2">
          {selectedTickets.map((ticket) => (
            <TicketRow key={ticket.id} projectId={projectId} ticket={ticket} issueTypes={issueTypes} statuses={statuses} flags={flags} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
};

// One version's editable fields (Version Tracker's ReleaseCard). Same shape
// as LoginForm/AiAgentForm: Formik + Yup schema, parent submits through the
// ref. Only the fields row is the actual <form> - the tickets section sits
// outside it (still Formik state, via setFieldValue) so pressing Enter in
// ReleaseTicketPicker's search box doesn't save the whole version.
const ReleaseForm = forwardRef<ReleaseFormRef, ReleaseFormProps>((props, ref) => {
  const formikRef = useRef<FormikProps<ReleaseFormData>>(null);

  const handleOnFormSubmit = useCallback(
    (data: ReleaseFormData) => {
      props.onSubmit({...data, versionNumber: data.versionNumber.trim(), name: data.name.trim()});
    },
    [props],
  );

  useImperativeHandle(ref, () => ({
    submit() {
      formikRef?.current?.submitForm();
    },
    setFieldErrors(errors) {
      errors.forEach(({field, message}) => {
        formikRef?.current?.setFieldTouched(field, true, false);
        formikRef?.current?.setFieldError(field, message);
      });
    },
  }));

  return (
    <Formik<ReleaseFormData> innerRef={formikRef} validationSchema={schema} onSubmit={handleOnFormSubmit} initialValues={props.initialValues}>
      {({values, setFieldValue}) => (
        <div className="flex flex-col gap-4">
          <Form className="flex flex-wrap items-start gap-3">
            <TextField name="versionNumber" label="Version number" placeholder="e.g. 1.2.0" disabled={props.lockForm} className="w-36" />
            <TextField name="name" label="Name" placeholder="e.g. Autumn cleanup" disabled={props.lockForm} className="min-w-40 flex-1" />
            <SelectField
              name="status"
              label="Status"
              options={RELEASE_STATUSES.map((option) => ({value: option.id, label: option.label}))}
              disabled={props.lockForm}
            />
            <DateField disabled={props.lockForm} />
            <SelectField
              name="afterCarePeriod"
              label="Planned after care"
              placeholder="None"
              options={AFTER_CARE_PERIODS.map((option) => ({value: option.id, label: option.label}))}
              disabled={props.lockForm}
            />

            {/* Aligned with the inputs, below their labels (the row is
                items-start so a field's error text can't push the others). */}
            {props.actions && <div className="flex items-center gap-2 pt-5">{props.actions}</div>}

            {/* Enter in a text field submits - see LoginForm for why a hidden
                submit control is needed for that. */}
            <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true" />
          </Form>

          <TicketsSection
            projectId={props.projectId}
            ticketDetailsById={props.ticketDetailsById}
            issueTypes={props.issueTypes}
            statuses={props.statuses}
            flags={props.flags}
            ticketIds={values.ticketIds}
            onTicketIdsChange={(ticketIds) => setFieldValue('ticketIds', ticketIds)}
          />
        </div>
      )}
    </Formik>
  );
});

export default ReleaseForm;
