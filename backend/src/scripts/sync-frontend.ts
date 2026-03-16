import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  linkSalesChannelsToApiKeyWorkflow
} from "@medusajs/medusa/core-flows";
import * as fs from "fs";
import * as path from "path";

export default async function syncFrontend({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const apiKeyModuleService = container.resolve(Modules.API_KEY);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);

  logger.info("Syncing Publishable Key and Sales Channel...");

  // 1. Get Default Sales Channel
  let [defaultSalesChannel] = await salesChannelModuleService.listSalesChannels({ name: "Default Sales Channel" });
  if (!defaultSalesChannel) {
    logger.info("Default Sales Channel missing. Please run seed script first.");
    return;
  }

  // 2. Check for existing Publishable Key
  let [publishableKey] = await apiKeyModuleService.listApiKeys({
    type: "publishable",
    title: "Web Storefront"
  });

  if (!publishableKey) {
    logger.info("Creating new Publishable API Key...");
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            type: "publishable",
            title: "Web Storefront",
            created_by: "system"
          }
        ]
      }
    });
    publishableKey = result[0];
  }

  // 3. Link Key to Sales Channel via Workflow
  logger.info(`Linking Key ${publishableKey.id} to Sales Channel ${defaultSalesChannel.id}...`);
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableKey.id,
      add: [defaultSalesChannel.id]
    }
  });

  const token = publishableKey.token;
  const frontendEnvPath = path.join(process.cwd(), "..", "frontend", ".env.local");

  if (!fs.existsSync(frontendEnvPath)) {
    logger.error(`Frontend .env.local not found at: ${frontendEnvPath}`);
    return;
  }

  // 4. Update file .env.local
  let envContent = fs.readFileSync(frontendEnvPath, "utf8");
  const keyRegex = /^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*$/m;
  const newLine = `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${token}`;

  if (keyRegex.test(envContent)) {
    envContent = envContent.replace(keyRegex, newLine);
  } else {
    envContent += `\n${newLine}\n`;
  }

  fs.writeFileSync(frontendEnvPath, envContent);

  logger.info("✅ Frontend .env.local has been updated.");
  logger.info(`Key: ${token}`);
  logger.info(`Sales Channel: ${defaultSalesChannel.name}`);
}


