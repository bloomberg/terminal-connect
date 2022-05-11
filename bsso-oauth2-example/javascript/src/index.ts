import dotenv = require('dotenv');
import https from 'https';

async function HttpsPost(hostname: string | null, path: string, body: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: hostname,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Content-Length': body.length,
        },
      };
      const req = https.request(options, resp => {
        let data = '';
        resp.on('data', chunk => {
          data += chunk;
        });
        resp.on('end', () => {
          if (resp.statusCode == 200) {
            resolve(data);
          } else {
            const msg = `Response statusCode is not 200. statusCode: ${resp.statusCode} **** body **** ${data}`;
            reject(msg);
          }
        });
      });
      req.on('error', error => {
        reject(error);
      });
      req.write(body);
      req.end();
    });
  }

interface OAuth2HttpResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

async function getMyToken() {
  dotenv.config();
  const client_id = process.env.CLIENT_ID ?? '';
  const client_secret = process.env.CLIENT_SECRET ?? '';
  const scope = process.env.CLIENT_SCOPE ?? '';

  if (!client_id || !client_secret || !scope) {
    throw new Error('Missing one or more environment variables CLIENT_ID, CLIENT_SECRET, CLIENT_SCOPE');
  }

  const bloombergIdp = process.env.BLOOMBERG_IDP ?? '';
  const oauthTokenParams: any = {
    grant_type: 'client_credentials',
    scope,
    client_id,
    client_secret,
  };

  let jwt = '';
  try {
    const requestBody = Object.keys(oauthTokenParams)
      .map(key => key + '=' + encodeURIComponent(oauthTokenParams[key]))
      .join('&');
    let response = await HttpsPost(bloombergIdp, '/as/token.oauth2', requestBody);
    const responseJson: OAuth2HttpResponse = JSON.parse(response);
    jwt = responseJson.access_token;
  } catch (err) {
    console.error(`Request failed because of error: ${JSON.stringify(err)}`);
  }

  console.log('A token was successfully returned.');
  return;

}

getMyToken();
