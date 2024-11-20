import * as dotenv from "dotenv";
dotenv.config()
const appConfigConnectionString = process.env.APPCONFIG_CONNECTION_STRING;
const appInsightsConnectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

import applicationInsights from "applicationinsights";
applicationInsights.setup(appInsightsConnectionString).start();

import path from "path";
import { fileURLToPath } from "url";
import express from "express";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));

import { load } from "@azure/app-configuration-provider";
import { FeatureManager, ConfigurationMapFeatureFlagProvider } from "@microsoft/feature-management";
import { createTelemetryPublisher, trackEvent } from "@microsoft/feature-management-applicationinsights-node";
const appConfig = await load(appConfigConnectionString, {
    featureFlagOptions: {
        enabled: true,
        selectors: [{
            keyFilter: "*"
        }],
        refresh: {
            enabled: true,
            refreshIntervalInMs: 10_000
        }
    }
});

const featureManager = new FeatureManager(
    new ConfigurationMapFeatureFlagProvider(appConfig),
    {onFeatureEvaluated: createTelemetryPublisher(applicationInsights.defaultClient)});

// Refresh the config every 10 seconds
setInterval(async () => {
    try {
        await appConfig.refresh();
    } catch (error) {
        console.error("Failed to refresh config:", error);
    }
}, 10_000);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("/api/config", (req, res) => {
    res.json(appConfig.constructConfigurationObject());
})

app.get("/api/variant", async (req, res) => {
    const { userId, groups } = req.query;
    if (userId === undefined && groups === undefined) {
        return res.status(400).send({ error: "userId and groups are required" });
    }
    const variant = await featureManager.getVariant("Greeting", { userId: userId, groups: groups ? groups.split(",") : []});
    res.status(200).send({
        variant: variant?.name
    });
})

app.post("/api/logEvent", (req, res) => {
    const { TargetingId } = req.body;
    if (TargetingId === undefined) {
        return res.status(400).send({ error: "TargetingId is required" });
    }
    trackEvent(applicationInsights.defaultClient, TargetingId, { name: "Like" });
    res.status(200).send({ message: "Event logged successfully" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
