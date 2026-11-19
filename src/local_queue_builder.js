require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { planEpisode } = require('./architect');
const { assembleMasterVideo } = require('./audio_video_master');
const { generateClipsViaGoogleFlow, extractThumbnailFrame } = require('./local_browser_runner');
const {
  loadQueue,
  saveQueue,
  enqueueEpisode,
  measureTotalQueueBytes,
  cleanupUploadedLocalFiles,
  MAX_QUEUE_STORAGE_BYTES,
  HARD_CAP_STORAGE_BYTES
} = require('./queue_manager');
const {
  getOrCreateRelease,
  uploadAsset
} = require('./github_releases');

/**
 * 2 GB Capped Local Batch Builder (npm run local:queue)
 *
 * 1. Pulls latest state from origin/main.
 * 2. Cleans up raw clips and rendered files for already-uploaded episodes.
 * 3. Enforces strict 1.8 GB / 2.0 GB disk quota.
 * 4. Generates upcoming episodes across Mountain Village, Smart City, and Desert Town.
 * 5. Uploads rendered .mp4 and .jpg to GitHub Releases (keeps git repo tiny).
 * 6. Commits and pushes state/upload_queue.json to GitHub for scheduled autonomous publishing.
 */

function parseQueueArgs() {
  const args = process.argv.slice(2);
  const options = {
    town: null, // null = auto-balance across all 3 towns
    maxEpisodes: 3,
    dryRun: process.env.DRY_RUN === 'true',
    headless: process.env.HEADLESS === 'true',
    cleanOnly: false,
    timeoutMs: 180000
  };

  for (const arg of args) {
    if (arg.startsWith('--town=')) {
      options.town = arg.split('=')[1].trim();
    } else if (arg.startsWith('--max=')) {
      options.maxEpisodes = parseInt(arg.split('=')[1].trim(), 10) || 3;
    } else if (arg === '--clean-only') {
      options.cleanOnly = true;
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--headless') {
      options.headless = true;
    } else if (arg.startsWith('--timeout=')) {
      options.timeoutMs = parseInt(arg.split('=')[1].trim(), 10) || 180000;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Real Mini Township Autopilot - 2 GB Capped Local Batch Builder

Usage:
  npm run local:queue [options]
  node src/local_queue_builder.js [options]

Options:
  --clean-only       Clean up local files for already-uploaded episodes and exit
  --max=<number>     Maximum episodes to batch generate in this session (Default: 3)
  --town=<key>       Force specific town: smart_city | mountain_village | desert_town (Default: auto-balance)
  --dry-run, -d      Build and master locally without uploading to GitHub Releases
  --headless         Run browser in background without visible Chrome window
  --timeout=<ms>     Max generation wait time per stage in ms (Default: 180000)
  --help, -h         Display this help message
`);
}

function syncGitRemote() {
  try {
    console.log(`[LocalQueue] Pulling latest state from origin/main...`);
    const res = spawnSync('git', ['pull', '--rebase', 'origin', 'main'], { encoding: 'utf8' });
    if (res.status === 0) {
      console.log(`[LocalQueue] Git state in sync with origin/main.`);
    } else {
      console.warn(`[LocalQueue] Git sync notice: ${res.stderr || res.stdout}`);
    }
  } catch (e) {
    console.warn(`[LocalQueue] Git sync notice: ${e.message}`);
  }
}

function commitAndPushQueueState(commitMessage) {
  try {
    console.log(`[LocalQueue] Committing and pushing queue updates to origin/main...`);
    spawnSync('git', ['add', 'state/upload_queue.json', 'state/town_memory.json']);
    const diff = spawnSync('git', ['diff', '--staged', '--quiet']);
    if (diff.status !== 0) {
      spawnSync('git', ['commit', '-m', commitMessage]);
      const pushRes = spawnSync('git', ['push', 'origin', 'main'], { encoding: 'utf8' });
      if (pushRes.status === 0) {
        console.log(`[LocalQueue] Successfully pushed queue state to origin/main!`);
        return true;
      } else {
        console.warn(`[LocalQueue] Git push notice: ${pushRes.stderr || pushRes.stdout}`);
      }
    } else {
      console.log(`[LocalQueue] No staged changes to commit.`);
    }
  } catch (e) {
    console.warn(`[LocalQueue] Auto-commit notice: ${e.message}`);
  }
  return false;
}

/**
 * Determine which town series to generate next to maintain an evenly balanced queue
 */
function selectNextTownAndEpisode(memory, queueData, forcedTown = null) {
  const allTowns = ['mountain_village', 'smart_city', 'desert_town'];

  if (forcedTown) {
    if (!memory[forcedTown]) {
      throw new Error(`Invalid town key: "${forcedTown}". Choose from: ${allTowns.join(', ')}`);
    }
    const currentBaseEp = Number(memory[forcedTown].episode || 0);
    const queuedEps = (queueData.queue || [])
      .filter(item => item.townKey === forcedTown && item.uploaded !== true)
      .map(item => Number(item.episode));
    const highestEp = Math.max(currentBaseEp, ...queuedEps, 0);
    return { townKey: forcedTown, nextEp: highestEp + 1 };
  }

  // Count unuploaded queued episodes per town
  const townStats = allTowns.map(townKey => {
    const currentBaseEp = Number(memory[townKey]?.episode || 0);
    const queuedItems = (queueData.queue || []).filter(item => item.townKey === townKey && item.uploaded !== true);
    const queuedEps = queuedItems.map(item => Number(item.episode));
    const highestEp = Math.max(currentBaseEp, ...queuedEps, 0);

    return {
      townKey,
      unuploadedCount: queuedItems.length,
      nextEp: highestEp + 1
    };
  });

  // Sort by lowest queued count to keep all 3 series equally stocked
  townStats.sort((a, b) => a.unuploadedCount - b.unuploadedCount);
  return { townKey: townStats[0].townKey, nextEp: townStats[0].nextEp };
}

/**
 * Main Controller for 2 GB Capped Batch Builder
 */
async function runLocalQueueBuilder() {
  const options = parseQueueArgs();
  const startTime = Date.now();

  console.log(`\n======================================================`);
  console.log(`REAL MINI TOWNSHIP AUTOPILOT - 2 GB LOCAL QUEUE BUILDER`);
  console.log(`======================================================`);
  console.log(`Max Batch Count:   ${options.maxEpisodes} episodes`);
  console.log(`Target Town:       ${options.town || 'Auto-balance (Village -> City -> Desert)'}`);
  console.log(`Execution Mode:    ${options.dryRun ? 'DRY RUN (Build locally without Release upload)' : 'LIVE (Build + GitHub Release Asset Upload)'}`);
  console.log(`Storage Limit:     1.8 GB warning / 2.0 GB hard limit`);
  console.log(`======================================================\n`);

  // 1. Sync latest state from remote git repository
  syncGitRemote();

  // 2. Load state
  const memoryPath = path.resolve('state', 'town_memory.json');
  if (!fs.existsSync(memoryPath)) {
    throw new Error(`Town memory not found at ${memoryPath}`);
  }
  const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
  const queueData = loadQueue();

  // 3. STEP 1: Run Storage Cleanup (Delete uploaded local files)
  const cleanupResult = cleanupUploadedLocalFiles(queueData, memory);

  if (options.cleanOnly) {
    console.log(`[LocalQueue] --clean-only mode active. Cleanup complete. Exiting.`);
    return;
  }

  // 4. STEP 2: Measure Current Storage Usage
  let usage = measureTotalQueueBytes();
  console.log(`[LocalQueue] Current local queue disk usage: ${usage.totalMB} MB (${usage.totalGB} GB)`);

  if (!usage.isUnderWarningLimit) {
    console.log(`\n[LocalQueue] STORAGE CAP REACHED: Local queue is currently at ${usage.totalMB} MB (>= 1.8 GB limit).`);
    console.log(`[LocalQueue] Storage optimal. Waiting for GitHub Actions scheduled runs to publish queued episodes and free space.`);
    return;
  }

  // 5. Batch Generation Loop
  let episodesGenerated = 0;

  while (episodesGenerated < options.maxEpisodes) {
    // Check storage before starting next episode
    usage = measureTotalQueueBytes();
    if (!usage.isUnderWarningLimit) {
      console.log(`\n[LocalQueue] Local queue storage limit reached (${usage.totalMB} MB >= 1800 MB). Stopping batch.`);
      break;
    }

    // Pick next balanced town and episode
    const { townKey, nextEp } = selectNextTownAndEpisode(memory, queueData, options.town);
    const townMemory = memory[townKey];

    console.log(`\n======================================================`);
    console.log(`[LocalQueue] BATCH [${episodesGenerated + 1}/${options.maxEpisodes}] PRE-GENERATING EPISODE`);
    console.log(`Series:       ${townMemory.name} (${townKey})`);
    console.log(`Next Episode: Episode ${nextEp}`);
    console.log(`Storage Left: ${( (MAX_QUEUE_STORAGE_BYTES - usage.totalBytes) / (1024 * 1024) ).toFixed(0)} MB until 1.8 GB limit`);
    console.log(`======================================================\n`);

    // Setup output directory in queue_out/
    const episodeOutputDir = path.resolve('queue_out', `${townKey}_ep${nextEp}`);
    const clipsDir = path.join(episodeOutputDir, 'clips');
    if (!fs.existsSync(episodeOutputDir)) fs.mkdirSync(episodeOutputDir, { recursive: true });
    if (!fs.existsSync(clipsDir)) fs.mkdirSync(clipsDir, { recursive: true });

    // Step A: Plan Episode
    console.log(`--- [1/4] ARCHITECT PLANNING ---`);
    const plan = await planEpisode(townKey, townMemory, nextEp);
    fs.writeFileSync(path.join(episodeOutputDir, 'episode_plan.json'), JSON.stringify(plan, null, 2), 'utf8');
    console.log(`Episode Title:   "${plan.title}"`);
    console.log(`2-Word Focus:    "${plan.subtitle_2word}"`);
    console.log(`Civil Challenge: ${plan.problem}`);
    console.log(`Solution:        ${plan.solution}\n`);

    // Step B: Generate 5 Diorama Video Clips via Google Flow / Veo
    console.log(`--- [2/4] VIDEO GENERATION (GOOGLE FLOW / VEO) ---`);
    const clips = await generateClipsViaGoogleFlow(plan, townKey, townMemory, clipsDir, options);
    console.log(`Collected ${clips.length} standardized video clips for assembly.\n`);

    // Extract high-res thumbnail frame
    const lastClip = clips[clips.length - 1];
    const thumbFramePath = path.join(episodeOutputDir, 'final_stage_anchor.jpg');
    await extractThumbnailFrame(lastClip, thumbFramePath);

    // Step C: Audio & Video Mastering
    console.log(`--- [3/4] AUDIO / VIDEO MASTERING ---`);
    const visualResult = {
      keyframePaths: clips,
      transitionPaths: clips,
      finalStagePath: thumbFramePath
    };

    const masterResult = await assembleMasterVideo(plan, townKey, townMemory, visualResult, episodeOutputDir);
    console.log(`Master Video Assembled: ${masterResult.finalVideoPath}`);
    console.log(`3D Thumbnail Created:   ${masterResult.finalThumbPath}\n`);

    // Step D: Upload to GitHub Release Asset
    console.log(`--- [4/4] GITHUB RELEASE ASSET DISPATCH & QUEUE COMMIT ---`);
    const releaseTagName = `queue-${townKey}-ep${nextEp}`;
    let videoDownloadUrl = null;
    let thumbDownloadUrl = null;
    let releaseId = null;

    if (!options.dryRun) {
      try {
        console.log(`[LocalQueue] Creating/retrieving GitHub Release: ${releaseTagName}...`);
        const release = await getOrCreateRelease(
          releaseTagName,
          `${townMemory.name} - Ep ${nextEp} (${plan.subtitle_2word})`,
          `Pre-rendered real-motion diorama construction build for ${townMemory.name} Episode ${nextEp}: "${plan.title}"`
        );
        releaseId = release.id;

        const videoAsset = await uploadAsset(
          release,
          masterResult.finalVideoPath,
          path.basename(masterResult.finalVideoPath),
          'video/mp4'
        );
        videoDownloadUrl = videoAsset.browser_download_url;

        const thumbAsset = await uploadAsset(
          release,
          masterResult.finalThumbPath,
          path.basename(masterResult.finalThumbPath),
          'image/jpeg'
        );
        thumbDownloadUrl = thumbAsset.browser_download_url;

        console.log(`[LocalQueue] Assets securely hosted on GitHub Releases!`);
      } catch (err) {
        console.warn(`[LocalQueue] GitHub Release upload notice (${err.message}). Local assets retained in queue_out.`);
      }
    } else {
      console.log(`[LocalQueue] DRY RUN: Skipping GitHub Release upload.`);
    }

    // Step E: Enqueue in state/upload_queue.json
    const queueEntry = {
      id: `queue_${townKey}_ep${nextEp}`,
      townKey,
      episode: nextEp,
      title: plan.title,
      subtitle_2word: plan.subtitle_2word,
      problem: plan.problem,
      solution: plan.solution,
      tag_name: releaseTagName,
      release_id: releaseId,
      video_asset_name: path.basename(masterResult.finalVideoPath),
      thumb_asset_name: path.basename(masterResult.finalThumbPath),
      video_download_url: videoDownloadUrl,
      thumb_download_url: thumbDownloadUrl,
      local_video_path: masterResult.finalVideoPath,
      local_thumb_path: masterResult.finalThumbPath,
      created_at: new Date().toISOString(),
      uploaded: false,
      uploaded_at: null,
      plan
    };

    enqueueEpisode(queueEntry);

    // Step F: Commit & Push state to GitHub
    commitAndPushQueueState(`chore(queue): pre-generate real-motion episode for ${townKey} ep ${nextEp} [skip ci]`);

    episodesGenerated++;
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  const finalUsage = measureTotalQueueBytes();

  console.log(`\n======================================================`);
  console.log(`LOCAL QUEUE BATCH COMPLETED IN ${durationSec}s!`);
  console.log(`======================================================`);
  console.log(`Episodes Pre-Generated: ${episodesGenerated}`);
  console.log(`Current Disk Usage:     ${finalUsage.totalMB} MB / 1800 MB limit (Hard Cap: 2048 MB)`);
  console.log(`Total Storage Reclaimed: ${cleanupResult.reclaimedMB} MB`);
  console.log(`Scheduled Delivery:     GitHub Actions will auto-publish at 06:00, 12:00, 17:00 UTC.`);
  console.log(`======================================================\n`);
}

if (require.main === module) {
  runLocalQueueBuilder().catch(err => {
    console.error('Fatal queue builder error:', err);
    process.exit(1);
  });
}

module.exports = {
  runLocalQueueBuilder,
  selectNextTownAndEpisode
};
