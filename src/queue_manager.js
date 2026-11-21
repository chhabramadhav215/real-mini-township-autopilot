const fs = require('fs');
const path = require('path');

/**
 * Queue Manager & Local Storage Controller
 * Manages state/upload_queue.json and enforces the strict 1800 MB soft limit / 2048 MB hard cap.
 */

const QUEUE_FILE_PATH = path.resolve('state', 'upload_queue.json');
const MAX_QUEUE_STORAGE_BYTES = 1800 * 1024 * 1024; // 1800 MB soft threshold
const HARD_CAP_STORAGE_BYTES = 2048 * 1024 * 1024;  // 2048 MB (2.0 GB) hard cap

function sanitizeQueueEntry(item) {
  if (!item) return item;
  const isLegacy = !item.plan || !item.plan.is_multipart ||
    /monsoon|culvert|asphalt|trench|drainage|pothole|expansion phase/i.test(JSON.stringify(item.plan));

  if (isLegacy) {
    try {
      const { generateProceduralPlan } = require('./architect');
      const memoryPath = path.resolve('state', 'town_memory.json');
      const memory = fs.existsSync(memoryPath) ? JSON.parse(fs.readFileSync(memoryPath, 'utf8')) : {};
      const townMem = memory[item.townKey] || { name: item.townKey, episode: 0 };
      const epNum = Number(item.episode) || 1;
      const cleanPlan = generateProceduralPlan(item.townKey, townMem, epNum);

      item.title = cleanPlan.title;
      item.structure_name = cleanPlan.structure_name;
      item.series_label = cleanPlan.series_label;
      item.part = cleanPlan.part;
      item.total_parts = cleanPlan.total_parts;
      item.subtitle_2word = cleanPlan.subtitle_2word;
      item.problem = cleanPlan.problem;
      item.solution = cleanPlan.solution;
      item.plan = cleanPlan;
    } catch (e) {
      // circular require guard during bootstrap
    }
  }
  return item;
}

function loadQueue() {
  if (!fs.existsSync(QUEUE_FILE_PATH)) {
    const initial = {
      queue: [],
      last_updated: new Date().toISOString()
    };
    saveQueue(initial);
    return initial;
  }

  try {
    const raw = fs.readFileSync(QUEUE_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.queue)) {
      let modified = false;
      parsed.queue = parsed.queue.map(item => {
        const isLegacy = !item.plan || !item.plan.is_multipart ||
          /monsoon|culvert|asphalt|trench|drainage|pothole|expansion phase/i.test(JSON.stringify(item.plan));
        if (isLegacy) {
          modified = true;
          return sanitizeQueueEntry(item);
        }
        return item;
      });
      if (modified) {
        saveQueue(parsed);
      }
    }
    return parsed;
  } catch (e) {
    console.warn(`[QueueManager] Warning reading upload_queue.json (${e.message}). Resetting queue structure.`);
    const fallback = { queue: [], last_updated: new Date().toISOString() };
    saveQueue(fallback);
    return fallback;
  }
}

function saveQueue(queueData) {
  queueData.last_updated = new Date().toISOString();
  fs.mkdirSync(path.dirname(QUEUE_FILE_PATH), { recursive: true });
  fs.writeFileSync(QUEUE_FILE_PATH, JSON.stringify(queueData, null, 2), 'utf8');
}

/**
 * Find the next pending unuploaded episode for a given town
 */
function getNextQueuedEpisode(townKey) {
  const queueData = loadQueue();
  return queueData.queue.find(item => item.townKey === townKey && item.uploaded !== true);
}

/**
 * Safely delete a single file, catching locks or missing file errors
 */
function safeDeleteFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return 0;
  try {
    const sz = fs.statSync(filePath).size;
    fs.unlinkSync(filePath);
    return sz;
  } catch (err) {
    console.warn(`[QueueManager] Notice deleting file ${path.basename(filePath)}: ${err.message}`);
    return 0;
  }
}

/**
 * Safely and recursively delete a folder and all its contents without throwing on file locks
 */
function safeDeleteFolderRecursive(dirPath) {
  if (!dirPath || !fs.existsSync(dirPath)) return 0;
  let reclaimed = 0;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        reclaimed += safeDeleteFolderRecursive(fullPath);
      } else if (entry.isFile()) {
        reclaimed += safeDeleteFile(fullPath);
      }
    }

    try {
      fs.rmdirSync(dirPath);
    } catch (rmErr) {
      try { fs.rmSync(dirPath, { recursive: true, force: true }); } catch (e) {}
    }
  } catch (err) {
    console.warn(`[QueueManager] Notice deleting folder ${path.basename(dirPath)}: ${err.message}`);
  }

  return reclaimed;
}

/**
 * Clean up local files for a single uploaded episode immediately
 */
