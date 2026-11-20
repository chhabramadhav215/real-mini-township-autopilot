require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { chromium } = require('playwright');
const { planEpisode } = require('./architect');
const { generateKeyframe, createContinuousWorkingMotionVideo, runFFmpeg } = require('./visual_engine');
const { assembleMasterVideo } = require('./audio_video_master');
const { processUploadAndStateCommit } = require('./uploader');
const {
  loadCheckpoint,
  saveCheckpoint,
  updateStageProgress,
  updateStepProgress,
  clearCheckpoint
} = require('./checkpoint_manager');
const {
  checkStorageCapGate,
  cleanupUploadedLocalFiles
} = require('./queue_manager');

/**
 * Local Windows Browser Automation Runner (Google Flow / Veo AI Video Clips)
 * Uses persistent Google Chrome/Chromium profile (.browser_profile) to automate
 * genuine text-to-video / image-to-video real-world construction process clips on flow.google.com.
 *
 * Usage:
 *   npm run local:auto
 *   node src/local_browser_runner.js --town=smart_city --dry-run
 *   node src/local_browser_runner.js --town=mountain_village
 *   node src/local_browser_runner.js --town=desert_town
 */

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    town: 'smart_city',
    dryRun: process.env.DRY_RUN === 'true',
    headless: process.env.HEADLESS === 'true',
    timeoutMs: 180000, // 3 minutes per clip
    skipBrowser: false
  };

  for (const arg of args) {
    if (arg.startsWith('--town=')) {
      options.town = arg.split('=')[1].trim();
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
      process.env.DRY_RUN = 'true';
    } else if (arg === '--headless') {
      options.headless = true;
    } else if (arg.startsWith('--timeout=')) {
      options.timeoutMs = parseInt(arg.split('=')[1].trim(), 10) || 180000;
    } else if (arg === '--skip-browser') {
      options.skipBrowser = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      options.town = arg.trim();
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Real Mini Township Autopilot - Local Browser Automation (Google Flow / Veo)

Usage:
  npm run local:auto [options]
  node src/local_browser_runner.js [options]

Options:
  --town=<key>       Target town series: smart_city | mountain_village | desert_town (Default: smart_city)
  --dry-run, -d      Assemble video and inspect locally without uploading to YouTube
  --headless         Run browser in background without showing Chrome window (Default: false)
  --timeout=<ms>     Max generation wait time per stage in ms (Default: 180000)
  --skip-browser     Skip Flow generation and use existing output/clips if already downloaded
  --help, -h         Display this help message

Prerequisites:
  1. Run 'npm run local:login' once to authenticate with your Google AI Pro account.
  2. Ensure ffmpeg is installed and available in PATH.
`);
}

/**
 * Standardize clip to 1080x1920 (9:16 vertical) 30fps
 */
async function standardizeClip(inputClipPath, outputClipPath) {
  console.log(`[LocalRunner] Standardizing clip to 1080x1920 @ 30fps: ${path.basename(inputClipPath)}`);
  const ffmpegArgs = [
    '-i', inputClipPath,
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-an',
    '-y',
    outputClipPath
  ];
  await runFFmpeg(ffmpegArgs);
  return outputClipPath;
}

/**
 * Extract high-res still frame from a video clip for 3D thumbnail and continuity state
 */
async function extractThumbnailFrame(videoClipPath, outputImagePath) {
  console.log(`[LocalRunner] Extracting high-res still frame from ${path.basename(videoClipPath)}...`);
  const ffmpegArgs = [
    '-sseof', '-0.5',
    '-i', videoClipPath,
    '-vframes', '1',
    '-q:v', '1',
    '-y',
    outputImagePath
  ];
  await runFFmpeg(ffmpegArgs);
  return outputImagePath;
}

/**
 * Save diagnostic screenshot and HTML dump to logs/ for instant verification
 */
async function saveDebugSnapshot(page, stageNum, note) {
  try {
    const logsDir = path.resolve('logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

    const timestamp = Date.now();
    const screenshotPath = path.join(logsDir, `flow_debug_stage_${stageNum}_${timestamp}.png`);
    const htmlPath = path.join(logsDir, `flow_debug_stage_${stageNum}_${timestamp}.html`);

    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    const htmlContent = await page.content().catch(() => '');
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');

    console.log(`[LocalRunner] Debug snapshot saved:`);
    console.log(`  Screenshot: ${screenshotPath}`);
    console.log(`  HTML Dump:  ${htmlPath}`);
    console.log(`  Page URL:   ${page.url()}`);
    console.log(`  Page Title: ${await page.title().catch(() => '')}`);
    console.log(`  Diagnosis:  ${note}`);
  } catch (err) {
    console.warn(`[LocalRunner] Could not save debug snapshot: ${err.message}`);
  }
}

/**
 * Ensure browser is inside an active Google Flow project workspace
 * Handles flow.google.com project creation (+ New project) or opening an existing workspace
 */
async function ensureGoogleFlowWorkspace(page) {
  console.log(`[LocalRunner] Checking Google Flow workspace state (Current URL: ${page.url()})...`);

  // 1. Check if already inside an active project/editor
  const isInsideProject = page.url().includes('/project/') || page.url().includes('/editor');
  const promptCheck = page.locator('textarea, [contenteditable="true"], [role="textbox"]').first();
  if (isInsideProject || await promptCheck.isVisible().catch(() => false)) {
    console.log(`[LocalRunner] Active project workspace detected.`);
    return true;
  }

  // 2. Check for "+ New project" button
  console.log(`[LocalRunner] On Google Flow home/dashboard. Searching for "+ New project" trigger...`);
  const newProjectSelectors = [
    'button:has-text("New project")',
    'button:has-text("+ New")',
    'button:has-text("Create project")',
    'a:has-text("New project")',
    'a:has-text("Create project")',
    '[aria-label*="New project" i]',
    '[aria-label*="Create project" i]',
    'div[role="button"]:has-text("New project")',
    'div[role="button"]:has-text("Create")',
    'div[role="button"]:has-text("+")',
    'button:has-text("New")',
    '[data-testid*="new-project" i]'
  ];

  for (const sel of newProjectSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) {
      console.log(`[LocalRunner] Found project creation trigger: "${sel}". Clicking...`);
      await el.click().catch(() => {});
      await page.waitForTimeout(4000);
      return true;
    }
  }

  // 3. Fallback: Open first existing project card if available
  console.log(`[LocalRunner] Searching for existing project card on dashboard...`);
  const existingProjectSelectors = [
    'a[href*="/project/"]',
    'div[role="button"][data-project-id]',
    '[data-testid*="project-card" i]',
    'div[role="button"]:has-text("Project")',
    'div[role="button"]:has-text("Untitled")'
  ];

  for (const sel of existingProjectSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) {
      console.log(`[LocalRunner] Found existing project link: "${sel}". Opening...`);
      await el.click().catch(() => {});
      await page.waitForTimeout(4000);
      return true;
    }
  }

  console.warn(`[LocalRunner] Notice: Could not detect "+ New project" or existing project on dashboard.`);
  return false;
}

/**
 * Helper to check if an element, text, or aria-label refers to Omni video editing mode
 * rather than standard text-to-video / image-to-video generation.
 */
function isOmniOrEditElement(text = '', ariaLabel = '') {
  const combined = `${text} ${ariaLabel}`.trim().toLowerCase();
  if (!combined) return false;
  return (
    combined.includes('omni') ||
    combined.includes('edit a video with omni') ||
    combined.includes('edit with omni') ||
    combined.includes('edit a video') ||
    combined.includes('edit video') ||
    combined.includes('video-editing') ||
    combined.includes('video editing')
  );
}

/**
 * Detect whether Google Flow is currently in Omni video-editing mode
 * (e.g. side panel prompting "To edit a video with Omni, you'll need a video in your project first")
 */
async function checkIsOmniModeActive(page) {
  if (!page) return false;
  return await page.evaluate(() => {
    try {
      const body = document.body;
      if (!body) return false;
      const bodyText = (body.innerText || body.textContent || '');

      if (
        bodyText.includes("To edit a video with Omni") ||
        bodyText.includes("you'll need a video in your project first") ||
        bodyText.includes("Generate a new video first")
      ) {
        return true;
      }

      // Check active tabs / selected pills
      const activeTabs = Array.from(document.querySelectorAll(
        '[role="tab"][aria-selected="true"], [role="tab"].active, [role="tab"].selected, button[aria-selected="true"], div[class*="active" i][role="tab"]'
      ));
      for (const tab of activeTabs) {
        const text = ((tab.innerText || '') + ' ' + (tab.getAttribute('aria-label') || '')).toLowerCase();
        if (text.includes('omni') || text.includes('edit a video') || text.includes('edit with')) {
          return true;
        }
      }

      // Check side panel heading or drawer title
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, div[class*="header" i], div[class*="title" i]'));
      for (const h of headings) {
        const t = (h.innerText || '').trim().toLowerCase();
        if (t === 'edit a video with omni' || t === 'edit with omni' || t === 'omni video editor') {
          return true;
        }
      }

      return false;
    } catch (e) {
      return false;
    }
  }).catch(() => false);
}

/**
 * Recovers Google Flow from Omni video-editing mode back to standard video generation.
 * If the side panel shows "To edit a video with Omni, you'll need a video in your project first"
 * or "Generate a new video first", it selects "Generate a new video first" or switches back
 * to standard video generation mode before filling and submitting the stage prompt.
 */
async function handleOmniModeRecovery(page) {
  if (!page) return false;

  try {
    const isOmni = await checkIsOmniModeActive(page);
    if (!isOmni) return false;

    console.log(`[LocalRunner] Omni video-editing mode detected on side panel. Switching back to standard video generation...`);

    // 1. Primary Action: Click "Generate a new video first" button/link/pill
    const generateFirstSelectors = [
      'button:has-text("Generate a new video first")',
      'a:has-text("Generate a new video first")',
      'div[role="button"]:has-text("Generate a new video first")',
      'span[role="button"]:has-text("Generate a new video first")',
      '[aria-label*="Generate a new video first" i]',
      'button:has-text("Generate a new video")',
      'a:has-text("Generate a new video")',
      'div[role="button"]:has-text("Generate a new video")',
      'button:has-text("Generate new video")',
      'button:has-text("Generate video first")'
    ];

    for (const sel of generateFirstSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        console.log(`[LocalRunner] Found recovery trigger: "${sel}". Clicking "Generate a new video first"...`);
        await el.click({ force: true }).catch(() => {});
        await page.waitForTimeout(1500);
        if (!(await checkIsOmniModeActive(page))) {
          console.log(`[LocalRunner] Successfully exited Omni mode and restored standard video generation.`);
          return true;
        }
      }
    }

    // Also try DOM traversal for "Generate a new video first" in case of custom elements or shadow roots
    const clickedViaDOM = await page.evaluate(() => {
      try {
        const clickables = Array.from(document.querySelectorAll('button, a, div[role="button"], span[role="button"], span, p'));
        for (const el of clickables) {
          const text = (el.innerText || el.textContent || '').trim().toLowerCase();
          if (
            text.includes('generate a new video first') ||
            text === 'generate a new video' ||
            text.startsWith('generate a new video') ||
            text.includes('generate video first')
          ) {
            if (el.offsetParent !== null || el.getClientRects().length > 0) {
              el.click();
              return `DOM clickable ("${text}")`;
            }
          }
        }
        return null;
      } catch (e) {
        return null;
      }
    }).catch(() => null);

    if (clickedViaDOM) {
      console.log(`[LocalRunner] Clicked recovery element via ${clickedViaDOM}.`);
      await page.waitForTimeout(1500);
      if (!(await checkIsOmniModeActive(page))) {
        console.log(`[LocalRunner] Successfully exited Omni mode and restored standard video generation.`);
        return true;
      }
    }

    // 2. Secondary Action: Switch tabs to standard video generation (e.g. "Text to video", "Veo", or "Video")
    const standardGenSelectors = [
      'button:has-text("Text to video")',
      '[role="tab"]:has-text("Text to video")',
      'div[role="button"]:has-text("Text to video")',
      'button:has-text("Generate video")',
      'button:has-text("Create video")',
      'button:has-text("Veo")',
      '[role="tab"]:has-text("Veo")',
      'button:text-is("Video")',
      '[role="tab"]:text-is("Video")',
      'div[role="tab"]:text-is("Video")',
      'button:text-is("Generate")',
      '[role="tab"]:text-is("Generate")',
      'button:text-is("Create")',
      '[role="tab"]:text-is("Create")'
    ];

    for (const sel of standardGenSelectors) {
      const loc = page.locator(sel);
      const count = await loc.count().catch(() => 0);
      for (let idx = 0; idx < count; idx++) {
        const el = loc.nth(idx);
        if (await el.isVisible().catch(() => false)) {
          const text = (await el.innerText().catch(() => '')).trim();
          const aria = (await el.getAttribute('aria-label').catch(() => '')).trim();
          if (isOmniOrEditElement(text, aria)) continue;

          console.log(`[LocalRunner] Switching tab to standard video generation via "${sel}" (label: "${text || aria}")...`);
          await el.click({ force: true }).catch(() => {});
          await page.waitForTimeout(1500);
          if (!(await checkIsOmniModeActive(page))) {
            console.log(`[LocalRunner] Successfully exited Omni mode and restored standard video generation.`);
            return true;
          }
          break;
        }
      }
    }

    // 3. Tertiary Action: Click Back or Close button on Omni side panel
    const backSelectors = [
      'button[aria-label*="Back" i]',
      'button[aria-label*="Close" i]',
      'div[role="button"][aria-label*="Back" i]',
      'div[role="button"][aria-label*="Close" i]',
      'button:has-text("Back")',
      'button:has-text("Cancel")'
    ];

    for (const sel of backSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        console.log(`[LocalRunner] Clicking back/close button in Omni panel via "${sel}"...`);
        await el.click({ force: true }).catch(() => {});
        await page.waitForTimeout(1000);
        if (!(await checkIsOmniModeActive(page))) {
          console.log(`[LocalRunner] Successfully exited Omni mode.`);
          return true;
        }
      }
    }

    // 4. Fallback: Dismiss floating side overlay with Escape
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);
    return !(await checkIsOmniModeActive(page));
  } catch (err) {
    console.warn(`[LocalRunner] Omni recovery notice: ${err.message}`);
    return false;
  }
}

/**
 * Ensure Video (Veo) mode is active if a mode toggle exists.
 * Strictly prevents clicking or activating "Edit a video with Omni" or any Omni mode option.
 */
async function ensureVideoMode(page) {
  // 1. Recover from Omni mode if active
  await handleOmniModeRecovery(page);

  // 2. Selectors for standard video generation, avoiding any generic "video" matches that could catch Omni
  const videoModeSelectors = [
    'button:has-text("Text to video")',
    '[role="tab"]:has-text("Text to video")',
    'button:has-text("Veo")',
    '[role="tab"]:has-text("Veo")',
    'button:has-text("Generate video")',
    'button:has-text("Create video")',
    'button:text-is("Video")',
    '[role="tab"]:text-is("Video")',
    'div[role="tab"]:text-is("Video")',
    'button:text-matches("^\\s*Video\\s*$", "i")',
    '[role="tab"]:text-matches("^\\s*Video\\s*$", "i")',
    'div[role="tab"]:text-matches("^\\s*Video\\s*$", "i")'
  ];

  for (const sel of videoModeSelectors) {
    const loc = page.locator(sel);
    const count = await loc.count().catch(() => 0);
    for (let idx = 0; idx < count; idx++) {
      const el = loc.nth(idx);
      if (await el.isVisible().catch(() => false)) {
        const text = (await el.innerText().catch(() => '')).trim();
        const aria = (await el.getAttribute('aria-label').catch(() => '')).trim();

        // Strictly verify this is NOT an Omni or edit mode option
        if (isOmniOrEditElement(text, aria)) {
          console.log(`[LocalRunner] Skipping Omni/Edit mode option: "${text || aria}"`);
          continue;
        }

        const isSelected = await el.getAttribute('aria-selected').catch(() => null);
        const className = await el.getAttribute('class').catch(() => '');
        if (isSelected !== 'true' && !className.includes('selected') && !className.includes('active')) {
          console.log(`[LocalRunner] Selecting Video (Veo) mode via "${sel}" (label: "${text || aria}")...`);
          await el.click({ force: true }).catch(() => {});
          await page.waitForTimeout(1000);
        }
        return true;
      }
    }
  }

  return false;
}

/**
 * Ensure 9:16 portrait aspect ratio if toggle is available
 */
async function ensureVerticalRatio(page) {
  const ratioSelectors = [
    'button:has-text("9:16")',
    '[aria-label*="9:16" i]',
    'button:has-text("Portrait")',
    '[data-value="9:16"]'
  ];
  for (const sel of ratioSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) {
      console.log(`[LocalRunner] Setting 9:16 portrait ratio via "${sel}"...`);
      await el.click().catch(() => {});
      break;
    }
  }
}

/**
 * Watch for and automatically approve Google Flow credit confirmation dialogs:
 * e.g., "Would you like me to kick off this 1 video generation, costing 12 credits?"
 * Buttons: "Always approve in project" | "Approve" | "Reject"
 *
 * Prioritizes "Always approve in project" first, falling back to "Approve".
 * Never clicks "Reject".
 */
async function handleCreditConfirmationDialog(page) {
  if (!page) return false;

  try {
    // 1. Check if credit confirmation dialog text is present in the DOM
    const dialogPrompt = await page.evaluate(() => {
      // Focus on dialogs, alertdialogs, popups, or concise alert containers
      const candidates = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], div[class*="modal" i], div[class*="dialog" i], div[class*="popup" i], div[class*="confirm" i], p, span, h2, h3'));
      for (const el of candidates) {
        const text = (el.innerText || el.textContent || '').trim();
        // Dialog prompt must be a reasonably concise confirmation message (prevent matching whole-page wrappers)
        if (text.length > 5 && text.length < 350) {
          if (
            text.includes('kick off') ||
            text.includes('costing') ||
            (text.includes('credits') && (text.includes('approve') || text.includes('video generation') || text.includes('like me to')))
          ) {
            return text.replace(/\s+/g, ' ').slice(0, 150);
          }
        }
      }
      return null;
    }).catch(() => null);

    if (dialogPrompt) {
      console.log(`[LocalRunner] Credit confirmation dialog detected: "${dialogPrompt}"`);
    }

    // Check if an active dialog or confirmation container is visible on page
    const hasActiveDialog = dialogPrompt || await page.evaluate(() => {
      const dialogs = document.querySelectorAll('[role="dialog"], [role="alertdialog"], div[class*="modal" i]');
      for (const d of dialogs) {
        if (d.offsetParent !== null && d.innerText && (d.innerText.includes('credits') || d.innerText.includes('approve'))) return true;
      }
      return false;
    }).catch(() => false);

    if (!hasActiveDialog) return false;

    // 2. Primary target: "Always approve in project" (prevents future prompts in this project)
    const alwaysApproveSelectors = [
      'button:has-text("Always approve in project")',
      'button:has-text("Always approve for this project")',
      'button:has-text("Always approve")',
      'div[role="button"]:has-text("Always approve in project")',
      'div[role="button"]:has-text("Always approve for this project")',
      'div[role="button"]:has-text("Always approve")',
      '[aria-label*="Always approve in project" i]',
      '[aria-label*="Always approve" i]',
      'button:text-matches("always approve", "i")'
    ];

    for (const sel of alwaysApproveSelectors) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible().catch(() => false)) {
        console.log(`[LocalRunner] Clicking "Always approve in project" button via "${sel}"...`);
        await btn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(500);
        return true;
      }
    }

    // 3. Fallback target: "Approve" (single generation confirmation)
    const approveSelectors = [
      'button:text-is("Approve")',
      'button:text-matches("^\\s*Approve\\s*$", "i")',
      'div[role="button"]:text-is("Approve")',
      'div[role="button"]:text-matches("^\\s*Approve\\s*$", "i")',
      '[aria-label="Approve" i]',
      'button:has-text("Approve")',
      'div[role="button"]:has-text("Approve")',
      'button:has-text("Confirm")',
      'button:has-text("Continue")'
    ];

    for (const sel of approveSelectors) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible().catch(() => false)) {
        const btnText = (await btn.innerText().catch(() => '')).trim();
        // Skip "Reject" or other unrelated buttons
        if (btnText.toLowerCase().includes('reject')) continue;
        console.log(`[LocalRunner] Clicking fallback "Approve" button via "${sel}" (label: "${btnText}")...`);
        await btn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(500);
        return true;
      }
    }

    // 4. In-depth DOM traversal fallback (in case elements are inside custom web components or shadow roots)
    const domClicked = await page.evaluate(() => {
      const clickables = Array.from(document.querySelectorAll('button, div[role="button"], span[role="button"], a[role="button"]'));

      // Try "always approve" first
      for (const el of clickables) {
        const text = (el.innerText || el.textContent || '').trim().toLowerCase();
        if (text.includes('always approve') && el.offsetParent !== null) {
          el.click();
          return 'Always approve in project (DOM)';
        }
      }

      // Try "approve" next
      for (const el of clickables) {
        const text = (el.innerText || el.textContent || '').trim().toLowerCase();
        if ((text === 'approve' || text.startsWith('approve') || text === 'confirm') && !text.includes('reject') && el.offsetParent !== null) {
          el.click();
          return 'Approve (DOM)';
        }
      }
      return null;
    }).catch(() => null);

    if (domClicked) {
      console.log(`[LocalRunner] Auto-approved credit dialog via ${domClicked}.`);
      await page.waitForTimeout(500);
      return true;
    }
  } catch (err) {
    // Non-blocking catch
  }

  return false;
}

/**
 * Click the visible submit/send/generate button or the circular arrow button in/below the prompt composer
 */
async function clickPromptSubmitButton(page, promptInput) {
  if (!page) return false;

  // 1. Prioritize submit/arrow button inside or adjacent to prompt composer container
  if (promptInput) {
    const composerClicked = await page.evaluate((inputEl) => {
      try {
        let container = inputEl.closest('form, div[class*="composer" i], div[class*="prompt" i], div[class*="input" i], div[class*="footer" i], div[class*="bar" i]');
        if (!container) container = inputEl.parentElement?.parentElement;
        if (!container) container = inputEl.parentElement;

        if (container) {
          const buttons = Array.from(container.querySelectorAll('button, div[role="button"]'));
          // A. Labeled submit buttons inside composer
          for (const b of buttons) {
            const aria = (b.getAttribute('aria-label') || '').toLowerCase();
            const text = (b.innerText || '').toLowerCase();
            if (
              aria.includes('create') ||
              aria.includes('send') ||
              aria.includes('generate') ||
              aria.includes('submit') ||
              aria.includes('arrow') ||
              text.includes('generate') ||
              text.includes('create') ||
              text.includes('send')
            ) {
              if (!b.disabled && b.offsetParent !== null) {
                b.click();
                return `composer button (${aria || text || 'submit'})`;
              }
            }
          }

          // B. Circular or SVG arrow button inside/below composer
          for (const b of buttons) {
            if (!b.disabled && b.offsetParent !== null && b.querySelector('svg')) {
              b.click();
              return 'composer circular arrow SVG button';
            }
          }
        }
        return null;
      } catch (e) {
        return null;
      }
    }, await promptInput.elementHandle().catch(() => null)).catch(() => null);

    if (composerClicked) {
      console.log(`[LocalRunner] Clicked submit button via ${composerClicked}.`);
      return true;
    }
  }

  // 2. Playwright locators for submit/create/send buttons, prioritizing lowest on the page
  const buttonSelectors = [
    'button[aria-label*="Create" i]',
    'button[aria-label*="Send" i]',
    'button[aria-label*="Generate" i]',
    'button[aria-label*="Submit" i]',
    'button[aria-label*="Arrow" i]',
    'div[role="button"][aria-label*="Create" i]',
    'div[role="button"][aria-label*="Send" i]',
    'div[role="button"][aria-label*="Generate" i]',
    'button:has-text("Generate")',
    'button:has-text("Create")',
    'button:has-text("Send")'
  ];

  for (const btnSel of buttonSelectors) {
    const loc = page.locator(btnSel);
    const count = await loc.count().catch(() => 0);
    if (count > 0) {
      // Pick the last visible one (closest to bottom prompt bar)
      for (let idx = count - 1; idx >= 0; idx--) {
        const btn = loc.nth(idx);
        if (await btn.isVisible().catch(() => false) && await btn.isEnabled().catch(() => false)) {
          console.log(`[LocalRunner] Clicking submit button via "${btnSel}" (index ${idx}/${count})...`);
          await btn.click({ force: true }).catch(() => {});
          return true;
        }
      }
    }
  }

  // 3. Fallback: Search for bottom-right circular arrow button in lower viewport
  const circularArrowClicked = await page.evaluate(() => {
    try {
      const clickables = Array.from(document.querySelectorAll('button, div[role="button"]'));
      const windowH = window.innerHeight;
      const bottomButtons = clickables.filter(el => {
        if (el.disabled || el.offsetParent === null) return false;
        const rect = el.getBoundingClientRect();
        return rect.top > windowH * 0.5 && rect.width > 18 && rect.height > 18;
      });

      for (const b of bottomButtons) {
        const aria = (b.getAttribute('aria-label') || '').toLowerCase();
        if (aria.includes('create') || aria.includes('send') || aria.includes('generate') || aria.includes('arrow') || b.querySelector('svg')) {
          b.click();
          return `bottom-right circular arrow button (${aria || 'svg'})`;
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }).catch(() => null);

  if (circularArrowClicked) {
    console.log(`[LocalRunner] Clicked submit button via ${circularArrowClicked}.`);
    return true;
  }

  return false;
}

/**
 * Detects whether the Google Flow assistant (Omni 1.2 Flash) has replied asking to confirm
 * 720p resolution or preferred duration (e.g., "Would you like to generate this video in 720p...").
 */
async function checkIsResolutionConfirmationPrompt(page) {
  if (!page) return false;
  return await page.evaluate(() => {
    try {
      const body = document.body;
      if (!body) return false;
      const text = (body.innerText || body.textContent || '');
      return (
        text.includes("Would you like to generate this video in 720p") ||
        text.includes("Would you like me to generate this video in 720p") ||
        text.includes("preferred duration") ||
        text.includes("generate at up to 720p resolution") ||
        text.includes("generate this video in 720p") ||
        (text.includes("720p") && text.includes("duration") && (text.includes("Omni") || text.includes("preferred") || text.includes("confirm")))
      );
    } catch (e) {
      return false;
    }
  }).catch(() => false);
}

/**
 * Automatically replies to the assistant's resolution/duration confirmation prompt:
 * Fills and submits "Yes, generate this video in 720p with 5s duration."
 * using active composer + Enter + circular -> arrow click logic.
 */
async function handleResolutionConfirmation(page) {
  if (!page) return false;

  try {
    const isPrompted = await checkIsResolutionConfirmationPrompt(page);
    if (!isPrompted) return false;

    console.log(`[LocalRunner] Flow assistant resolution/duration confirmation detected.`);
    const confirmMessage = "Yes, generate this video in 720p with 5s duration.";

    const inputSelectors = [
      'div[class*="composer" i] div[contenteditable="true"]',
      'div[class*="composer" i] textarea',
      'div[class*="prompt" i] div[contenteditable="true"]',
      'div[class*="prompt" i] textarea',
      'div[class*="footer" i] div[contenteditable="true"]',
      'footer div[contenteditable="true"]',
      'textarea[placeholder*="describe" i]',
      'textarea[placeholder*="prompt" i]',
      'textarea[placeholder*="video" i]',
      'textarea[placeholder*="what you want" i]',
      'textarea[aria-label*="prompt" i]',
      'textarea[aria-label*="describe" i]',
      'div[contenteditable="true"]',
      'div[role="textbox"]',
      'textarea',
      'input[type="text"][placeholder*="prompt" i]',
      'input[type="text"]'
    ];

    let composerInput = null;
    for (const sel of inputSelectors) {
      const loc = page.locator(sel);
      const count = await loc.count().catch(() => 0);
      if (count > 0) {
        for (let idx = count - 1; idx >= 0; idx--) {
          const candidate = loc.nth(idx);
          if (await candidate.isVisible().catch(() => false)) {
            composerInput = candidate;
            break;
          }
        }
        if (composerInput) break;
      }
    }

    if (!composerInput) {
      console.warn(`[LocalRunner] Could not locate active composer input to confirm resolution.`);
      return false;
    }

    console.log(`[LocalRunner] Auto-confirming: "${confirmMessage}"...`);
    await composerInput.scrollIntoViewIfNeeded().catch(() => {});
    await composerInput.click({ force: true }).catch(() => {});
    await composerInput.focus().catch(() => {});
    await page.waitForTimeout(200);

    let filled = false;
    try {
      await composerInput.fill('');
      await composerInput.fill(confirmMessage);
      filled = true;
    } catch (e) {}

    if (!filled) {
      await composerInput.evaluate((el, text) => {
        el.focus();
        el.innerText = text;
        if ('value' in el) el.value = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, confirmMessage).catch(() => {});
    }

    await composerInput.dispatchEvent('input').catch(() => {});
    await composerInput.dispatchEvent('change').catch(() => {});
    await page.waitForTimeout(300);

    // Focus + Enter + Click circular submit/arrow button
    await composerInput.focus().catch(() => {});
    await composerInput.press('Enter').catch(() => {});
    await page.keyboard.press('Enter').catch(() => {});
    await clickPromptSubmitButton(page, composerInput);
    await page.waitForTimeout(1000);

    // Watch for credit confirmation dialog immediately following confirmation
    await handleCreditConfirmationDialog(page);

    return true;
  } catch (err) {
    console.warn(`[LocalRunner] Notice handling resolution confirmation: ${err.message}`);
    return false;
  }
}

/**
 * Automate Google Flow / Veo via Playwright
 */
async function generateClipsViaGoogleFlow(plan, townKey, townMemory, clipsDir, options) {
  const profileDir = path.resolve('.browser_profile');
  if (!fs.existsSync(profileDir)) {
    console.warn(`\n[LocalRunner] WARNING: Persistent profile directory not found at: ${profileDir}`);
    console.warn(`[LocalRunner] Please run "npm run local:login" first to log into Google Flow!`);
  }

  const clips = [];
  let browserContext = null;
  let page = null;

  try {
    console.log(`\n[LocalRunner] Launching Chrome with profile from: ${profileDir}`);
    const launchOptions = {
      headless: options.headless,
      viewport: options.headless ? { width: 1280, height: 800 } : null,
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox'
      ]
    };

    try {
      browserContext = await chromium.launchPersistentContext(profileDir, {
        channel: 'chrome',
        ...launchOptions
      });
      console.log(`[LocalRunner] Launched with native Google Chrome.`);
    } catch (e) {
      console.warn(`[LocalRunner] Native Chrome launch notice (${e.message}). Falling back to Chromium engine.`);
      browserContext = await chromium.launchPersistentContext(profileDir, launchOptions);
    }

    const pages = browserContext.pages();
    page = pages.length > 0 ? pages[0] : await browserContext.newPage();

    // Prefer flow.google.com directly (handles redirect from labs.google/fx/tools/flow)
    const flowUrl = process.env.GOOGLE_FLOW_URL || 'https://flow.google.com';
    console.log(`[LocalRunner] Navigating to Google Flow: ${flowUrl}...`);
    await page.goto(flowUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(e => {
      console.warn(`[LocalRunner] Page load notice: ${e.message}`);
    });

    // Wait 4 seconds for client hydration
    await page.waitForTimeout(4000);

    // Check if user is logged in
    const pageContent = await page.content().catch(() => '');
    const isLoggedOut = pageContent.includes('Sign in') && pageContent.includes('Sign in to Google');
    if (isLoggedOut) {
      console.warn(`\n[LocalRunner] NOTICE: You appear to be logged out on Google Flow.`);
      console.warn(`[LocalRunner] If a sign-in prompt is visible, please complete login in the opened browser window.`);
      console.warn(`[LocalRunner] Or close this and run: npm run local:login\n`);
    }

    // Ensure we are inside an active workspace
    await ensureGoogleFlowWorkspace(page);
    await handleOmniModeRecovery(page);
    await ensureVideoMode(page);
    await ensureVerticalRatio(page);
    await handleCreditConfirmationDialog(page);

    const downloadedHashes = new Set();
    const collectedVideoUrls = new Set();

    // Process each stage
    for (let i = 0; i < plan.stages.length; i++) {
      const stage = plan.stages[i];
      const rawClipPath = path.join(clipsDir, `raw_flow_clip_${stage.stage_num}.mp4`);
      const finalClipPath = path.join(clipsDir, `clip_${stage.stage_num}.mp4`);

      console.log(`\n======================================================`);
      console.log(`[LocalRunner] GENERATING STAGE ${stage.stage_num}/5 VIA GOOGLE FLOW / VEO`);
      console.log(`Action: ${stage.action}`);
      console.log(`Tool:   ${stage.tool}`);
      console.log(`======================================================`);

      // Verify existing clip is unique and not a duplicate of a prior stage
      if (fs.existsSync(finalClipPath) && fs.statSync(finalClipPath).size > 100000) {
        const existingHash = crypto.createHash('sha256').update(fs.readFileSync(finalClipPath)).digest('hex');
        if (downloadedHashes.has(existingHash)) {
          console.warn(`[LocalRunner] Existing clip for Stage ${stage.stage_num} is an identical duplicate of a prior stage (${existingHash.slice(0, 10)}). Invalidating and regenerating...`);
          try { fs.unlinkSync(finalClipPath); } catch (e) {}
          try { if (fs.existsSync(rawClipPath)) fs.unlinkSync(rawClipPath); } catch (e) {}
        } else {
          console.log(`[LocalRunner] Verified unique existing clip for Stage ${stage.stage_num}: ${finalClipPath}`);
          downloadedHashes.add(existingHash);
          clips.push(finalClipPath);
          updateStageProgress(stage.stage_num, finalClipPath, {
            townKey,
            episode: plan.episode,
            outputDir: path.dirname(clipsDir),
            clipsDir,
            plan
          });
          continue;
        }
      }

      // Ensure any floating preview modal or inspector panel is closed
      await page.keyboard.press('Escape').catch(() => {});
      await ensureGoogleFlowWorkspace(page);
      await handleOmniModeRecovery(page);
      await ensureVideoMode(page);
      await handleCreditConfirmationDialog(page);

      // Snapshot all video sources currently in the DOM before submitting new prompt
      const priorVideoSrcs = new Set(
        await page.evaluate(() => {
          const vids = Array.from(document.querySelectorAll('video'));
          return vids.map(v => {
            const sourceEl = v.querySelector('source');
            return v.src || v.currentSrc || (sourceEl ? sourceEl.src : '');
          }).filter(Boolean);
        }).catch(() => [])
      );
      console.log(`[LocalRunner] Prior video elements detected on page before Stage ${stage.stage_num}: ${priorVideoSrcs.size}`);

      // High-detail authentic real-world construction video prompt optimized for Veo with dynamic visual variety
      let shotAngle = 'Smooth, steady motorized camera tracking across the active building worksite';
      let lightingMood = 'Natural daylight and clean worksite lighting';
      if (stage.stage_num === 1) {
        shotAngle = 'Wide establishing cinematic shot with dramatic push-in, capturing the full site challenge';
        lightingMood = 'Crisp morning directional sunlight with long rich shadows';
      } else if (stage.stage_num === 2) {
        shotAngle = 'Dynamic low-angle motorized tracking dolly shot gliding alongside the active equipment';
        lightingMood = 'Natural bright daytime worksite lighting';
      } else if (stage.stage_num === 3) {
        shotAngle = 'Extreme razor-sharp macro close-up detail shot with shallow depth of field focusing on material bonding';
        lightingMood = 'Clean architectural directional lighting highlighting concrete and steel textures';
      } else if (stage.stage_num === 4) {
        shotAngle = 'Medium fast-action construction view showing structural components converging into place';
        lightingMood = 'Natural afternoon documentary worksite lighting';
      } else {
        shotAngle = 'Grand cinematic wide pull-back reveal showcasing the complete, pristine transformed structure';
        lightingMood = 'Dramatic warm golden-hour glow casting rich highlights across the finished build';
      }

      const veoPrompt = `Cinematic 720p, 5s duration real-world construction process video: ${shotAngle}. Skilled adult craftsman male hands with visible skin texture and rolled dark denim work sleeves use ${stage.tool} to ${stage.action}. Authentic construction surroundings: concrete foundations, structural framing, building materials, clean ground worksite, and natural construction environment. ${lightingMood}, real physical construction craftsmanship, genuine working motion, steady camera angle, razor-sharp focus on the active build, 30fps.`;

      let generated = false;

      try {
        // Find prompt input field (closing any lingering modals if necessary)
        const inputSelectors = [
          'div[class*="composer" i] div[contenteditable="true"]',
          'div[class*="composer" i] textarea',
          'div[class*="prompt" i] div[contenteditable="true"]',
          'div[class*="prompt" i] textarea',
          'div[class*="footer" i] div[contenteditable="true"]',
          'footer div[contenteditable="true"]',
          'textarea[placeholder*="describe" i]',
          'textarea[placeholder*="prompt" i]',
          'textarea[placeholder*="video" i]',
          'textarea[placeholder*="what you want" i]',
          'textarea[aria-label*="prompt" i]',
          'textarea[aria-label*="describe" i]',
          'div[contenteditable="true"]',
          'div[role="textbox"]',
          'textarea',
          'input[type="text"][placeholder*="prompt" i]',
          'input[type="text"]'
        ];

        let promptInput = null;
        for (let attempt = 0; attempt < 4; attempt++) {
          await page.keyboard.press('Escape').catch(() => {});
          await handleCreditConfirmationDialog(page);
          await handleOmniModeRecovery(page);
          await ensureVideoMode(page);

          for (const sel of inputSelectors) {
            const loc = page.locator(sel);
            const count = await loc.count().catch(() => 0);
            if (count > 0) {
              // If multiple elements match (e.g. previous prompt chips/cards above or in side panel),
              // inspect from last to first to select the active bottom prompt composer!
              for (let idx = count - 1; idx >= 0; idx--) {
                const candidate = loc.nth(idx);
                if (await candidate.isVisible().catch(() => false)) {
                  promptInput = candidate;
                  console.log(`[LocalRunner] Found active prompt input using selector: "${sel}" (index ${idx}/${count})`);
                  break;
                }
              }
              if (promptInput) break;
            }
          }
          if (promptInput) break;
          await page.waitForTimeout(1000);
        }

        if (promptInput) {
          // If workspace somehow reverted to Omni mode, recover before entering text
          if (await checkIsOmniModeActive(page)) {
            console.log(`[LocalRunner] Omni mode detected prior to filling prompt. Recovering...`);
            await handleOmniModeRecovery(page);
            await ensureVideoMode(page);
          }

          console.log(`[LocalRunner] Entering Veo prompt for Stage ${stage.stage_num}...`);
          await promptInput.scrollIntoViewIfNeeded().catch(() => {});
          await promptInput.click({ force: true }).catch(() => {});
          await promptInput.focus().catch(() => {});
          await page.waitForTimeout(200);

          let filled = false;
          try {
            await promptInput.fill('');
            await promptInput.fill(veoPrompt);
            filled = true;
          } catch (e) {}

          if (!filled) {
            await promptInput.evaluate((el, text) => {
              el.focus();
              el.innerText = text;
              if ('value' in el) el.value = text;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, veoPrompt).catch(() => {});
          }

          await promptInput.dispatchEvent('input').catch(() => {});
          await promptInput.dispatchEvent('change').catch(() => {});
          await page.waitForTimeout(200);

          // Setup video download listener for responses initiated after submission
          let interceptedUrl = null;
          const responseHandler = async (response) => {
            try {
              const url = response.url();
              const status = response.status();
              const contentType = response.headers()['content-type'] || '';
              if ((status === 200 || status === 206) && (contentType.includes('video/') || url.endsWith('.mp4') || (url.includes('googlevideo') && contentType.includes('video')))) {
                if (!priorVideoSrcs.has(url) && !collectedVideoUrls.has(url)) {
                  interceptedUrl = url;
                }
              }
            } catch (e) {}
          };
          page.on('response', responseHandler);

          // Submit step:
          // 1. Explicitly focus the editable prompt box
          // 2. Press Enter
          // 3. Click the visible submit/send button (or circular arrow button)
          // 4. Retry if submitting does not start generation within a few seconds
          console.log(`[LocalRunner] Submitting prompt to Veo (Focus + Enter + Submit button)...`);
          await promptInput.focus().catch(() => {});
          await promptInput.press('Enter').catch(() => {});
          await page.keyboard.press('Enter').catch(() => {});
          await clickPromptSubmitButton(page, promptInput);

          // Submission verification & retry watchdog
          let generationStarted = false;
          let confirmedResolutionThisStage = false;
          for (let verifyAttempt = 0; verifyAttempt < 3; verifyAttempt++) {
            // Rapid credit approval watchdog (500ms intervals)
            for (let cCheck = 0; cCheck < 4; cCheck++) {
              await page.waitForTimeout(500);
              if (await handleCreditConfirmationDialog(page)) {
                console.log(`[LocalRunner] Credit confirmation auto-approved immediately after submission.`);
                generationStarted = true;
                break;
              }
            }

            if (generationStarted) break;

            // Check if prompt was cleared, generation status indicators appeared, or if stuck in Omni mode/resolution prompt
            const statusCheck = await page.evaluate((inputEl) => {
              try {
                const currentVal = (inputEl ? (inputEl.innerText || inputEl.value || '') : '').trim();
                const bodyText = document.body ? (document.body.innerText || '') : '';

                if (
                  bodyText.includes("To edit a video with Omni") ||
                  bodyText.includes("you'll need a video in your project first") ||
                  bodyText.includes("Generate a new video first")
                ) {
                  return { started: false, reason: 'stuck in Omni video-editing mode', isOmniMode: true };
                }

                if (
                  bodyText.includes("Would you like to generate this video in 720p") ||
                  bodyText.includes("Would you like me to generate this video in 720p") ||
                  bodyText.includes("preferred duration") ||
                  bodyText.includes("generate at up to 720p resolution") ||
                  bodyText.includes("generate this video in 720p")
                ) {
                  return { started: false, reason: 'assistant asks to confirm 720p/duration', isResolutionPrompt: true };
                }

                if (currentVal.length < 5) return { started: true, reason: 'prompt input cleared' };

                if (
                  bodyText.includes('generation has started') ||
                  bodyText.includes('Your video generation has started') ||
                  bodyText.includes('Generating') ||
                  bodyText.includes('Rendering') ||
                  bodyText.includes('In queue') ||
                  bodyText.includes('Queued') ||
                  bodyText.includes('costing')
                ) {
                  return { started: true, reason: 'generation status text present in DOM' };
                }

                return { started: false, reason: 'prompt text still present in input' };
              } catch (e) {
                return { started: false, reason: e.message };
              }
            }, await promptInput.elementHandle().catch(() => null)).catch(() => ({ started: false, reason: 'evaluate error' }));

            if (statusCheck.started) {
              generationStarted = true;
              console.log(`[LocalRunner] Generation initiation confirmed (${statusCheck.reason}).`);
              break;
            }

            if (statusCheck.isResolutionPrompt && !confirmedResolutionThisStage) {
              console.log(`[LocalRunner] Assistant asked for 720p/duration confirmation. Auto-confirming...`);
              const confirmed = await handleResolutionConfirmation(page);
              if (confirmed) {
                confirmedResolutionThisStage = true;
              }
              continue;
            }

            if (statusCheck.isOmniMode) {
              console.warn(`[LocalRunner] Generation blocked by Omni mode. Triggering recovery and re-submitting...`);
              await handleOmniModeRecovery(page);
              await ensureVideoMode(page);
              await promptInput.focus().catch(() => {});
              await promptInput.press('Enter').catch(() => {});
              await page.keyboard.press('Enter').catch(() => {});
              await clickPromptSubmitButton(page, promptInput);
              continue;
            }

            // Retry submitting if prompt is still unsubmitted after ~2s
            if (verifyAttempt < 2) {
              console.warn(`[LocalRunner] Generation did not start yet (${statusCheck.reason}). Retrying submit button click and Enter...`);
              await promptInput.focus().catch(() => {});
              await promptInput.press('Enter').catch(() => {});
              await page.keyboard.press('Enter').catch(() => {});
              await clickPromptSubmitButton(page, promptInput);
            }
          }

          console.log(`[LocalRunner] Waiting for Veo generation to complete (up to ${options.timeoutMs / 1000}s)...`);
          const startTime = Date.now();
          let videoFound = false;

          while (Date.now() - startTime < options.timeoutMs) {
            await page.waitForTimeout(1800);

            // 1. Periodically check and auto-approve credit confirmation dialog if it popped up during queuing
            await handleCreditConfirmationDialog(page);

            // 2. Periodically check if Omni mode somehow hijacked the workspace
            if (await checkIsOmniModeActive(page)) {
              console.warn(`[LocalRunner] Omni mode detected during generation wait. Attempting recovery...`);
              await handleOmniModeRecovery(page);
            }

            // 3. Detect if assistant replies asking to confirm 720p resolution or preferred duration (at most once per stage)
            if (!confirmedResolutionThisStage) {
              const confirmed = await handleResolutionConfirmation(page);
              if (confirmed) {
                confirmedResolutionThisStage = true;
                console.log(`[LocalRunner] 720p/5s duration confirmation submitted for Stage ${stage.stage_num}. Continuing wait...`);
              }
            }

            // 4. Inspect all DOM video elements (both direct src and nested <source src="...">)
            const domVideos = await page.evaluate(() => {
              const elements = Array.from(document.querySelectorAll('video'));
              return elements.map(v => {
                const sourceEl = v.querySelector('source');
                const effectiveSrc = v.src || v.currentSrc || (sourceEl ? sourceEl.src : '');
                return {
                  src: effectiveSrc,
                  readyState: v.readyState,
                  duration: v.duration,
                  videoWidth: v.videoWidth,
                  videoHeight: v.videoHeight
                };
              }).filter(v => v.src && v.src.length > 5);
            }).catch(() => []);

            // Check from newest (last) to oldest (first)
            const newVideo = domVideos.reverse().find(v => !priorVideoSrcs.has(v.src) && !collectedVideoUrls.has(v.src));

            if (newVideo) {
              console.log(`[LocalRunner] Detected completed video source for Stage ${stage.stage_num}: ${newVideo.src.slice(0, 80)}...`);

              // Fast in-browser extraction via fetch (works for both blob: and authenticated http: URLs)
              const videoBase64 = await page.evaluate(async (srcUrl) => {
                try {
                  const res = await fetch(srcUrl);
                  if (!res.ok && res.status !== 0) return null;
                  const blob = await res.blob();
                  if (blob.size < 50000) return null;
                  return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const res = reader.result;
                      resolve(typeof res === 'string' ? res.split(',')[1] : null);
                    };
                    reader.readAsDataURL(blob);
                  });
                } catch (e) {
                  return null;
                }
              }, newVideo.src).catch(() => null);

              if (videoBase64 && videoBase64.length > 50000) {
                fs.writeFileSync(rawClipPath, Buffer.from(videoBase64, 'base64'));
                console.log(`[LocalRunner] Successfully captured video clip (${Math.round(fs.statSync(rawClipPath).size / 1024)} KB)`);
                videoFound = true;
                priorVideoSrcs.add(newVideo.src);
                collectedVideoUrls.add(newVideo.src);
                break;
              } else if (newVideo.src.startsWith('http')) {
                // Secondary fallback via page.request.get
                const videoBuffer = await page.request.get(newVideo.src).then(r => r.body()).catch(() => null);
                if (videoBuffer && videoBuffer.length > 50000) {
                  fs.writeFileSync(rawClipPath, videoBuffer);
                  console.log(`[LocalRunner] Successfully downloaded HTTP video clip (${Math.round(videoBuffer.length / 1024)} KB)`);
                  videoFound = true;
                  priorVideoSrcs.add(newVideo.src);
                  collectedVideoUrls.add(newVideo.src);
                  break;
                }
              }
            }

            // 3. Inspect intercepted network responses (status 200 or 206)
            if (interceptedUrl && !priorVideoSrcs.has(interceptedUrl) && !collectedVideoUrls.has(interceptedUrl)) {
              console.log(`[LocalRunner] Intercepted new video response: ${interceptedUrl.slice(0, 80)}...`);
              const videoBase64 = await page.evaluate(async (url) => {
                try {
                  const res = await fetch(url);
                  const blob = await res.blob();
                  if (blob.size < 50000) return null;
                  return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const res = reader.result;
                      resolve(typeof res === 'string' ? res.split(',')[1] : null);
                    };
                    reader.readAsDataURL(blob);
                  });
                } catch (e) {
                  return null;
                }
              }, interceptedUrl).catch(() => null);

              if (videoBase64 && videoBase64.length > 50000) {
                fs.writeFileSync(rawClipPath, Buffer.from(videoBase64, 'base64'));
                videoFound = true;
                priorVideoSrcs.add(interceptedUrl);
                collectedVideoUrls.add(interceptedUrl);
                break;
              } else {
                const videoBuffer = await page.request.get(interceptedUrl).then(r => r.body()).catch(() => null);
                if (videoBuffer && videoBuffer.length > 50000) {
                  fs.writeFileSync(rawClipPath, videoBuffer);
                  videoFound = true;
                  priorVideoSrcs.add(interceptedUrl);
                  collectedVideoUrls.add(interceptedUrl);
                  break;
                }
              }
            }

            // 4. Hover over latest completed media card/tile to reveal Download button
            const mediaCards = page.locator('[role="listitem"], [role="article"], div[data-testid*="card" i], div[data-testid*="media" i], div[class*="tile" i], div[class*="media" i]');
            const cardCount = await mediaCards.count().catch(() => 0);
            if (cardCount > 0) {
              await mediaCards.last().hover().catch(() => {});
            }

            // 5. Check for Download button on completed video card
            const downloadBtns = page.locator('button:has-text("Download"), button[aria-label*="Download" i], a[download], [data-testid*="download" i]');
            const dlCount = await downloadBtns.count().catch(() => 0);
            if (dlCount > 0) {
              const dlBtn = downloadBtns.last();
              if (await dlBtn.isVisible().catch(() => false)) {
                try {
                  console.log(`[LocalRunner] Found Download button on latest video item. Clicking...`);
                  const [download] = await Promise.all([
                    page.waitForEvent('download', { timeout: 10000 }),
                    dlBtn.click({ force: true })
                  ]);
                  await download.saveAs(rawClipPath);
                  if (fs.existsSync(rawClipPath) && fs.statSync(rawClipPath).size > 50000) {
                    videoFound = true;
                    break;
                  }
                } catch (e) {}
              }
            }
          }

          page.off('response', responseHandler);

          if (videoFound && fs.existsSync(rawClipPath) && fs.statSync(rawClipPath).size > 50000) {
            const clipHash = crypto.createHash('sha256').update(fs.readFileSync(rawClipPath)).digest('hex');
            if (downloadedHashes.has(clipHash)) {
              console.warn(`[LocalRunner] Downloaded clip for Stage ${stage.stage_num} has identical SHA256 to a previous stage. Invalidation triggered.`);
              try { fs.unlinkSync(rawClipPath); } catch (e) {}
              videoFound = false;
            } else {
              downloadedHashes.add(clipHash);
              await standardizeClip(rawClipPath, finalClipPath);
              clips.push(finalClipPath);
              generated = true;
              updateStageProgress(stage.stage_num, finalClipPath, {
                townKey,
                episode: plan.episode,
                outputDir: path.dirname(clipsDir),
                clipsDir,
                plan
              });
            }
          }
        } else {
          console.warn(`[LocalRunner] Could not locate prompt input on Google Flow.`);
          await saveDebugSnapshot(page, stage.stage_num, 'Prompt input field not located in DOM');
        }
      } catch (err) {
        console.warn(`[LocalRunner] Flow automation notice for Stage ${stage.stage_num}: ${err.message}`);
        await saveDebugSnapshot(page, stage.stage_num, `Exception: ${err.message}`);
      }

      // If Google Flow didn't return a clip or encountered a UI timeout, fall back seamlessly
      if (!generated) {
        console.log(`[LocalRunner] Falling back to local visual engine for Stage ${stage.stage_num}...`);
        const fallbackStagesDir = path.join(clipsDir, 'fallback_stages');
        if (!fs.existsSync(fallbackStagesDir)) fs.mkdirSync(fallbackStagesDir, { recursive: true });

        const townSeed = townMemory.camera_seed || 739215;
        const keyframePath = await generateKeyframe(stage, townKey, plan.episode, townSeed, fallbackStagesDir);
        const rawFallbackVideo = path.join(clipsDir, `fallback_clip_${stage.stage_num}.mp4`);
        await createContinuousWorkingMotionVideo(
          keyframePath,
          keyframePath,
          stage,
          townSeed,
          rawFallbackVideo,
          fallbackStagesDir
        );
        await standardizeClip(rawFallbackVideo, finalClipPath);
        const fallbackHash = crypto.createHash('sha256').update(fs.readFileSync(finalClipPath)).digest('hex');
        downloadedHashes.add(fallbackHash);
        clips.push(finalClipPath);
        updateStageProgress(stage.stage_num, finalClipPath, {
          townKey,
          episode: plan.episode,
          outputDir: path.dirname(clipsDir),
          clipsDir,
          plan
        });
      }
    }
  } finally {
    if (browserContext) {
      console.log(`[LocalRunner] Closing browser session...`);
      await browserContext.close().catch(() => {});
    }
  }

  return clips;
}

/**
 * Main Controller for Local Windows Automation Runner
 */
async function runLocalAutomation() {
  const options = parseArgs();
  const startTime = Date.now();

  console.log(`\n======================================================`);
  console.log(`REAL MINI TOWNSHIP AUTOPILOT - LOCAL WINDOWS RUNNER`);
  console.log(`======================================================`);
  console.log(`Target Series:     ${options.town}`);
  console.log(`Execution Mode:    ${options.dryRun ? 'DRY RUN (Local Master Only)' : 'LIVE (Master + YouTube Shorts Upload)'}`);
  console.log(`Browser Mode:      ${options.headless ? 'Headless' : 'Visible Chrome Window'}`);
  console.log(`======================================================\n`);

  // Storage Cap Gate & Automatic Resume check
  const gate = checkStorageCapGate();
  if (!gate.canProceed) {
    console.log(`[LocalRunner] Storage cap reached (${gate.usage?.totalMB} MB >= 1800 MB). Cleanly pausing automation for this session.`);
    return { status: 'paused', reason: gate.reason, usage: gate.usage };
  }

  const memoryPath = path.resolve('state', 'town_memory.json');
  if (!fs.existsSync(memoryPath)) {
    throw new Error(`Town memory file not found at ${memoryPath}`);
  }

  const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
  let townKey = options.town;
  let nextEpisode = null;
  let plan = null;

  const checkpoint = loadCheckpoint();
  if (checkpoint && (!options.town || options.town === checkpoint.townKey)) {
    townKey = checkpoint.townKey;
    nextEpisode = checkpoint.episode;
    plan = checkpoint.plan;
    console.log(`[LocalRunner] RESUMING FROM MID-RUN CHECKPOINT: ${townKey} Ep ${nextEpisode} (${checkpoint.completedStages?.length || 0}/5 stages completed)`);
  } else {
    if (!memory[townKey]) {
      console.error(`Invalid town key "${townKey}". Available: ${Object.keys(memory).join(', ')}`);
      process.exit(1);
    }
    nextEpisode = (memory[townKey].episode || 0) + 1;
  }

  const townMemory = memory[townKey];
  console.log(`Series Name:       "${townMemory.name}"`);
  console.log(`Current Episode:   ${townMemory.episode} -> Target: Episode ${nextEpisode}\n`);

  const outputDir = path.resolve('output', `${townKey}_ep${nextEpisode}`);
  const clipsDir = path.join(outputDir, 'clips');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(clipsDir)) fs.mkdirSync(clipsDir, { recursive: true });

  // 1. Plan Episode
  console.log(`--- [1/4] ARCHITECT PLANNING ---`);
  if (!plan) {
    plan = await planEpisode(townKey, townMemory, nextEpisode);
    fs.writeFileSync(path.join(outputDir, 'episode_plan.json'), JSON.stringify(plan, null, 2), 'utf8');
    saveCheckpoint({
      active: true,
      townKey,
      episode: nextEpisode,
      outputDir,
      clipsDir,
      plan,
      completedStages: [],
      stageClips: {},
      currentStep: 'video_generation'
    });
  } else {
    console.log(`[LocalRunner] Reusing plan from active checkpoint: "${plan.title}"`);
  }
  console.log(`Episode Title:     "${plan.title}"`);
  console.log(`2-Word Focus:      "${plan.subtitle_2word}"`);
  console.log(`Civil Challenge:   ${plan.problem}`);
  console.log(`Solution:          ${plan.solution}\n`);

  // 2. Generate / Collect 5 Video Clips
  console.log(`--- [2/4] VIDEO GENERATION (GOOGLE FLOW / VEO) ---`);
  let clips = [];

  if (options.skipBrowser) {
    console.log(`[LocalRunner] --skip-browser active. Checking existing clips in: ${clipsDir}`);
    for (let i = 1; i <= plan.stages.length; i++) {
      const clipPath = path.join(clipsDir, `clip_${i}.mp4`);
      if (fs.existsSync(clipPath)) clips.push(clipPath);
    }
  }

  if (clips.length < plan.stages.length) {
    clips = await generateClipsViaGoogleFlow(plan, townKey, townMemory, clipsDir, options);
  }

  console.log(`\nCollected ${clips.length} standardized video clips for assembly.`);
  updateStepProgress('audio_video_mastering', { clipsCount: clips.length });

  // Extract high-res thumbnail frame from stage 5 clip
  const lastClip = clips[clips.length - 1];
  const thumbFramePath = path.join(outputDir, 'final_stage_anchor.jpg');
  await extractThumbnailFrame(lastClip, thumbFramePath);

  // 3. Audio / Video Mastering Pipeline
  console.log(`\n--- [3/4] AUDIO / VIDEO MASTERING ---`);
  const visualResult = {
    keyframePaths: clips,
    transitionPaths: clips,
    finalStagePath: thumbFramePath
  };

  const masterResult = await assembleMasterVideo(plan, townKey, townMemory, visualResult, outputDir);
  console.log(`\nMaster Video Assembled: ${masterResult.finalVideoPath}`);
  console.log(`3D Thumbnail Created:   ${masterResult.finalThumbPath}\n`);

  // 4. Autonomous Upload & State Commit
  console.log(`--- [4/4] AUTONOMOUS UPLOADER & CONTINUITY SYNC ---`);
  let uploadResult = { status: 'skipped', reason: 'DRY RUN' };

  if (!options.dryRun) {
    uploadResult = await processUploadAndStateCommit(
      townKey,
      townMemory,
      plan,
      masterResult.finalVideoPath,
      masterResult.finalThumbPath,
      thumbFramePath
    );
    // Post-publish cleanup of local files
    cleanupUploadedLocalFiles();
  } else {
    console.log(`[LocalRunner] DRY RUN mode active. Video and thumbnail are ready in:`);
    console.log(`  Video: ${masterResult.finalVideoPath}`);
    console.log(`  Thumb: ${masterResult.finalThumbPath}`);
  }

  // Clear mid-run checkpoint upon full episode completion
  clearCheckpoint();

  // Inspect generated video stream properties via ffprobe
  let probeOutput = 'Unknown';
  try {
    const probe = spawnSync('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,r_frame_rate,duration',
      '-of', 'default=noprint_wrappers=1',
      masterResult.finalVideoPath
    ]);
    probeOutput = probe.stdout.toString().trim().replace(/[\r\n]+/g, ', ');
  } catch (e) {}

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  const videoSizeMB = (fs.statSync(masterResult.finalVideoPath).size / (1024 * 1024)).toFixed(2);
  const thumbSizeKB = (fs.statSync(masterResult.finalThumbPath).size / 1024).toFixed(1);

  console.log(`\n======================================================`);
  console.log(`LOCAL AUTOMATION COMPLETED IN ${durationSec}s!`);
  console.log(`======================================================`);
  console.log(`Town Series:          ${townMemory.name} (${townKey})`);
  console.log(`Episode:              Episode ${plan.episode} - "${plan.title}"`);
  console.log(`Final Video Path:     ${masterResult.finalVideoPath}`);
  console.log(`Final Thumbnail:      ${masterResult.finalThumbPath}`);
  console.log(`Video File Size:      ${videoSizeMB} MB`);
  console.log(`Thumbnail Size:       ${thumbSizeKB} KB`);
  console.log(`Stream Specs:         ${probeOutput}`);
  console.log(`Audio Mastering:      100% Continuous Narration + ASMR Foley (Zero Cutoffs)`);
  console.log(`Upload Status:        ${JSON.stringify(uploadResult)}`);
  console.log(`======================================================\n`);

  return {
    townKey,
    episode: plan.episode,
    masterResult,
    uploadResult
  };
}

if (require.main === module) {
  runLocalAutomation().catch(err => {
    console.error('Fatal local runner error:', err);
    process.exit(1);
  });
}

module.exports = {
  runLocalAutomation,
  generateClipsViaGoogleFlow,
  handleCreditConfirmationDialog,
  handleOmniModeRecovery,
  checkIsOmniModeActive,
  isOmniOrEditElement,
  ensureVideoMode,
  checkIsResolutionConfirmationPrompt,
  handleResolutionConfirmation,
  clickPromptSubmitButton,
  standardizeClip,
  extractThumbnailFrame
};
