package vantaCore.ui.mcp;

/** FULL: every API operation is its own tool (~95 tools) - best for clients that cope with many
 tools (e.g. Claude Code). COMPACT: three generic tools (list/describe/call operation) that reach the
 same operations - for clients that degrade with a large tool list. Chosen by endpoint URL. */
public enum McpToolMode {
    FULL,
    COMPACT
}
