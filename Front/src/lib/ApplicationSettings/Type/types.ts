export type AiAgentSettings = {
  agent: string;
  apiEndpoint: string;
  connectionString: string;
};

// One object for every application-level settings section (see the
// ApplicationSettingsPage stepper) - grows as more sections get added, still
// saved through a single call instead of one hook per section.
export type ApplicationSettings = {
  aiAgent: AiAgentSettings;
};

export type SaveApplicationSettingsResult =
  | {success: true}
  | {success: false};