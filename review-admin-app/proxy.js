// Shopify OAuth Proxy Server for Local Development
// Handles OAuth flow and GraphQL/REST API proxying

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = 3001;

// In-memory store for OAuth states (in production, use Redis or database)
const oauthStates = new Map();

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'OAuth Proxy Server Running',
    endpoints: [
      '/auth/start - Start OAuth flow',
      '/auth/callback - OAuth callback',
      '/shopify/graphql - GraphQL proxy'
    ]
  });
});

// Start OAuth flow
app.get('/auth/start', (req, res) => {
  const { shop, client_id } = req.query;

  if (!shop || !client_id) {
    return res.status(400).json({
      error: 'Missing shop or client_id'
    });
  }

  // Generate random state for security
  const state = crypto.randomBytes(16).toString('hex');
  oauthStates.set(state, { shop, created: Date.now() });

  // Clean old states (older than 10 minutes)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [key, value] of oauthStates) {
    if (value.created < tenMinutesAgo) {
      oauthStates.delete(key);
    }
  }

  const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/+$/, '');

  // Build OAuth URL
  const scopes = 'read_products,read_metaobjects,write_metaobjects,read_files,write_files';
  // Use a known allowed URL format for local development
  // The app URL in Shopify Partners should be set to: http://localhost:3001
  const redirectUri = `http://localhost:${PORT}/auth/callback`;

  const oauthUrl = `https://${cleanShop}/admin/oauth/authorize?` +
    `client_id=${client_id}&` +
    `scope=${scopes}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}`;

  console.log('[OAuth] Starting OAuth flow for shop:', cleanShop);
  res.json({ oauthUrl, state });
});

