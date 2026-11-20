// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

/**
 * Deny all client (browser) access. Every read and write comes from the backend
 * (backend/scripts/*.js) through the Admin SDK with INSTANTDB_ADMIN_TOKEN, and the
 * admin token bypasses these rules. The BayanWin frontend never connects to InstantDB.
 *
 * The app ID is public by design, so open rules let anyone edit or delete the
 * lottery results and predictions. Keep these closed unless a feature needs
 * client access; then open only that table and only the action it needs.
 */
const rules = {
  // Every namespace not listed here, including the lottery tables, todos and $users.
  $default: {
    allow: {
      $default: "false",
    },
  },
  // Stop clients from adding new attributes or tables to the schema.
  attrs: {
    allow: {
      create: "false",
    },
  },
} satisfies InstantRules;

export default rules;