function cleanupUploadedEpisodeFiles(townKey, episode) {
  console.log(`[QueueManager] Cleaning up local assets for uploaded episode: ${townKey} Ep ${episode}...`);
  let reclaimedBytes = 0;
  const targetDirs = [path.resolve('output'), path.resolve('queue_out')];

  for (const baseDir of targetDirs) {
    if (!fs.existsSync(baseDir)) continue;

    // 1. Check directory matching: <town>_ep<ep>
    const epDir = path.join(baseDir, `${townKey}_ep${episode}`);
    if (fs.existsSync(epDir)) {
      reclaimedBytes += safeDeleteFolderRecursive(epDir);
    }

    // 2. Check loose video / thumbnail files matching: <town>_ep<ep>.*
    try {
      const files = fs.readdirSync(baseDir);
      for (const file of files) {
        if (file.startsWith(`${townKey}_ep${episode}.`) || file.startsWith(`${townKey}_ep${episode}_`)) {
          reclaimedBytes += safeDeleteFile(path.join(baseDir, file));
        }
      }
    } catch (e) {}
  }

  const reclaimedMB = (reclaimedBytes / (1024 * 1024)).toFixed(2);
  console.log(`[QueueManager] Post-publish cleanup: Reclaimed ${reclaimedMB} MB for ${townKey} Ep ${episode}.`);
  return reclaimedBytes;
}

/**
 * Mark a queued episode as uploaded and immediately trigger post-publish cleanup
 */
function markEpisodeUploaded(townKey, episode, uploadMetadata = {}) {
  const queueData = loadQueue();
  const entry = queueData.queue.find(item => item.townKey === townKey && Number(item.episode) === Number(episode));
  if (entry) {
    entry.uploaded = true;
    entry.uploaded_at = new Date().toISOString();
    Object.assign(entry, uploadMetadata);
    saveQueue(queueData);
    console.log(`[QueueManager] Marked queue item as uploaded: ${entry.id} (${townKey} Ep ${episode})`);

    // Clean up explicit local paths recorded in the queue item
    if (entry.local_video_path) safeDeleteFile(entry.local_video_path);
    if (entry.local_thumb_path) safeDeleteFile(entry.local_thumb_path);

    // Clean up episode directory and loose artifacts
    cleanupUploadedEpisodeFiles(townKey, episode);
    return entry;
  }
  return null;
}

/**
 * Add or update an episode entry in the queue
 */
function enqueueEpisode(entry) {
  const queueData = loadQueue();
  const existingIdx = queueData.queue.findIndex(item => item.townKey === entry.townKey && Number(item.episode) === Number(entry.episode));
  if (existingIdx >= 0) {
    queueData.queue[existingIdx] = { ...queueData.queue[existingIdx], ...entry };
  } else {
    queueData.queue.push(entry);
  }
  saveQueue(queueData);
  console.log(`[QueueManager] Enqueued episode: ${entry.id || entry.tag_name} (${entry.townKey} Ep ${entry.episode})`);
  return entry;
}

/**
 * Recursively measure total byte size of target folders
 */
function measureFolderBytes(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  let total = 0;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += measureFolderBytes(fullPath);
      } else if (entry.isFile()) {
        try {
          total += fs.statSync(fullPath).size;
        } catch (e) {}
      }
    }
  } catch (e) {}

  return total;
}

/**
 * Measure total queue disk usage across output/ and queue_out/
 */
function measureTotalQueueBytes() {
  const outputBytes = measureFolderBytes(path.resolve('output'));
  const queueOutBytes = measureFolderBytes(path.resolve('queue_out'));
  const total = outputBytes + queueOutBytes;

  return {
    totalBytes: total,
    totalMB: (total / (1024 * 1024)).toFixed(2),
    totalGB: (total / (1024 * 1024 * 1024)).toFixed(3),
    isUnderWarningLimit: total < MAX_QUEUE_STORAGE_BYTES,
    isUnderHardCap: total < HARD_CAP_STORAGE_BYTES
  };
}

/**
 * Run automatic cleanup: delete local raw clips, temp audio, and rendered mp4/jpg
 * for episodes already marked uploaded: true in upload_queue.json or town_memory.json
 */
