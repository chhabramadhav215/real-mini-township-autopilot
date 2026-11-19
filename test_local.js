require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { planEpisode } = require('./src/architect');
const { generateEpisodeVisuals } = require('./src/visual_engine');
const { assembleMasterVideo } = require('./src/audio_video_master');

/**
 * Local Test Runner
 * Generates Episode 1 locally as output/test_ep1.mp4 without uploading,
 * allowing instant inspection of video quality, visual continuity, ASMR audio, and badges.
 */
async function testLocalRun() {
  process.env.DRY_RUN = 'true';
  const startTime = Date.now();

  const targetTownKey = process.argv[2] || 'smart_city';
  console.log(`\n======================================================`);
  console.log(`REAL MINI TOWNSHIP AUTOPILOT - LOCAL TEST RUN`);
  console.log(`Target Series: "${targetTownKey}" (Episode 1)`);
  console.log(`Upload Mode: DISABLED (DRY RUN - Local Inspection Only)`);
  console.log(`======================================================\n`);

  const memoryPath = path.resolve('state', 'town_memory.json');
  if (!fs.existsSync(memoryPath)) {
    throw new Error(`Town memory file not found at ${memoryPath}`);
  }

  const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
  if (!memory[targetTownKey]) {
    console.error(`Invalid town: "${targetTownKey}". Choose from: ${Object.keys(memory).join(', ')}`);
    process.exit(1);
  }

  const townMemory = memory[targetTownKey];

  // Set up local test output directory
  const testOutputDir = path.resolve('output', 'test_local');
  if (!fs.existsSync(testOutputDir)) fs.mkdirSync(testOutputDir, { recursive: true });

  console.log(`--- [Step 1/3] Planning Episode 1 ---`);
  // Force Episode 1 for the test
  const plan = await planEpisode(targetTownKey, townMemory, 1);
  console.log(`Title: "${plan.title}"`);
  console.log(`Subtitle Badge: "${plan.subtitle_2word}"`);
  console.log(`Civil Problem: ${plan.problem}`);
  console.log(`Solution: ${plan.solution}\n`);

  console.log(`--- [Step 2/3] Generating Diorama Keyframes & Transitions ---`);
  const visualResult = await generateEpisodeVisuals(plan, targetTownKey, townMemory, testOutputDir);
  console.log(`Keyframes generated: ${visualResult.keyframePaths.length}`);
  console.log(`Transitions generated: ${visualResult.transitionPaths.length}\n`);

  console.log(`--- [Step 3/3] Audio/Video Mastering (ASMR + Narration + Badges) ---`);
  const masterResult = await assembleMasterVideo(plan, targetTownKey, townMemory, visualResult, testOutputDir);

  // Copy to exact expected test artifact names: output/test_ep1.mp4 and output/test_ep1_thumb.jpg
  const mainOutputDir = path.resolve('output');
  const targetVideoPath = path.join(mainOutputDir, 'test_ep1.mp4');
  const targetThumbPath = path.join(mainOutputDir, 'test_ep1_thumb.jpg');

  fs.copyFileSync(masterResult.finalVideoPath, targetVideoPath);
  fs.copyFileSync(masterResult.finalThumbPath, targetThumbPath);

  // Inspect generated video properties via ffprobe
  let probeOutput = 'Unknown';
  try {
    const probe = spawnSync('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,r_frame_rate,duration',
      '-of', 'default=noprint_wrappers=1',
      targetVideoPath
    ]);
    probeOutput = probe.stdout.toString().trim().replace(/[\r\n]+/g, ', ');
  } catch (e) {}

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  const videoSizeMB = (fs.statSync(targetVideoPath).size / (1024 * 1024)).toFixed(2);
  const thumbSizeKB = (fs.statSync(targetThumbPath).size / 1024).toFixed(1);

  console.log(`\n======================================================`);
  console.log(`LOCAL TEST GENERATION COMPLETE IN ${durationSec}s!`);
  console.log(`======================================================`);
  console.log(`Primary Output Video: ${targetVideoPath}`);
  console.log(`Primary Output Thumb: ${targetThumbPath}`);
  console.log(`Video File Size:      ${videoSizeMB} MB`);
  console.log(`Thumbnail File Size:  ${thumbSizeKB} KB`);
  console.log(`Video Stream Specs:   ${probeOutput}`);
  console.log(`Episode Badge:        ${townMemory.badge_text} • EP 01`);
  console.log(`Badge Color:          ${townMemory.badge_color}`);
  console.log(`ASMR Audio Foley:     Included & Mixed with AndrewNeural Voiceover`);
  console.log(`======================================================\n`);
  console.log(`You can now inspect the output video at:`);
  console.log(`file:///${targetVideoPath.replace(/\\/g, '/')}\n`);
}

testLocalRun().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
