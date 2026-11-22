require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { planEpisode } = require('./architect');
const { generateEpisodeVisuals } = require('./visual_engine');
const { assembleMasterVideo } = require('./audio_video_master');
const { processUploadAndStateCommit } = require('./uploader');
const { getNextQueuedEpisode, markEpisodeUploaded, cleanupUploadedLocalFiles } = require('./queue_manager');
const { downloadAsset, deleteReleaseAndTag } = require('./github_releases');

/**
 * Autonomous Mini Township Autopilot - Main Controller & Scheduled Publisher
 * Checks state/upload_queue.json for pre-rendered Google Flow/Veo episodes first.
 * Falls back to autonomous cloud generation if queue is empty.
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
  console.log(`Worksite Anchor: "${townMemory.diorama_anchor_prompt}"\n`);

  // ---------------------------------------------------------------------------
  // STEP 0: HYBRID LOCAL QUEUE CHECK (Pre-rendered Google Flow / Veo Releases)
  // ---------------------------------------------------------------------------
  const queuedItem = getNextQueuedEpisode(townKey);
  if (queuedItem && queuedItem.video_download_url) {
    console.log(`\n======================================================`);
    console.log(`[Publisher] PRE-RENDERED QUEUED EPISODE DETECTED!`);
    console.log(`Town:        ${townMemory.name} (${townKey})`);
    console.log(`Episode:     Episode ${queuedItem.episode} - "${queuedItem.title}"`);
    console.log(`Tag/Asset:   ${queuedItem.tag_name || queuedItem.id}`);
    console.log(`Download:    ${queuedItem.video_download_url}`);
    console.log(`======================================================\n`);

    const queueOutputDir = path.resolve('output', `${townKey}_ep${queuedItem.episode}`);
    if (!fs.existsSync(queueOutputDir)) fs.mkdirSync(queueOutputDir, { recursive: true });

    const localVideoPath = path.join(queueOutputDir, queuedItem.video_asset_name || `${townKey}_ep${queuedItem.episode}.mp4`);
    const localThumbPath = path.join(queueOutputDir, queuedItem.thumb_asset_name || `${townKey}_ep${queuedItem.episode}_thumb.jpg`);

    try {
      console.log(`[Publisher] Downloading pre-rendered master video from GitHub Release asset...`);
      await downloadAsset(queuedItem.video_download_url, localVideoPath);

      if (queuedItem.thumb_download_url) {
        console.log(`[Publisher] Downloading pre-rendered 3D thumbnail...`);
        await downloadAsset(queuedItem.thumb_download_url, localThumbPath);
      }

      if (fs.existsSync(localVideoPath) && fs.statSync(localVideoPath).size > 100000) {
        console.log(`[Publisher] Pre-rendered asset verified (${(fs.statSync(localVideoPath).size / (1024 * 1024)).toFixed(2)} MB).`);
        console.log(`[Publisher] Dispatching scheduled multi-platform upload (YouTube Shorts, Instagram Reels, Facebook Reels)...`);

        const uploadResult = await processUploadAndStateCommit(
          townKey,
          townMemory,
          queuedItem.plan || { episode: queuedItem.episode, title: queuedItem.title, subtitle_2word: queuedItem.subtitle_2word },
          localVideoPath,
          localThumbPath,
          localThumbPath,
          queuedItem.video_download_url
        );

        // Delete cloud release asset to conserve GitHub cloud storage only AFTER all platform uploads finish
        if (queuedItem.release_id || queuedItem.tag_name) {
          console.log(`[Publisher] All platform uploads finished. Deleting GitHub Release ${queuedItem.tag_name} to conserve cloud quota...`);
          await deleteReleaseAndTag(queuedItem.release_id, queuedItem.tag_name).catch((delErr) => {
            console.warn(`[Publisher] Notice deleting release: ${delErr.message}`);
          });
        }

        // Mark as uploaded in queue
        markEpisodeUploaded(townKey, queuedItem.episode, {
          published_via: 'github_actions_scheduled_queue',
          youtube_upload: uploadResult?.youtube || null,
          instagram_upload: uploadResult?.instagram || null,
          facebook_upload: uploadResult?.facebook || null
        });

        // Trigger post-publish local cleanup
        cleanupUploadedLocalFiles();

        const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n======================================================`);
        console.log(`SCHEDULED QUEUE PUBLISH COMPLETE IN ${durationSec}s!`);
        console.log(`Series:       ${townMemory.name} Ep ${queuedItem.episode}`);
        console.log(`Master Video: ${localVideoPath}`);
        console.log(`Thumbnail:    ${localThumbPath}`);
        console.log(`Upload Result: ${JSON.stringify(uploadResult)}`);
        console.log(`======================================================\n`);

        return {
          townKey,
          episode: queuedItem.episode,
          finalVideoPath: localVideoPath,
          finalThumbPath: localThumbPath,
          uploadResult
        };
      } else {
        console.warn(`[Publisher] Downloaded asset was invalid or corrupt. Falling back to autonomous cloud generation...`);
      }
    } catch (err) {
      console.warn(`[Publisher] Notice downloading queued asset (${err.message}). Falling back to autonomous cloud generation...`);
    }
  } else {
    console.log(`[Publisher] No pre-rendered queue item found for ${townKey}. Proceeding with autonomous cloud generation...`);
  }

  // ---------------------------------------------------------------------------
  // FALLBACK: AUTONOMOUS CLOUD GENERATION PIPELINE
  // ---------------------------------------------------------------------------

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
  console.log(`Generated ${visualResult.transitionPaths.length} smooth construction transitions.\n`);

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

  // Trigger post-publish local cleanup
  cleanupUploadedLocalFiles();

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
