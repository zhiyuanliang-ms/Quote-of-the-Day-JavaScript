import { ApplicationInsights } from '@microsoft/applicationinsights-web'

import React from 'react';
import { createContext, useState, useEffect } from 'react';
import { load } from "@azure/app-configuration-provider";
import { FeatureManager, ConfigurationMapFeatureFlagProvider } from "@microsoft/feature-management";
import { createTelemetryPublisher } from "@microsoft/feature-management-applicationinsights-browser";

export const AppContext = createContext();

export const ContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(undefined);
  const [config, setConfig] = useState(undefined);
  const [featureManager, setFeatureManager] = useState(undefined);
  const appInsights = new ApplicationInsights({ config: {
    connectionString: "YOUR-CONNECTION-STRING"
  }});
  appInsights.loadAppInsights();

  useEffect(() => {
    const init = async () => {
      const appConfig = await load(
        "YOUR-CONNECTION-STRING",
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
          },
          requestTracingOptions: {
            enabled: false
          }
        }
      );
      setConfig(appConfig);
  
      const fm = new FeatureManager(
        new ConfigurationMapFeatureFlagProvider(appConfig),
        {onFeatureEvaluated: createTelemetryPublisher(appInsights)}
      );
      setFeatureManager(fm);
    };

    init();
  }, []);

  const loginUser = (user) => {
    setCurrentUser(user);
    config.refresh();
  };

  const logoutUser = () => {
    setCurrentUser(undefined);
    config.refresh();
  };

  return (
    <AppContext.Provider value={{ appInsights, config, featureManager, currentUser, loginUser, logoutUser }}>
      {children}
    </AppContext.Provider>
  );
};