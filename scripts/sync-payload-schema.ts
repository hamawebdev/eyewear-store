import { config } from "dotenv";
import { loadScriptPayloadClient } from "./payload-script-helpers.js";

// Load environment variables from .env file
config();

const main = async () => {
  const payload = await loadScriptPayloadClient();
  payload.logger.info("Schema sync completed successfully.");
  process.exit(0);
};

main().catch((error) => {
  console.error("Failed to sync schema:", error);
  process.exit(1);
});
