import React from "react";
import { createContext, useState, useEffect } from "react";
import { loadFromCdn } from "@azure/app-configuration-provider";
import { FeatureManager, ConfigurationMapFeatureFlagProvider } from "@microsoft/feature-management";
import { createTelemetryPublisher } from "@microsoft/feature-management-applicationinsights-browser";
import { ApplicationInsights } from "@microsoft/applicationinsights-web";

export const AppContext = createContext();

export const ContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(undefined);
  const [lastRefresh, setLastRefresh] = useState(undefined);
  const [config, setConfig] = useState(undefined);
  const [featureManager, setFeatureManager] = useState(undefined);
  const appInsights = new ApplicationInsights({ config: {
    connectionString: "YOUR-APPINSIGHTS-CONNECTION-STRING"
  }});
  appInsights.loadAppInsights();

  useEffect(() => {
    const init = async () => {
      const appConfig = await loadFromCdn(
        "YOUR-CDN-ENDPOINT",
        {
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
        }
      );
      appConfig.onRefresh(() => {
        setLastRefresh(Date.now());
        console.log("Config refreshed.");
      });
      setConfig(appConfig);
      setLastRefresh(Date.now());
  
      const fm = new FeatureManager(
        new ConfigurationMapFeatureFlagProvider(appConfig),
        {onFeatureEvaluated: createTelemetryPublisher(appInsights)}
      );
      setFeatureManager(fm);

      // Refresh the config every 10 seconds
      setInterval(async () => {
        try {
          await appConfig.refresh();
        } catch (error) {
          console.error("Failed to refresh config:", error);
        }
      }, 10_000);
    };

    init();
  }, []);

  const loginUser = (user) => {
    setCurrentUser(user);
  };

  const logoutUser = () => {
    setCurrentUser(undefined);
  };

  return (
    <AppContext.Provider value={{ appInsights, config, featureManager, currentUser, lastRefresh, loginUser, logoutUser }}>
      {children}
    </AppContext.Provider>
  );
};