function cleanupUploadedLocalFiles(queueData = null, townMemory = null) {
  const queue = queueData || loadQueue();
  let memory = townMemory;
  if (!memory) {
    const memPath = path.resolve('state', 'town_memory.json');
    if (fs.existsSync(memPath)) {
      try {
        memory = JSON.parse(fs.readFileSync(memPath, 'utf8'));
      } catch (e) {}
    }
  }

  console.log(`\n[QueueManager] Running automatic local storage cleanup...`);
  let reclaimedBytes = 0;
  let deletedFoldersCount = 0;

  // Build lookup of uploaded episodes: { "smart_city": Set([1, 2, 3, 4]) }
  const uploadedSet = {
    smart_city: new Set(),
    mountain_village: new Set(),
    desert_town: new Set()
  };

  // 1. From queue entries marked uploaded: true
  if (Array.isArray(queue.queue)) {
    for (const item of queue.queue) {
      if (item.uploaded === true && item.townKey) {
        if (!uploadedSet[item.townKey]) uploadedSet[item.townKey] = new Set();
        uploadedSet[item.townKey].add(Number(item.episode));

        // Clean up explicit local file paths if present
        if (item.local_video_path) reclaimedBytes += safeDeleteFile(item.local_video_path);
        if (item.local_thumb_path) reclaimedBytes += safeDeleteFile(item.local_thumb_path);
      }
    }
  }

  // 2. From town memory history
  if (memory) {
    for (const townKey of Object.keys(memory)) {
      if (!uploadedSet[townKey]) uploadedSet[townKey] = new Set();
      const curEp = Number(memory[townKey].episode || 0);
      for (let ep = 1; ep <= curEp; ep++) {
        uploadedSet[townKey].add(ep);
      }
    }
  }

  // Check output/ and queue_out/ directories
  const targetDirs = [path.resolve('output'), path.resolve('queue_out')];

  for (const baseDir of targetDirs) {
    if (!fs.existsSync(baseDir)) continue;

    try {
      const entries = fs.readdirSync(baseDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(baseDir, entry.name);

        // Match directory names or file names like "smart_city_ep1", "smart_city_ep2.mp4"
        const match = entry.name.match(/^([a-z_]+)_ep(\d+)/i);
        if (match) {
          const town = match[1].toLowerCase();
          const ep = Number(match[2]);

          if (uploadedSet[town] && uploadedSet[town].has(ep)) {
            console.log(`[QueueManager] Reclaiming disk space for uploaded episode: ${entry.name}`);
            if (entry.isDirectory()) {
              reclaimedBytes += safeDeleteFolderRecursive(fullPath);
              deletedFoldersCount++;
            } else if (entry.isFile()) {
              reclaimedBytes += safeDeleteFile(fullPath);
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[QueueManager] Notice scanning ${path.basename(baseDir)}: ${err.message}`);
    }
  }

  const reclaimedMB = (reclaimedBytes / (1024 * 1024)).toFixed(2);
  const currentUsage = measureTotalQueueBytes();

  console.log(`[QueueManager] Storage Cleanup complete!`);
  console.log(`[QueueManager] Reclaimed:  ${reclaimedMB} MB (${deletedFoldersCount} episode directories removed)`);
  console.log(`[QueueManager] Remaining:  ${currentUsage.totalMB} MB / 1800 MB soft limit (Hard Cap: 2048 MB)\n`);

  return {
    reclaimedBytes,
    reclaimedMB,
    deletedFoldersCount,
    currentUsage
  };
}

/**
 * Storage Cap Gate:
 * Evaluates current local disk usage against the 1800 MB soft threshold / 2048 MB hard cap.
 * If over the cap, runs cleanup. If still over the cap, cleanly signals to pause generation (exit code 0).
 */
function checkStorageCapGate() {
  let usage = measureTotalQueueBytes();

  // If over or at soft threshold (1800 MB)
  if (!usage.isUnderWarningLimit) {
    console.log(`[StorageGate] Disk usage at ${usage.totalMB} MB (>= 1800 MB threshold). Attempting cleanup...`);
    const cleanRes = cleanupUploadedLocalFiles();
    usage = measureTotalQueueBytes();

    if (!usage.isUnderWarningLimit) {
      console.log(`\n======================================================`);
      console.log(`[StorageGate] STORAGE CAP REACHED: ${usage.totalMB} MB / 1800 MB limit (Hard Cap: 2048 MB)`);
      console.log(`[StorageGate] No space was freed by cleanup because queued episodes are pending publication.`);
      console.log(`[StorageGate] Cleanly pausing generation for this session (exit code 0).`);
      console.log(`[StorageGate] Once scheduled GitHub Actions publish queued episodes, local cleanup will free space and generation will automatically resume.`);
      console.log(`======================================================\n`);
      return { canProceed: false, usage, reclaimedMB: cleanRes.reclaimedMB, reason: 'STORAGE_CAPPED' };
    } else {
      console.log(`[StorageGate] Cleanup freed ${cleanRes.reclaimedMB} MB! Storage now at ${usage.totalMB} MB (< 1800 MB). Proceeding with generation.`);
    }
  }

  return { canProceed: true, usage };
}

module.exports = {
  QUEUE_FILE_PATH,
  MAX_QUEUE_STORAGE_BYTES,
  HARD_CAP_STORAGE_BYTES,
  loadQueue,
  saveQueue,
  getNextQueuedEpisode,
  markEpisodeUploaded,
  enqueueEpisode,
  measureTotalQueueBytes,
  cleanupUploadedLocalFiles,
  cleanupUploadedEpisodeFiles,
  checkStorageCapGate,
  safeDeleteFile,
  safeDeleteFolderRecursive
};
