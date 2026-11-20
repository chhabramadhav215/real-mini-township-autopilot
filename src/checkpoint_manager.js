const fs = require('fs');
const path = require('path');

/**
 * Checkpoint Manager:
 * Mid-run persistence and exact resume state for real-mini-township-autopilot.
 * Persists local state under .local_state/checkpoint.json (git-ignored).
 *
 * Tracks:
 * - Active townKey & episode ID
 * - Output directories (outputDir, clipsDir)
 * - Episode plan & metadata
 * - Completed stages (1/5..5/5) & verified clip file paths
 * - Current lifecycle step (planning, video_generation, audio_video_mastering, enqueued)
 */

const CHECKPOINT_DIR = path.resolve('.local_state');
const CHECKPOINT_FILE = path.join(CHECKPOINT_DIR, 'checkpoint.json');

function ensureCheckpointDir() {
  if (!fs.existsSync(CHECKPOINT_DIR)) {
    fs.mkdirSync(CHECKPOINT_DIR, { recursive: true });
  }
}

/**
 * Load the active in-progress checkpoint if present.
 * Verifies that referenced files and directories exist on disk.
 */
function loadCheckpoint() {
  if (!fs.existsSync(CHECKPOINT_FILE)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
    const data = JSON.parse(raw);

    if (!data || !data.active || !data.townKey || typeof data.episode !== 'number') {
      return null;
    }

    // Verify outputDir still exists on disk
    if (data.outputDir && !fs.existsSync(data.outputDir)) {
      console.warn(`[Checkpoint] Output directory for checkpoint no longer exists: ${data.outputDir}. Discarding stale checkpoint.`);
      clearCheckpoint();
      return null;
    }

    // Validate completed stages against existing clip files on disk
    if (data.stageClips && typeof data.stageClips === 'object') {
      const verifiedStages = [];
      for (const [stageNumStr, clipPath] of Object.entries(data.stageClips)) {
        const stageNum = parseInt(stageNumStr, 10);
        if (clipPath && fs.existsSync(clipPath) && fs.statSync(clipPath).size > 10000) {
          verifiedStages.push(stageNum);
        } else {
          delete data.stageClips[stageNumStr];
        }
      }
      data.completedStages = verifiedStages.sort((a, b) => a - b);
    } else {
      data.stageClips = {};
      data.completedStages = [];
    }

    return data;
  } catch (err) {
    console.warn(`[Checkpoint] Warning reading checkpoint file: ${err.message}. Discarding corrupt checkpoint.`);
    clearCheckpoint();
    return null;
  }
}

/**
 * Persist checkpoint state to disk atomically
 */
function saveCheckpoint(data) {
  try {
    ensureCheckpointDir();
    const payload = {
      active: true,
      townKey: data.townKey,
      episode: data.episode,
      outputDir: data.outputDir || null,
      clipsDir: data.clipsDir || null,
      plan: data.plan || null,
      completedStages: Array.isArray(data.completedStages) ? data.completedStages : [],
      stageClips: data.stageClips || {},
      currentStep: data.currentStep || 'in_progress',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const tempFile = path.join(CHECKPOINT_DIR, `checkpoint_${Date.now()}.tmp`);
    fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), 'utf8');
    fs.copyFileSync(tempFile, CHECKPOINT_FILE);
    try { fs.unlinkSync(tempFile); } catch (e) {}

    return payload;
  } catch (err) {
    console.warn(`[Checkpoint] Warning saving checkpoint: ${err.message}`);
    return null;
  }
}

/**
 * Update single stage progress in active checkpoint
 */
function updateStageProgress(stageNum, clipPath, extra = {}) {
  try {
    let checkpoint = loadCheckpoint();
    if (!checkpoint) {
      checkpoint = {
        active: true,
        townKey: extra.townKey || 'unknown',
        episode: extra.episode || 1,
        outputDir: extra.outputDir || null,
        clipsDir: extra.clipsDir || null,
        plan: extra.plan || null,
        completedStages: [],
        stageClips: {},
        currentStep: 'video_generation',
        created_at: new Date().toISOString()
      };
    }

    if (!checkpoint.stageClips) checkpoint.stageClips = {};
    checkpoint.stageClips[stageNum] = clipPath;

    const stagesSet = new Set(checkpoint.completedStages || []);
    stagesSet.add(stageNum);
    checkpoint.completedStages = Array.from(stagesSet).sort((a, b) => a - b);
    checkpoint.currentStep = 'video_generation';
    checkpoint.updated_at = new Date().toISOString();

    if (extra.plan) checkpoint.plan = extra.plan;
    if (extra.outputDir) checkpoint.outputDir = extra.outputDir;
    if (extra.clipsDir) checkpoint.clipsDir = extra.clipsDir;

    saveCheckpoint(checkpoint);
    console.log(`[Checkpoint] Recorded Stage ${stageNum}/5 in checkpoint (${checkpoint.completedStages.length}/5 stages complete)`);
    return checkpoint;
  } catch (err) {
    console.warn(`[Checkpoint] Notice updating stage in checkpoint: ${err.message}`);
    return null;
  }
}

/**
 * Update overall lifecycle step in active checkpoint
 */
function updateStepProgress(stepName, extra = {}) {
  try {
    const checkpoint = loadCheckpoint();
    if (!checkpoint) return null;

    checkpoint.currentStep = stepName;
    checkpoint.updated_at = new Date().toISOString();
    Object.assign(checkpoint, extra);

    saveCheckpoint(checkpoint);
    return checkpoint;
  } catch (err) {
    console.warn(`[Checkpoint] Notice updating step: ${err.message}`);
    return null;
  }
}

/**
 * Clear the active checkpoint once the episode is assembled and enqueued
 */
function clearCheckpoint() {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      fs.unlinkSync(CHECKPOINT_FILE);
      console.log(`[Checkpoint] Cleared active checkpoint.`);
      return true;
    }
  } catch (err) {
    console.warn(`[Checkpoint] Notice clearing checkpoint: ${err.message}`);
  }
  return false;
}

/**
 * Check if a valid active checkpoint exists
 */
function hasActiveCheckpoint() {
  const cp = loadCheckpoint();
  return cp !== null && cp.active === true;
}

module.exports = {
  CHECKPOINT_DIR,
  CHECKPOINT_FILE,
  loadCheckpoint,
  saveCheckpoint,
  updateStageProgress,
  updateStepProgress,
  clearCheckpoint,
  hasActiveCheckpoint
};
