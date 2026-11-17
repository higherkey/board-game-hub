const https = require('https');

const serviceId = process.argv[2] || 'srv-dan2r9qjnfac73f5nt4g';
const deployId = process.argv[3];
const apiKey = process.env.RENDER_API_KEY;

if (!apiKey) {
  console.error('RENDER_API_KEY missing');
  process.exit(1);
}

if (!deployId) {
  console.error('Deploy ID must be provided as argv[3]');
  process.exit(1);
}

console.log(`Monitoring Production-env deploy ${deployId} on service ${serviceId}...`);

async function getDeploy() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      path: `/v1/services/${serviceId}/deploys/${deployId}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    };
    https.get(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  for (let attempt = 1; attempt <= 60; attempt++) {
    try {
      const deploy = await getDeploy();
      const status = deploy.status;
      console.log(`[Attempt ${attempt}/60] Status: ${status}`);

      if (status === 'live') {
        console.log(`SUCCESS: Deploy ${deployId} is LIVE!`);
        process.exit(0);
      }
      if (status === 'build_failed' || status === 'update_failed' || status === 'canceled') {
        console.error(`FAILED: Deploy ${deployId} ended with status: ${status}`);
        process.exit(1);
      }
    } catch (err) {
      console.warn(`Transient check error on attempt ${attempt}: ${err.message}`);
    }

    await sleep(15000);
  }

  console.error('TIMEOUT: Deploy did not reach terminal state within 15 minutes.');
  process.exit(2);
}

main();
