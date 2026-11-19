const fs = require('fs');
const path = require('path');

/**
 * Queue Manager & Local Storage Controller
 * Manages state/upload_queue.json and enforces the strict 1.8 GB / 2.0 GB local disk usage cap.
 */

const QUEUE_FILE_PATH = path.resolve('state', 'upload_queue.json');
const MAX_QUEUE_STORAGE_BYTES = 1.8 * 1024 * 1024 * 1024; // 1.8 GB threshold
const HARD_CAP_STORAGE_BYTES = 2.0 * 1024 * 1024 * 1024;  // 2.0 GB hard cap

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
    return JSON.parse(raw);
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
 * Mark a queued episode as uploaded
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
 * Recursively delete folder and contents
 */
function deleteFolderRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  let reclaimed = 0;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        reclaimed += deleteFolderRecursive(fullPath);
      } else if (entry.isFile()) {
        try {
          const sz = fs.statSync(fullPath).size;
          fs.unlinkSync(fullPath);
          reclaimed += sz;
        } catch (e) {}
      }
    }
    fs.rmdirSync(dirPath);
  } catch (e) {}

  return reclaimed;
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

  // 1. From queue
  if (Array.isArray(queue.queue)) {
    for (const item of queue.queue) {
      if (item.uploaded === true && item.townKey && uploadedSet[item.townKey]) {
        uploadedSet[item.townKey].add(Number(item.episode));
      }
    }
  }

  // 2. From town memory history
  if (memory) {
    for (const townKey of Object.keys(uploadedSet)) {
      if (memory[townKey]) {
        const curEp = Number(memory[townKey].episode || 0);
        for (let ep = 1; ep <= curEp; ep++) {
          uploadedSet[townKey].add(ep);
        }
      }
    }
  }

  // Check output/ and queue_out/ directories
  const targetDirs = [path.resolve('output'), path.resolve('queue_out')];

  for (const baseDir of targetDirs) {
    if (!fs.existsSync(baseDir)) continue;

    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(baseDir, entry.name);
      
      // Match directory names like "smart_city_ep1", "smart_city_ep2"
      const match = entry.name.match(/^([a-z_]+)_ep(\d+)/i);
      if (match) {
        const town = match[1].toLowerCase();
        const ep = Number(match[2]);

        if (uploadedSet[town] && uploadedSet[town].has(ep)) {
          console.log(`[QueueManager] Reclaiming disk space for uploaded episode: ${entry.name}`);
          if (entry.isDirectory()) {
            reclaimedBytes += deleteFolderRecursive(fullPath);
            deletedFoldersCount++;
          } else if (entry.isFile()) {
            const sz = fs.statSync(fullPath).size;
            fs.unlinkSync(fullPath);
            reclaimedBytes += sz;
          }
        }
      }
    }
  }

  const reclaimedMB = (reclaimedBytes / (1024 * 1024)).toFixed(2);
  const currentUsage = measureTotalQueueBytes();

  console.log(`[QueueManager] Storage Cleanup complete!`);
  console.log(`[QueueManager] Reclaimed:  ${reclaimedMB} MB (${deletedFoldersCount} episode directories removed)`);
  console.log(`[QueueManager] Remaining:  ${currentUsage.totalMB} MB / 1800 MB limit (Cap: 2048 MB)\n`);

  return {
    reclaimedBytes,
    reclaimedMB,
    deletedFoldersCount,
    currentUsage
  };
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
  cleanupUploadedLocalFiles
};
