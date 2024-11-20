const dotenv = require("dotenv");
dotenv.config()
const appConfigConnectionString = process.env.APPCONFIG_CONNECTION_STRING;
const appInsightsConnectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

const applicationInsights = require("applicationinsights");
applicationInsights.setup(appInsightsConnectionString).start();

const express = require("express");
const app = express();
app.use(express.json());
app.use(express.static("public"));

const { load } = require("@azure/app-configuration-provider");
const { FeatureManager, ConfigurationMapFeatureFlagProvider } = require("@microsoft/feature-management");
const { createTelemetryPublisher, trackEvent } = require("@microsoft/feature-management-applicationinsights-node");
let appConfig;
let featureManager;
async function initializeConfig() {
    appConfig = await load(appConfigConnectionString, {
        featureFlagOptions: {
            enabled: true,
            selectors: [
                {
                    keyFilter: "*"
                }
            ],
            refresh: {
                enabled: true,
                refreshIntervalInMs: 10_000
            }
        }
    });
    appConfig.onRefresh(() => {
        console.log("Config refreshed.");
    });

    featureManager = new FeatureManager(
        new ConfigurationMapFeatureFlagProvider(appConfig),
        { onFeatureEvaluated: createTelemetryPublisher(applicationInsights.defaultClient) }
    );

    // Set up periodic refresh
    setInterval(async () => {
        try {
            await appConfig.refresh();
        } catch (error) {
            console.error("Failed to refresh config:", error);
        }
    }, 10_000);
}

// Initialize the configuration and start the server
initializeConfig()
    .then(() => {
        console.log("Configuration loaded. Starting server...");
        startServer();
    })
    .catch((error) => {
        console.error("Failed to load configuration:", error);
        process.exit(1);
    });

function startServer() {
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
            name: variant?.name,
            configuration: variant?.configuration
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

    const port = process.env.PORT || "3000";
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}
