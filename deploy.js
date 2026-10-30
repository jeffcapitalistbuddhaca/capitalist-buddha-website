const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const { createReadStream } = require('fs');

const SITE_ID = '5a188f63-a25d-4863-80b2-f9d8ddf29009';
const API_HOST = 'api.netlify.com';

// Get list of files to deploy
function getFiles(dir, prefix = '') {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.netlify' || entry.name === 'modules' || entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(...getFiles(fullPath, relativePath));
    } else {
      files.push({ path: relativePath, file: fullPath });
    }
  }

  return files;
}

async function deployToNetlify() {
  console.log('Collecting files...');
  const files = getFiles('.');
  console.log(`Found ${files.length} files to deploy`);

  // Create manifest
  const files_to_deploy = {};
  for (const file of files) {
    const content = fs.readFileSync(file.file);
    const hash = require('crypto').createHash('sha256').update(content).digest('hex');
    files_to_deploy[file.path] = hash;
  }

  console.log('Creating deploy...');

  // Step 1: Create deploy
  const createDeployReq = https.request({
    host: API_HOST,
    path: `/api/v1/sites/${SITE_ID}/deploys`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode !== 200 && res.statusCode !== 201) {
        console.error(`Create deploy failed: ${res.statusCode}`);
        console.error(data);
        return;
      }

      const deploy = JSON.parse(data);
      console.log(`Deploy created: ${deploy.id}`);

      // Step 2: Upload files
      uploadFiles(deploy, files);
    });
  });

  createDeployReq.write(JSON.stringify({ files: files_to_deploy }));
  createDeployReq.end();
}

function uploadFiles(deploy, files) {
  let uploaded = 0;

  for (const file of files) {
    const content = fs.readFileSync(file.file);
    const hash = require('crypto').createHash('sha256').update(content).digest('hex');

    const uploadReq = https.request({
      host: API_HOST,
      path: `/api/v1/sites/${SITE_ID}/deploys/${deploy.id}/files/${encodeURIComponent(file.path)}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': content.length
      }
    }, (res) => {
      uploaded++;
      if (res.statusCode !== 200) {
        console.error(`Upload ${file.path} failed: ${res.statusCode}`);
      } else {
        console.log(`Uploaded ${uploaded}/${files.length}: ${file.path}`);
      }

      if (uploaded === files.length) {
        // Finalize deploy
        finalizeDeployment(deploy);
      }
    });

    uploadReq.write(content);
    uploadReq.end();
  }
}

function finalizeDeployment(deploy) {
  console.log('Finalizing deployment...');

  const finalizeReq = https.request({
    host: API_HOST,
    path: `/api/v1/sites/${SITE_ID}/deploys/${deploy.id}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode !== 200) {
        console.error(`Finalize failed: ${res.statusCode}`);
        console.error(data);
      } else {
        const finalDeploy = JSON.parse(data);
        console.log('✓ Deployment complete!');
        console.log(`URL: https://starlit-maamoul-d06e25.netlify.app`);
      }
    });
  });

  finalizeReq.write(JSON.stringify({}));
  finalizeReq.end();
}

deployToNetlify();
