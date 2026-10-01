'use strict';
const path=require('path');const {readJson,atomicWriteJson,ensureDir}=require('./fs-safe');
function setInspo(workspace,enabled){const file=path.join(workspace,'.agents','plugins','cortex','mcp_config.json');const cfg=readJson(file,{mcpServers:{}})||{mcpServers:{}};cfg.mcpServers=cfg.mcpServers||{};cfg.mcpServers['cortex-inspo']={serverUrl:'https://inspomcp.dev/api/mcp',disabled:!enabled};ensureDir(path.dirname(file));atomicWriteJson(file,cfg);return cfg.mcpServers['cortex-inspo'];}
module.exports={setInspo};
