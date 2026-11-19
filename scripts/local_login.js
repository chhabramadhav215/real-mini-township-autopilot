const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { chromium } = require('playwright');

/**
 * Local Login Setup for Google Flow / Veo
 * Opens a persistent browser window using Chrome or Chromium so the user
 * can authenticate once with their Google AI Pro account.
 * All cookies and local state are stored securely in .browser_profile (gitignored).
 */
async function runLoginSetup() {
  const profileDir = path.resolve(__dirname, '..', '.browser_profile');
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  const targetUrl = process.env.GOOGLE_FLOW_URL || 'https://labs.google/fx/tools/flow';

  console.log(`\n======================================================`);
  console.log(`GOOGLE FLOW / VEO LOCAL LOGIN SETUP (WINDOWS 11)`);
  console.log(`======================================================`);
  console.log(`Persistent Profile Directory: ${profileDir}`);
  console.log(`Target URL:                   ${targetUrl}`);
  console.log(`Security:                     Profile is strictly in .gitignore`);
  console.log(`======================================================\n`);
  console.log(`[1/3] Launching browser window...`);
  console.log(`[2/3] Please log into your Google Account with Google AI Pro / Veo access.`);
  console.log(`[3/3] Once you see Google Flow, return to this terminal and press ENTER (or close browser).\n`);

  let context;
  try {
    // Try launching system Chrome first so native credentials/profiles are familiar
    context = await chromium.launchPersistentContext(profileDir, {
      channel: 'chrome',
      headless: false,
      viewport: null,
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox'
      ]
    });
    console.log(`[Browser] Launched via native Google Chrome.`);
  } catch (err) {
    console.warn(`[Browser] Notice: Native Chrome launch note: ${err.message}.`);
    console.log(`[Browser] Launching with bundled Chromium engine...`);
    context = await chromium.launchPersistentContext(profileDir, {
      headless: false,
      viewport: null,
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox'
      ]
    });
  }

  const pages = context.pages();
  const page = pages.length > 0 ? pages[0] : await context.newPage();

  console.log(`[Browser] Navigating to ${targetUrl}...`);
  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  } catch (e) {
    console.log(`[Browser] Navigation notice (${e.message}). You can finish navigating in the open browser.`);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    let finished = false;

    const cleanup = async () => {
      if (finished) return;
      finished = true;
      console.log(`\n[Login Setup] Saving persistent profile and closing browser...`);
      try {
        await context.close();
      } catch (e) {}
      rl.close();
      console.log(`\n======================================================`);
      console.log(`LOGIN SETUP COMPLETE!`);
      console.log(`Session saved in: ${profileDir}`);
      console.log(`You can now run:  npm run local:auto`);
      console.log(`======================================================\n`);
      resolve();
    };

    context.on('close', cleanup);

    rl.question('Press ENTER here once you have finished logging in to save your session: ', () => {
      cleanup();
    });
  });
}

if (require.main === module) {
  runLoginSetup().catch((err) => {
    console.error('Login setup error:', err);
    process.exit(1);
  });
}

module.exports = { runLoginSetup };
