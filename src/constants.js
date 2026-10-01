'use strict';
const path = require('path');
const os = require('os');

const CORTEX_ID = 'cortex';
const PLUGIN_NAME = 'cortex';
const STATE_HOME = process.env.CORTEX_STATE_HOME || path.join(os.homedir(), '.antigravity-cortex');
const IDE_GLOBAL_SKILLS = process.env.CORTEX_IDE_SKILLS || path.join(os.homedir(), '.gemini', 'config', 'skills');
const CLI_GLOBAL_SKILLS = process.env.CORTEX_CLI_SKILLS || path.join(os.homedir(), '.gemini', 'antigravity-cli', 'skills');
const WORKSPACE_PLUGIN_REL = path.join('.agents', 'plugins', PLUGIN_NAME);
const WORKSPACE_MARKER_REL = path.join('.agents', 'cortex', 'workspace.json');
const WORKSPACE_CONFIG_REL = path.join('.agents', 'cortex', 'config.json');
const KNOWN_FOREIGN_ORCHESTRATORS = new Set(['dockyardos', 'gamefoundry', 'devflow', 'resumeguard', 'marco']);
const RESERVED_FOREIGN_PATHS = [
  path.join('.agents','plugins','dockyardos'),
  path.join('.agents','plugins','gamefoundry'),
  path.join('.agents','dockyardos'),
  '.dockyard', '.dockyardos', '.gamefoundry'
];
const DEFAULTS = Object.freeze({
  checkpointIntervalMinutes: 5,
  eventCheckpointDebounceSeconds: 30,
  foreignOrchestratorPolicy: 'block',
  autoInstallTrustedSkills: true,
  skillScope: 'ide-global',
  runSecurityAfterVerify: true,
  allowExternalSecurityTools: false,
  maxCheckpointHistory: 200
});
module.exports = { CORTEX_ID, PLUGIN_NAME, STATE_HOME, IDE_GLOBAL_SKILLS, CLI_GLOBAL_SKILLS, WORKSPACE_PLUGIN_REL, WORKSPACE_MARKER_REL, WORKSPACE_CONFIG_REL, KNOWN_FOREIGN_ORCHESTRATORS, RESERVED_FOREIGN_PATHS, DEFAULTS };
