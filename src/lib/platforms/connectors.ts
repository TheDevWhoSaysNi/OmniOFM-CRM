import type { IntegrationProvider } from "@prisma/client";

export type PlatformConnector = {
  provider: IntegrationProvider;
  label: string;
  capabilities: Array<"metrics" | "inbox" | "media">;
  status: "live" | "coming_soon";
  connectPath: string;
};

export const PLATFORM_CONNECTORS: PlatformConnector[] = [
  {
    provider: "FANVUE",
    label: "Fanvue",
    capabilities: ["metrics", "inbox"],
    status: "live",
    connectPath: "/api/integrations/fanvue/connect",
  },
  {
    provider: "ONLYFANS",
    label: "OnlyFans",
    capabilities: ["metrics"],
    status: "coming_soon",
    connectPath: "/api/integrations/onlyfans/connect",
  },
  {
    provider: "FANSLY",
    label: "Fansly",
    capabilities: ["metrics"],
    status: "coming_soon",
    connectPath: "/api/integrations/fansly/connect",
  },
  {
    provider: "STACKED",
    label: "Stacked",
    capabilities: ["metrics"],
    status: "coming_soon",
    connectPath: "/api/integrations/stacked/connect",
  },
  {
    provider: "TELEGRAM",
    label: "Telegram",
    capabilities: ["inbox"],
    status: "live",
    connectPath: "/api/telegram/connect",
  },
];