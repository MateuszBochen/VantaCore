import {useEffect, useState} from 'react';
import {Plus, RefreshCw, Send, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select} from '@/components/ui/select';
import {Combobox} from '@/components/ui/combobox';
import {Checkbox} from '@/components/ui/checkbox';
import {Surface} from '@/components/ui/surface';
import {CopyButton} from '@/components/ui/copy-button';
import {toastService} from '@/lib/Toast/ToastService';
import useListWebhooksHook from '@/lib/Webhook/useListWebhooksHook';
import useCreateWebhookHook from '@/lib/Webhook/useCreateWebhookHook';
import useUpdateWebhookHook from '@/lib/Webhook/useUpdateWebhookHook';
import useDeleteWebhookHook from '@/lib/Webhook/useDeleteWebhookHook';
import useRotateWebhookSecretHook from '@/lib/Webhook/useRotateWebhookSecretHook';
import useTestWebhookHook from '@/lib/Webhook/useTestWebhookHook';
import useListWebhookDeliveriesHook from '@/lib/Webhook/useListWebhookDeliveriesHook';
import type {
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookEventType,
  WebhookSubscription,
  WebhookTargetType,
} from '@/lib/Webhook/Type/types';

// Same labels as AutomationRules/TriggerStep's own TRIGGER_OPTIONS - kept as
// its own local constant rather than a shared export (that file's is local
// too), since WebhookEventType is just AutomationTriggerType under another
// name (see the sub-project's ADR: one shared event bus).
const EVENT_TYPE_OPTIONS: {value: WebhookEventType; label: string}[] = [
  {value: 'TICKET_CREATED', label: 'Ticket created'},
  {value: 'TICKET_STATUS_CHANGED', label: 'Ticket status changed'},
  {value: 'TICKET_FIELD_CHANGED', label: 'Ticket field changed'},
  {value: 'COMMENT_ADDED', label: 'Comment added'},
  {value: 'COMMIT_PUSHED', label: 'Commit pushed'},
  {value: 'BRANCH_CREATED', label: 'Branch created'},
  {value: 'PULL_REQUEST_OPENED', label: 'Pull request opened'},
  {value: 'PULL_REQUEST_MERGED', label: 'Pull request merged'},
  {value: 'PULL_REQUEST_DECLINED', label: 'Pull request declined'},
];

const TARGET_TYPE_LABELS: Record<WebhookTargetType, string> = {
  GENERIC: 'Generic (HMAC-signed JSON)',
  SLACK: 'Slack',
  TEAMS: 'Microsoft Teams',
  DISCORD: 'Discord',
};

const TARGET_TYPE_OPTIONS: {value: WebhookTargetType; label: string}[] = (
  Object.keys(TARGET_TYPE_LABELS) as WebhookTargetType[]
).map((value) => ({value, label: TARGET_TYPE_LABELS[value]}));

// Every non-GENERIC target formats the payload for that provider and is
// configured with just that provider's own incoming-webhook URL - no HMAC
// secret of its own (see WebhookTargetType).
const TARGET_URL_LABELS: Record<WebhookTargetType, string> = {
  GENERIC: 'Target URL',
  SLACK: 'Slack incoming webhook URL',
  TEAMS: 'Teams incoming webhook URL',
  DISCORD: 'Discord webhook URL',
};

const DELIVERY_STATUS_CLASSES: Record<WebhookDeliveryStatus, string> = {
  SUCCESS: 'text-emerald-400',
  FAILED: 'text-destructive',
  RETRYING: 'text-amber-400',
};

type RevealedSecret = {
  webhookId: string;
  secret: string;
};

type WebhooksSectionProps = {
  projectId: string;
};

