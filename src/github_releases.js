const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

/**
 * GitHub Releases Helper for Mini Township Autopilot
 * Stores large pre-rendered .mp4 and .jpg assets in GitHub Releases instead of Git,
 * keeping the git repository lightweight (<5 MB) and avoiding Git's 100 MB limit.
 */

function getRepoInfo() {
  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    if (owner && repo) return { owner, repo };
  }

  try {
    const res = spawnSync('git', ['remote', 'get-url', 'origin']);
    if (res.status === 0) {
      const url = res.stdout.toString().trim();
      // Match https://github.com/owner/repo.git or git@github.com:owner/repo.git
      const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?$/);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }
    }
  } catch (e) {}

  return { owner: 'chhabramadhav215', repo: 'real-mini-township-autopilot' };
}

function getGitHubToken() {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;
}

/**
 * Create or retrieve an existing release by tag name
 */
async function getOrCreateRelease(tagName, title, notes) {
  const token = getGitHubToken();
  const { owner, repo } = getRepoInfo();

  if (!token) {
    throw new Error('GITHUB_TOKEN not found in environment. Please add GITHUB_TOKEN to your .env file or environment.');
  }

  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'real-mini-township-autopilot'
  };

  // 1. Check if release already exists
  const getUrl = `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tagName)}`;
  const getRes = await fetch(getUrl, { headers });
  if (getRes.status === 200) {
    const existing = await getRes.json();
    return existing;
  }

  // 2. Create release if not found
  const createUrl = `https://api.github.com/repos/${owner}/${repo}/releases`;
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tag_name: tagName,
      name: title || tagName,
      body: notes || `Autonomous Mini Township Diorama Pre-Rendered Asset for ${tagName}`,
      draft: false,
      prerelease: false
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create release ${tagName} (${createRes.status}): ${errText}`);
  }

  return await createRes.json();
}

/**
 * Upload a local file as an asset to a GitHub Release
 */
async function uploadAsset(release, filePath, assetName, contentType) {
  const token = getGitHubToken();
  const { owner, repo } = getRepoInfo();

  if (!token) throw new Error('GITHUB_TOKEN missing.');
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  const fileStats = fs.statSync(filePath);
  const fileBuffer = fs.readFileSync(filePath);

  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': contentType || 'application/octet-stream',
    'Content-Length': fileStats.size.toString(),
    'User-Agent': 'real-mini-township-autopilot'
  };

  // If asset already exists in release, delete it first to overwrite
  if (Array.isArray(release.assets)) {
    const existingAsset = release.assets.find(a => a.name === assetName);
    if (existingAsset) {
      console.log(`[GitHubReleases] Asset ${assetName} already exists in release. Deleting existing asset id ${existingAsset.id}...`);
      await deleteAsset(existingAsset.id).catch(() => {});
    }
  }

  const uploadUrl = `https://uploads.github.com/repos/${owner}/${repo}/releases/${release.id}/assets?name=${encodeURIComponent(assetName)}`;
  console.log(`[GitHubReleases] Uploading ${assetName} (${(fileStats.size / (1024 * 1024)).toFixed(2)} MB)...`);

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers,
    body: fileBuffer
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to upload asset ${assetName} (${res.status}): ${errText}`);
  }

  const assetData = await res.json();
  console.log(`[GitHubReleases] Asset uploaded successfully: ${assetData.browser_download_url}`);
  return assetData;
}

/**
 * Download a release asset to local disk
 */
async function downloadAsset(downloadUrl, destPath) {
  const token = getGitHubToken();
  const headers = {
    'User-Agent': 'real-mini-township-autopilot',
    'Accept': 'application/octet-stream'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log(`[GitHubReleases] Downloading asset from ${downloadUrl}...`);
  const res = await fetch(downloadUrl, { headers });
  if (!res.ok) {
    throw new Error(`Failed to download asset (${res.status}): ${await res.text()}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buffer);
  console.log(`[GitHubReleases] Saved asset to ${destPath} (${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`);
  return destPath;
}

/**
 * Delete an asset from a release to save cloud storage after publishing
 */
async function deleteAsset(assetId) {
  const token = getGitHubToken();
  const { owner, repo } = getRepoInfo();

  if (!token) return false;

  const url = `https://api.github.com/repos/${owner}/${repo}/releases/assets/${assetId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'real-mini-township-autopilot'
    }
  });

  return res.status === 204;
}

/**
 * Delete an entire release and its associated git tag
 */
async function deleteReleaseAndTag(releaseId, tagName) {
  const token = getGitHubToken();
  const { owner, repo } = getRepoInfo();

  if (!token) return false;

  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'real-mini-township-autopilot'
  };

  if (releaseId) {
    await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/${releaseId}`, {
      method: 'DELETE',
      headers
    }).catch(() => {});
  }

  if (tagName) {
    await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/tags/${tagName}`, {
      method: 'DELETE',
      headers
    }).catch(() => {});
  }

  return true;
}

module.exports = {
  getRepoInfo,
  getGitHubToken,
  getOrCreateRelease,
  uploadAsset,
  downloadAsset,
  deleteAsset,
  deleteReleaseAndTag
};
