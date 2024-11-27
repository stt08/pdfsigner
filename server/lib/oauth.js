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
const pca = new msal.ConfidentialClientApplication(config);
const redirectUri = process.env.REDIRECT_URI || "http://localhost:3000/api/oauth/redirect";

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