import { createAccessControl } from "better-auth/plugins/access";

/**
 * Define statements (resources and their possible actions)
 */
const statement = {
  instance: ["create", "read", "update", "delete", "connect", "disconnect"],
  webhook: ["create", "read", "update", "delete"],
  message: ["send", "read"],
  user: ["read", "update", "delete", "ban", "impersonate"],
  settings: ["read", "update"],
  apiKey: ["create", "read", "revoke"],
  logs: ["read"],
} as const;

/**
 * Create Access Controller
 */
export const ac = createAccessControl(statement);

/**
 * USER Role - Basic access
 * Can manage own instances, send messages, view settings
 */
export const user = ac.newRole({
  instance: ["create", "read", "update", "delete", "connect", "disconnect"],
  webhook: ["create", "read", "update", "delete"],
  message: ["send", "read"],
  settings: ["read"],
  apiKey: ["create", "read", "revoke"],
});

/**
 * DEVELOPER Role - Extended access
 * All USER permissions plus logs access and extended settings
 */
export const developer = ac.newRole({
  instance: ["create", "read", "update", "delete", "connect", "disconnect"],
  webhook: ["create", "read", "update", "delete"],
  message: ["send", "read"],
  settings: ["read", "update"],
  apiKey: ["create", "read", "revoke"],
  logs: ["read"],
});

/**
 * ADMIN Role - Full access
 * All permissions including user management
 */
export const admin = ac.newRole({
  instance: ["create", "read", "update", "delete", "connect", "disconnect"],
  webhook: ["create", "read", "update", "delete"],
  message: ["send", "read"],
  user: ["read", "update", "delete", "ban", "impersonate"],
  settings: ["read", "update"],
  apiKey: ["create", "read", "revoke"],
  logs: ["read"],
});

export type Role = "USER" | "DEVELOPER" | "ADMIN";

