require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { planEpisode } = require('./architect');
const { generateEpisodeVisuals } = require('./visual_engine');
const { assembleMasterVideo } = require('./audio_video_master');
const { processUploadAndStateCommit } = require('./uploader');

/**
 * Autonomous Mini Township Autopilot - Main Controller
 */
async function runTownshipAutopilot(targetTownKey = null) {
  const startTime = Date.now();
  console.log(`\n======================================================`);
  console.log(`REAL MINI TOWNSHIP AUTOPILOT - AUTONOMOUS DAILY RUN`);
  console.log(`======================================================\n`);

  const memoryPath = path.resolve('state', 'town_memory.json');
  if (!fs.existsSync(memoryPath)) {
    throw new Error(`Town memory not found at ${memoryPath}`);
  }

  const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
  const validTowns = Object.keys(memory);

  const townKey = targetTownKey || process.argv[2] || process.env.TOWN_KEY || 'smart_city';

  if (!memory[townKey]) {
    console.error(`Invalid town key: "${townKey}". Valid options: ${validTowns.join(', ')}`);
    process.exit(1);
  }

  const townMemory = memory[townKey];
  console.log(`Selected Series: "${townMemory.name}" (${townKey})`);
  console.log(`Current Episode: ${townMemory.episode}`);
  console.log(`Color Badge: ${townMemory.badge_text} (${townMemory.badge_color})`);
  console.log(`Fixed Camera Seed: ${townMemory.camera_seed}`);
  console.log(`Diorama Anchor: "${townMemory.diorama_anchor_prompt}"\n`);

  // Setup Episode Output Directory
  const nextEpNum = (townMemory.episode || 0) + 1;
  const outputDir = path.resolve('output', `${townKey}_ep${nextEpNum}`);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // STEP 1: ARCHITECT ENGINE (Civil Engineering Plan & Prompt Generation)
  console.log(`--- [1/4] ARCHITECT PLANNING ---`);
  const plan = await planEpisode(townKey, townMemory);
  fs.writeFileSync(path.join(outputDir, 'episode_plan.json'), JSON.stringify(plan, null, 2), 'utf8');
  console.log(`Episode Title: "${plan.title}"`);
  console.log(`2-Word Focus: "${plan.subtitle_2word}"`);
  console.log(`Civil Challenge: ${plan.problem}`);
  console.log(`Solution: ${plan.solution}\n`);

  // STEP 2: VISUAL ENGINE (Progressive Keyframes + I2V Transitions)
  console.log(`--- [2/4] VISUAL ENGINE GENERATION ---`);
  const visualResult = await generateEpisodeVisuals(plan, townKey, townMemory, outputDir);
  console.log(`Generated ${visualResult.keyframePaths.length} locked-angle keyframes.`);
  console.log(`Generated ${visualResult.transitionPaths.length} smooth diorama transitions.\n`);

  // STEP 3: AUDIO/VIDEO MASTERING (Narration, ASMR Foley, Badges, Subtitles, Master Video & Thumbnail)
  console.log(`--- [3/4] AUDIO/VIDEO MASTERING ---`);
  const masterResult = await assembleMasterVideo(plan, townKey, townMemory, visualResult, outputDir);
  console.log(`Master Video Ready: ${masterResult.finalVideoPath}`);
  console.log(`3D Thumbnail Ready: ${masterResult.finalThumbPath}\n`);

  // STEP 4: AUTONOMOUS UPLOADER & STATE COMMIT
  console.log(`--- [4/4] AUTONOMOUS UPLOADER & MEMORY SYNC ---`);
  const uploadResult = await processUploadAndStateCommit(
    townKey,
    townMemory,
    plan,
    masterResult.finalVideoPath,
    masterResult.finalThumbPath,
    visualResult.finalStagePath
  );

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n======================================================`);
  console.log(`RUN COMPLETED IN ${durationSec}s for ${townMemory.name} Ep ${plan.episode}`);
  console.log(`Final Video: ${masterResult.finalVideoPath}`);
  console.log(`Thumbnail:   ${masterResult.finalThumbPath}`);
  console.log(`Uploads:     ${JSON.stringify(uploadResult)}`);
  console.log(`======================================================\n`);

  return {
    townKey,
    episode: plan.episode,
    finalVideoPath: masterResult.finalVideoPath,
    finalThumbPath: masterResult.finalThumbPath,
    uploadResult
  };
}

if (require.main === module) {
  runTownshipAutopilot().catch(err => {
    console.error("FATAL AUTOPILOT ERROR:", err);
    process.exit(1);
  });
}

module.exports = { runTownshipAutopilot };
