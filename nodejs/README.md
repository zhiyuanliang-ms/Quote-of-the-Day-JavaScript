# Quote-of-the-Day-JavaScript (Node.js)

## Prerequisite

- Edit the file `.env.template`, adding the connection string to your App Configuration and Application Insights. and rename the file from `.env.template` to just `.env`. The examples will read this file automatically.

- Alternatively, you can set the environment variables to the access keys to your App Configuration store. In this case, setting up the `.env` file is not required. 
    ```bash
    npx cross-env APPCONFIG_CONNECTION_STRING="<appconfig connection string>"
    npx cross-env APPLICATIONINSIGHTS_CONNECTION_STRING="<appinsights connection string>" 
    ```

## Get started

``` bash
npm run build
npm run start
```

Tips: Username "userb@contoso.com" can get the "On" variant.