// Delivery is fully async off the domain event bus (see ADR) - this section
// never talks to a target endpoint directly, only to VantaCore's own API;
// a slow/dead external endpoint has no way to slow this page down.
const WebhooksSection = ({projectId}: WebhooksSectionProps) => {
  const {listWebhooks} = useListWebhooksHook();
  const {createWebhook} = useCreateWebhookHook();
  const {updateWebhook} = useUpdateWebhookHook();
  const {deleteWebhook} = useDeleteWebhookHook();
  const {rotateWebhookSecret} = useRotateWebhookSecretHook();
  const {testWebhook} = useTestWebhookHook();
  const {listWebhookDeliveries} = useListWebhookDeliveriesHook();

  const [webhooks, setWebhooks] = useState<WebhookSubscription[] | null>(null);
  const [targetType, setTargetType] = useState<WebhookTargetType>('GENERIC');
  const [targetUrl, setTargetUrl] = useState('');
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<RevealedSecret | null>(null);

  const [expandedDeliveriesId, setExpandedDeliveriesId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[] | null>(null);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listWebhooks(projectId).then((result) => {
      if (!cancelled && result.success) {
        setWebhooks(result.webhooks);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listWebhooks is a thin useRequestHook wrapper recreated every render
  }, [projectId]);

  const handleCreate = () => {
    if (!targetUrl.trim() || eventTypes.length === 0) {
      return;
    }

    setCreating(true);

    createWebhook(projectId, {targetType, targetUrl: targetUrl.trim(), eventTypes: eventTypes as WebhookEventType[]})
      .then((result) => {
        if (!result.success) {
          return;
        }

        setWebhooks((current) => [...(current ?? []), result.webhook]);
        if (result.webhook.secret) {
          setRevealedSecret({webhookId: result.webhook.id, secret: result.webhook.secret});
        }
        setTargetUrl('');
        setEventTypes([]);
        setTargetType('GENERIC');
      })
      .finally(() => setCreating(false));
  };

  const handleToggleEnabled = (webhook: WebhookSubscription) => {
    setTogglingId(webhook.id);

    updateWebhook(projectId, webhook.id, {eventTypes: webhook.eventTypes, targetUrl: webhook.targetUrl, enabled: !webhook.enabled})
      .then((result) => {
        if (result.success) {
          setWebhooks((current) =>
            (current ?? []).map((candidate) => (candidate.id === webhook.id ? {...candidate, enabled: !webhook.enabled} : candidate)),
          );
        }
      })
      .finally(() => setTogglingId(null));
  };

  const handleRotateSecret = (webhookId: string) => {
    setRotatingId(webhookId);

    rotateWebhookSecret(projectId, webhookId)
      .then((result) => {
        if (result.success) {
          setRevealedSecret({webhookId, secret: result.secret});
        }
      })
      .finally(() => setRotatingId(null));
  };

  const handleTest = (webhookId: string) => {
    setTestingId(webhookId);

    testWebhook(projectId, webhookId)
      .then((result) => {
        if (result.success) {
          toastService.push('success', 'Test event sent — check the delivery log below.');
          if (expandedDeliveriesId === webhookId) {
            handleToggleDeliveries(webhookId, true);
          }
        }
      })
      .finally(() => setTestingId(null));
  };

  const handleToggleDeliveries = (webhookId: string, forceRefetch = false) => {
    if (expandedDeliveriesId === webhookId && !forceRefetch) {
      setExpandedDeliveriesId(null);
      return;
    }

    setExpandedDeliveriesId(webhookId);
    setDeliveries(null);
    setLoadingDeliveries(true);

    listWebhookDeliveries(projectId, webhookId)
      .then((result) => {
        if (result.success) {
          setDeliveries(result.deliveries);
        }
      })
      .finally(() => setLoadingDeliveries(false));
  };

  const handleDeleteClick = (webhookId: string) => {
    if (confirmingDeleteId !== webhookId) {
      setConfirmingDeleteId(webhookId);
      return;
    }

    setConfirmingDeleteId(null);
    setDeletingId(webhookId);

    deleteWebhook(projectId, webhookId)
      .then((result) => {
        if (result.success) {
          setWebhooks((current) => (current ?? []).filter((candidate) => candidate.id !== webhookId));
          if (expandedDeliveriesId === webhookId) {
            setExpandedDeliveriesId(null);
          }
          if (revealedSecret?.webhookId === webhookId) {
            setRevealedSecret(null);
          }
        }
      })
      .finally(() => setDeletingId(null));
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-foreground">Webhooks</p>
      <p className="text-sm text-muted-foreground">
        Notify an external system (or Slack) when something happens in this project. Delivery is fully async — a slow or dead endpoint
        never affects VantaCore itself.
      </p>

      {webhooks === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : webhooks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No webhooks yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {TARGET_TYPE_LABELS[webhook.targetType]}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{webhook.targetUrl}</span>
                <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <Checkbox
                    checked={webhook.enabled}
                    onCheckedChange={() => handleToggleEnabled(webhook)}
                    disabled={togglingId === webhook.id}
                  />
                  Enabled
                </label>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {webhook.eventTypes.map((eventType) => (
                  <span key={eventType} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {EVENT_TYPE_OPTIONS.find((option) => option.value === eventType)?.label ?? eventType}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" leftIcon={<Send className="h-4 w-4" />} loading={testingId === webhook.id} onClick={() => handleTest(webhook.id)}>
                  Send test event
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleToggleDeliveries(webhook.id)}>
                  {expandedDeliveriesId === webhook.id ? 'Hide deliveries' : 'View deliveries'}
                </Button>
                {webhook.targetType === 'GENERIC' && (
                  <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} loading={rotatingId === webhook.id} onClick={() => handleRotateSecret(webhook.id)}>
                    Regenerate secret
                  </Button>
                )}
                <Button
                  variant={confirmingDeleteId === webhook.id ? 'destructive' : 'outline'}
                  size="sm"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  loading={deletingId === webhook.id}
                  onClick={() => handleDeleteClick(webhook.id)}
                  className="ml-auto"
                >
                  {confirmingDeleteId === webhook.id ? 'Confirm delete?' : 'Delete'}
                </Button>
              </div>

              {revealedSecret?.webhookId === webhook.id && (
                <div className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/5 p-3">
                  <p className="text-xs text-foreground">
                    Use this to verify the <code>X-VantaCore-Signature</code> header on deliveries — shown once, can{"'"}t be viewed
                    again afterwards (only regenerated, which invalidates this one).
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-xs text-muted-foreground">Secret</span>
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-2.5 py-1 text-xs text-foreground">
                      {revealedSecret.secret}
                    </code>
                    <CopyButton value={revealedSecret.secret} />
                  </div>
                </div>
              )}

              {expandedDeliveriesId === webhook.id && (
                <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
                  {loadingDeliveries ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">Loading…</p>
                  ) : !deliveries || deliveries.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">No deliveries yet.</p>
                  ) : (
                    deliveries.map((delivery) => (
                      <div key={delivery.id} className="flex items-center gap-3 px-3 py-1.5 text-xs">
                        <span className={`w-20 shrink-0 font-semibold ${DELIVERY_STATUS_CLASSES[delivery.status]}`}>
                          {delivery.status}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {EVENT_TYPE_OPTIONS.find((option) => option.value === delivery.eventType)?.label ?? delivery.eventType}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {delivery.statusCode !== null ? `HTTP ${delivery.statusCode}` : 'No response'}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          attempt {delivery.attempt}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-right text-muted-foreground">
                          {new Date(delivery.deliveredAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Surface className="flex flex-col gap-3 p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Add webhook</p>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Target</label>
            <Select className="w-56" value={targetType} onValueChange={(value) => setTargetType(value as WebhookTargetType)} options={TARGET_TYPE_OPTIONS} />
          </div>
          <div className="flex min-w-64 flex-1 flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">{TARGET_URL_LABELS[targetType]}</label>
            <Input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://…" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Events</label>
          <Combobox
            multiple
            value={eventTypes}
            onValueChange={setEventTypes}
            options={EVENT_TYPE_OPTIONS}
            placeholder="Pick one or more events"
            className="max-w-md"
          />
        </div>

        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreate} loading={creating} disabled={!targetUrl.trim() || eventTypes.length === 0} className="w-fit">
          Add webhook
        </Button>
      </Surface>
    </div>
  );
};

export default WebhooksSection;
