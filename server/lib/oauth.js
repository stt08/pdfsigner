const msal = require('@azure/msal-node');
require('dotenv').config();

// == == == == == == == == == == == == == == == == == == == == //

const config = {
    auth: {
        clientId: process.env.CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
        clientSecret: process.env.CLIENT_SECRET
    }
};

const scopes = ["user.read"];
const redirectUri = `http://${process.env.HOST}:${process.env.CLIENT_PORT}/api/oauth/redirect`;
const pca = new msal.ConfidentialClientApplication(config);

// == == == == == == == == == == == == == == == == == == == == //

const getAuthUrl = async (next) => {
    const authCodeUrlParameters = {
        scopes, redirectUri
    };
    const state = {
        next
    };
    return await pca.getAuthCodeUrl({...authCodeUrlParameters, state: JSON.stringify(state)});
};

const acquireTokenByCode = async (code) => {
    const tokenRequest = {
        code, scopes, redirectUri
    };

    try {
        const response = await pca.acquireTokenByCode(tokenRequest);
        console.log("\nResponse: \n:", response);
        return response;
    } catch(error) {
        console.log(error);
        return null;
    }
};

module.exports = {
    getAuthUrl,
    acquireTokenByCode
};