// OAuth callback
app.get('/auth/callback', async (req, res) => {
  const { code, state, shop, error, error_description } = req.query;

  if (error) {
    console.error('[OAuth] Error:', error, error_description);
    return res.status(400).json({ error, error_description });
  }

  // Verify state
  if (!oauthStates.has(state)) {
    return res.status(400).json({
      error: 'Invalid or expired state parameter'
    });
  }

  oauthStates.delete(state);

  // Get client credentials from request or environment
  // For security, the client should send these via POST to exchange endpoint
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>OAuth Success</title>
      <style>
        body { font-family: sans-serif; padding: 40px; text-align: center; }
        .code { background: #f5f5f5; padding: 20px; border-radius: 8px; word-break: break-all; }
        .success { color: green; font-size: 24px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="success">✓ Authorization successful!</div>
      <p>Copy this code and paste it in your app:</p>
      <div class="code">${code}</div>
      <p style="margin-top: 20px; color: #666;">You can close this window and return to the app.</p>
    </body>
    </html>
  `);
});

// Exchange code for access token
app.post('/auth/exchange', async (req, res) => {
  const { code, client_id, client_secret, shop } = req.body;

  if (!code || !client_id || !client_secret || !shop) {
    return res.status(400).json({
      error: 'Missing required fields: code, client_id, client_secret, shop'
    });
  }

  const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/+$/, '');

  try {
    console.log(`[OAuth] Exchanging code for token: ${cleanShop}`);

    const response = await fetch(`https://${cleanShop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code,
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('[OAuth] Shopify error:', response.status, responseText.substring(0, 500));
      return res.status(response.status).json({
        error: 'Token exchange failed',
        details: responseText
      });
    }

    const data = JSON.parse(responseText);
    console.log('[OAuth] Token exchange successful');
    res.json(data);
  } catch (error) {
    console.error('[OAuth] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GraphQL proxy
app.post('/shopify/graphql', async (req, res) => {
  const { access_token, shop, query, variables } = req.body;

  if (!access_token || !shop || !query) {
    return res.status(400).json({
      error: 'Missing required fields: access_token, shop, query'
    });
  }

  const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/+$/, '');

  try {
    const response = await fetch(`https://${cleanShop}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[Proxy] GraphQL Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// File upload endpoint
app.post('/shopify/upload', async (req, res) => {
  const { access_token, shop, filename, mimeType, base64Data } = req.body;

  if (!access_token || !shop || !filename || !base64Data) {
    return res.status(400).json({
      error: 'Missing required fields: access_token, shop, filename, base64Data'
    });
  }

  const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/+$/, '');

  try {
    console.log(`[Upload] Starting upload for: ${filename}`);

    // Decode base64 to buffer
    const fileBuffer = Buffer.from(base64Data, 'base64');
    const fileSize = fileBuffer.length;
    console.log(`[Upload] File: ${filename}, Size: ${fileSize}, Type: ${mimeType}`);

    // Step 1: Create staged upload
    const stagedUploadMutation = `
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const stagedResponse = await fetch(`https://${cleanShop}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: stagedUploadMutation,
        variables: {
          input: [{
            resource: "IMAGE",
            filename: filename,
            mimeType: mimeType || "image/jpeg",
            fileSize: fileSize.toString(),
            httpMethod: "POST"
          }]
        }
      }),
    });

    const stagedData = await stagedResponse.json();
    console.log('[Upload] Staged upload response:', JSON.stringify(stagedData, null, 2));

    if (stagedData.errors || stagedData.data?.stagedUploadsCreate?.userErrors?.length > 0) {
      const errors = stagedData.errors || stagedData.data?.stagedUploadsCreate?.userErrors || [{ message: 'Unknown error' }];
      console.error('[Upload] Staged upload creation failed:', errors);
      return res.status(400).json({ error: 'Failed to create staged upload', details: errors });
    }

    if (!stagedData.data?.stagedUploadsCreate?.stagedTargets?.[0]) {
      console.error('[Upload] No staged targets returned');
      return res.status(400).json({ error: 'No staged targets returned', details: stagedData });
    }

    const target = stagedData.data.stagedUploadsCreate.stagedTargets[0];
    const { url, resourceUrl, parameters } = target;

    // Step 2: Upload file to staged URL (Google Cloud Storage)
    // Build multipart/form-data manually
    const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
    let body = '';

    // Add all parameters from staged upload
    parameters.forEach(param => {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="${param.name}"\r\n\r\n`;
      body += `${param.value}\r\n`;
    });

    // Add file
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
    body += `Content-Type: ${mimeType || 'image/jpeg'}\r\n\r\n`;

    const bodyBuffer = Buffer.concat([
      Buffer.from(body, 'utf8'),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
    ]);

    const uploadResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: bodyBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[Upload] File upload failed:', errorText);
      return res.status(400).json({ error: 'Failed to upload file', details: errorText });
    }

    console.log('[Upload] File uploaded to GCS successfully');
    console.log('[Upload] Resource URL:', resourceUrl);

    // Step 3: Create file in Shopify using the resourceUrl
    const fileMutation = `
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            alt
            createdAt
            updatedAt
            preview {
              image {
                url
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const fileResponse = await fetch(`https://${cleanShop}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: fileMutation,
        variables: {
          files: [{
            alt: filename,
            contentType: 'IMAGE',
            originalSource: resourceUrl
          }]
        }
      }),
    });

    const fileData = await fileResponse.json();
    console.log('[Upload] File create response:', JSON.stringify(fileData, null, 2));

    if (fileData.errors || fileData.data?.fileCreate?.userErrors?.length > 0) {
      const errors = fileData.errors || fileData.data?.fileCreate?.userErrors;
      console.error('[Upload] File creation failed:', errors);
      return res.status(400).json({ error: 'Failed to create file', details: errors });
    }

    const file = fileData.data.fileCreate.files[0];
    const fileUrl = file.preview?.image?.url || resourceUrl;
    console.log('[Upload] Upload successful:', fileUrl);

    res.json({
      success: true,
      file: {
        id: file.id,
        url: fileUrl,
        previewUrl: file.preview?.image?.url
      }
    });

  } catch (error) {
    console.error('[Upload] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           Shopify OAuth Proxy Server                       ║
╠════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                ║
║                                                            ║
║  OAuth Flow:                                               ║
║    1. POST /auth/start  - Get OAuth URL                    ║
║    2. User visits OAuth URL & authorizes                   ║
║    3. User copies code from callback page                  ║
║    4. POST /auth/exchange - Exchange code for token        ║
║                                                            ║
║  To start:                                                 ║
║    1. node proxy.js     (this server)                      ║
║    2. npm run dev       (React app on port 3000)           ║
╚════════════════════════════════════════════════════════════╝
  `);
});
