import {SettingName} from '@/lib/Settings/Enum/SettingName';
import {Settings} from '@/lib/Settings/Settings';
import type {VcsProvider} from './Type/types';

// Fully derivable from provider + connectionId (see the ingestion endpoint
// shape in the sub-project's Solution Design: `/api/webhook/vcs/{provider}/
// {connectionId}`) - unlike the webhook secret, there's nothing sensitive
// about this URL, so it's never fetched from the backend at all, just built
// client-side wherever it needs to be shown (every connection row, not only
// right after creating one).
const buildVcsWebhookUrl = (provider: VcsProvider, connectionId: string): string => {
  const host = Settings.getSetting(SettingName.API_HOST);
  return `${host}/api/webhook/vcs/${provider.toLowerCase()}/${connectionId}`;
};

export default buildVcsWebhookUrl;
