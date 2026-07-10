import { describe, expect, it } from "vitest"

import packageJson from "../../package.json"
import netopiaVoyantPlugin from "../../src/voyant.js"

describe("Netopia deployment manifest", () => {
  it("publishes package-owned plugin metadata and source/publish exports", () => {
    expect(packageJson.voyant).toEqual({
      schemaVersion: "voyant.package.v1",
      kind: "plugin",
      manifest: "./voyant",
      compatibleWith: {
        framework: ">=0.35.0",
        targets: ["node", "voyant-cloud"],
        modes: ["local", "managed-cloud", "self-hosted"],
      },
    })
    expect(packageJson.exports["./voyant"]).toBe("./src/voyant.ts")
    expect(packageJson.publishConfig.exports["./voyant"]).toEqual({
      types: "./dist/voyant.d.ts",
      import: "./dist/voyant.js",
      default: "./dist/voyant.js",
    })
  })

  it("declares the finance admin, callback, runtime, and capability contract", () => {
    expect(netopiaVoyantPlugin).toMatchObject({
      schemaVersion: "voyant.plugin.v1",
      id: "@voyant-travel/plugin-netopia",
      packageName: "@voyant-travel/plugin-netopia",
      provides: {
        capabilities: ["finance.card-payment", "finance.payment-provider.netopia"],
      },
      requires: {
        capabilities: ["finance.payment-sessions", "notifications.delivery"],
      },
      api: [
        {
          id: "@voyant-travel/plugin-netopia#api.admin",
          surface: "admin",
          mount: "finance",
          transactional: true,
          runtime: {
            entry: "@voyant-travel/plugin-netopia",
            export: "createNetopiaFinanceExtension",
          },
        },
        {
          id: "@voyant-travel/plugin-netopia#api.webhook",
          surface: "webhook",
          mount: "finance",
          anonymous: true,
          transactional: true,
          runtime: {
            entry: "@voyant-travel/plugin-netopia",
            export: "createNetopiaFinanceExtension",
          },
        },
      ],
      config: [
        { key: "NETOPIA_MODE", default: "sandbox" },
        { key: "NETOPIA_NOTIFY_URL", required: true },
        { key: "NETOPIA_REDIRECT_URL", required: true },
      ],
      secrets: [
        { key: "NETOPIA_API_KEY", required: true },
        { key: "NETOPIA_POS_SIGNATURE", required: true },
        { key: "NETOPIA_IPN_PUBLIC_KEY", required: true },
      ],
      webhooks: [
        {
          id: "@voyant-travel/plugin-netopia#webhook.ipn",
          direction: "inbound",
          apiId: "@voyant-travel/plugin-netopia#api.webhook",
          secretIds: [
            "@voyant-travel/plugin-netopia#secret.api-key",
            "@voyant-travel/plugin-netopia#secret.pos-signature",
            "@voyant-travel/plugin-netopia#secret.ipn-public-key",
          ],
        },
      ],
    })
  })

  it("points every runtime reference at a real package export", async () => {
    const runtimeNamespace = await import("@voyant-travel/plugin-netopia")

    for (const facet of netopiaVoyantPlugin.api) {
      expect(facet.runtime.entry).toBe("@voyant-travel/plugin-netopia")
      expect(runtimeNamespace[facet.runtime.export]).toEqual(expect.any(Function))
    }
  }, 15_000)
})
