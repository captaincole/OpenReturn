import { MastraClient } from "@mastra/client-js";

export async function makeMastraClient(): Promise<MastraClient> {
  return new MastraClient({ baseUrl: "/api/agent" });
}
