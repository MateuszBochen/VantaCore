export type AiAgentOption = {
  id: string;
  label: string;
  endpointPlaceholder: string;
  // Everything an agent needs beyond the endpoint (key, model, and whatever
  // else that provider's auth scheme requires) as a single DSN-style string -
  // only the placeholder differs per agent, the field itself never branches.
  connectionStringPlaceholder: string;
};

// Deliberately excludes GitHub Copilot: it authenticates via an OAuth
// device-flow tied to a GitHub account, not a key+endpoint pair, so it can't
// be represented by this generic shape at all - it would need its own,
// entirely different connection flow, not just another entry here.
export const AI_AGENT_OPTIONS: AiAgentOption[] = [
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    endpointPlaceholder: 'https://api.anthropic.com',
    connectionStringPlaceholder: 'key=sk-ant-...;model=claude-sonnet-5;version=2023-06-01',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    endpointPlaceholder: 'https://api.openai.com/v1',
    connectionStringPlaceholder: 'key=sk-...;model=gpt-4.1;organization=org-...',
  },
  {
    id: 'azure-openai',
    label: 'Azure OpenAI',
    endpointPlaceholder: 'https://<resource>.openai.azure.com',
    connectionStringPlaceholder: 'key=...;deployment=my-gpt4;api-version=2024-02-15-preview',
  },
  {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    endpointPlaceholder: 'https://localhost:11434/v1',
    connectionStringPlaceholder: 'key=optional;model=llama3',
  },
];