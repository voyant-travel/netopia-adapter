/**
 * Import-cheap deployment declaration owned by the Netopia plugin package.
 *
 * @voyant-travel/core@0.111.0 predates the dependency-free `./project`
 * authoring export, so this local type mirrors the `voyant.plugin.v1` fields
 * used here without importing the package's route or service graph.
 */
interface NetopiaVoyantPluginManifest {
  schemaVersion: "voyant.plugin.v1"
  id: string
  packageName: string
  localId: string
  provides: {
    capabilities: readonly string[]
  }
  requires: {
    capabilities: readonly string[]
  }
  api: readonly {
    id: string
    surface: "admin" | "webhook"
    mount: string
    anonymous?: boolean
    transactional: boolean
    openapi?: {
      document: string
    }
    runtime: {
      entry: string
      export: string
    }
  }[]
  config: readonly {
    id: string
    key: string
    required?: boolean
    default?: string
  }[]
  secrets: readonly {
    id: string
    key: string
    required: boolean
    description: string
  }[]
  webhooks: readonly {
    id: string
    direction: "inbound"
    apiId: string
    secretIds: readonly string[]
  }[]
  providers?: readonly {
    id: string
    port: "payments.adapter.runtime"
    selection: {
      role: "payments"
      value: "netopia"
    }
    runtime: {
      entry: string
      export: string
    }
  }[]
  meta: {
    ownership: "package"
  }
}

const pluginId = "@voyant-travel/plugin-netopia"
const adminApiId = `${pluginId}#api.admin`
const webhookApiId = `${pluginId}#api.webhook`
const apiKeySecretId = `${pluginId}#secret.api-key`
const posSignatureSecretId = `${pluginId}#secret.pos-signature`
const publicKeySecretId = `${pluginId}#secret.public-key`

export const netopiaVoyantPlugin = {
  schemaVersion: "voyant.plugin.v1",
  id: pluginId,
  packageName: pluginId,
  localId: "plugin-netopia",
  provides: {
    capabilities: [
      "finance.card-payment",
      "finance.payment-provider.netopia",
      "payments.adapter.runtime",
    ],
  },
  requires: {
    capabilities: ["finance.payment-sessions", "notifications.delivery"],
  },
  api: [
    {
      id: adminApiId,
      surface: "admin",
      mount: "finance",
      transactional: true,
      openapi: { document: "netopia" },
      runtime: {
        entry: pluginId,
        export: "createNetopiaFinanceExtension",
      },
    },
    {
      id: webhookApiId,
      surface: "webhook",
      mount: "finance",
      anonymous: true,
      transactional: true,
      runtime: {
        entry: pluginId,
        export: "createNetopiaFinanceExtension",
      },
    },
  ],
  config: [
    {
      id: `${pluginId}#config.mode`,
      key: "NETOPIA_SANDBOX",
      default: "true",
    },
    {
      id: `${pluginId}#config.notify-url`,
      key: "NETOPIA_NOTIFY_URL",
      required: true,
    },
    {
      id: `${pluginId}#config.redirect-url`,
      key: "NETOPIA_REDIRECT_URL",
      required: true,
    },
  ],
  secrets: [
    {
      id: apiKeySecretId,
      key: "NETOPIA_PRIVATE_KEY",
      required: true,
      description: "Netopia merchant private key or API credential.",
    },
    {
      id: posSignatureSecretId,
      key: "NETOPIA_MERCHANT_ID",
      required: true,
      description: "Netopia merchant identifier.",
    },
    {
      id: publicKeySecretId,
      key: "NETOPIA_PUBLIC_KEY",
      required: true,
      description: "Netopia platform public key used to verify inbound callbacks.",
    },
  ],
  webhooks: [
    {
      id: `${pluginId}#webhook.ipn`,
      direction: "inbound",
      apiId: webhookApiId,
      secretIds: [apiKeySecretId, posSignatureSecretId, publicKeySecretId],
    },
  ],
  providers: [
    {
      id: `${pluginId}#provider.payments.netopia`,
      port: "payments.adapter.runtime",
      selection: { role: "payments", value: "netopia" },
      runtime: {
        entry: pluginId,
        export: "createNetopiaPaymentAdapter",
      },
    },
  ],
  meta: {
    ownership: "package",
  },
} as const satisfies NetopiaVoyantPluginManifest

export default netopiaVoyantPlugin
