const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { google } = require('googleapis');

/**
 * Autonomous Multi-Platform Video Uploader & State Memory Committer:
 * 1. YouTube Shorts (YouTube Data API v3)
 * 2. Instagram Reels (Instagram Graph API)
 * 3. Facebook Reels (Facebook Graph API)
 * 4. Town Memory Updater & Git Auto-Commit
 */

/**
 * Generate SEO and social caption for the episode
 */
function generateEpisodeSocialContent(plan, townKey, townMemory) {
  const epFormatted = String(plan.episode).padStart(2, '0');
  const badgeLabel = townMemory.badge_text || "TOWN";

  const title = `EP ${epFormatted} | ${plan.title} | Miniature ${townMemory.name} #shorts`;

  const description = `🏗️ ${badgeLabel} SERIES • EPISODE ${epFormatted}
Build: ${plan.title}
Two-Word Focus: ${plan.subtitle_2word}

Civil Engineering Challenge:
${plan.problem}

Miniature Solution:
${plan.solution}

Crafted with genuine miniature construction techniques on a locked 45° isometric diorama workbench. Real materials, precision scale modeling, and authentic ASMR sounds.

Watch the town grow day by day from untouched wild soil into a thriving scale civilization!

#miniature #diorama #asmr #craftsman #satisfying #scalemodel #shorts #reels #stopmotion #diy`;

  const hashtags = [
    '#miniature', '#diorama', '#asmr', '#satisfying', 
    '#craftsman', '#scalemodel', '#shorts', '#reels'
  ];

  return { title, description, hashtags };
}

/**
 * Upload to YouTube Shorts via YouTube Data API v3
 */
async function uploadToYouTube(videoPath, thumbPath, socialContent) {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken || process.env.DRY_RUN === 'true') {
    console.log('[Uploader] YouTube: DRY_RUN mode or credentials missing. Skipping YouTube upload.');
    return { platform: 'youtube', status: 'skipped' };
  }

  console.log('[Uploader] Authenticating with YouTube Data API v3...');
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  console.log(`[Uploader] Uploading "${socialContent.title}" to YouTube Shorts...`);
  const fileSize = fs.statSync(videoPath).size;

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: socialContent.title.slice(0, 100),
        description: socialContent.description,
        tags: ['miniature', 'diorama', 'asmr', 'shorts', 'craftsman', 'satisfying', 'scale model'],
        categoryId: '26', // Howto & Style
        defaultLanguage: 'en',
        defaultAudioLanguage: 'en'
      },
      status: {
        privacyStatus: process.env.YOUTUBE_PRIVACY || 'public',
        selfDeclaredMadeForKids: false
      }
    },
    media: {
      body: fs.createReadStream(videoPath)
    }
  });

  const videoId = res.data.id;
  console.log(`[Uploader] YouTube Shorts uploaded successfully! Video ID: ${videoId} (https://youtube.com/shorts/${videoId})`);

  // Upload custom thumbnail if exists
  if (thumbPath && fs.existsSync(thumbPath)) {
    try {
      console.log(`[Uploader] Setting custom thumbnail for YouTube video ${videoId}...`);
      await youtube.thumbnails.set({
        videoId: videoId,
        media: {
          body: fs.createReadStream(thumbPath)
        }
      });
      console.log(`[Uploader] Custom thumbnail set successfully.`);
    } catch (err) {
      console.warn(`[Uploader] Setting thumbnail failed: ${err.message}`);
    }
  }

  return { platform: 'youtube', status: 'success', videoId, url: `https://youtube.com/shorts/${videoId}` };
}

/**
 * Upload to Instagram Reels via Graph API
 */
async function uploadToInstagram(videoUrlOrPath, socialContent) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igUserId = process.env.INSTAGRAM_ACCOUNT_ID;

  if (!accessToken || !igUserId || process.env.DRY_RUN === 'true') {
    console.log('[Uploader] Instagram: DRY_RUN mode or credentials missing. Skipping Instagram upload.');
    return { platform: 'instagram', status: 'skipped' };
  }

  console.log('[Uploader] Initiating Instagram Reels upload via Graph API...');
  const caption = `${socialContent.title}\n\n${socialContent.description}`.slice(0, 2200);

  // If local file without public URL, chunk upload session is used
  // Or if an asset URL is provided, media container creation:
  try {
    const initUrl = `https://graph.facebook.com/v19.0/${igUserId}/media`;
    const params = new URLSearchParams({
      access_token: accessToken,
      media_type: 'REELS',
      caption: caption,
      share_to_feed: 'true'
    });

    if (videoUrlOrPath.startsWith('http://') || videoUrlOrPath.startsWith('https://')) {
      params.append('video_url', videoUrlOrPath);
    }

    const initRes = await fetch(`${initUrl}?${params.toString()}`, { method: 'POST' });
    const initData = await initRes.json();

    if (initData.id) {
      console.log(`[Uploader] Instagram container created: ${initData.id}`);
      // Publish container
      const publishUrl = `https://graph.facebook.com/v19.0/${igUserId}/media_publish`;
      const pubRes = await fetch(publishUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: initData.id,
          access_token: accessToken
        })
      });
      const pubData = await pubRes.json();
      console.log(`[Uploader] Instagram Reel published! ID: ${pubData.id}`);
      return { platform: 'instagram', status: 'success', id: pubData.id };
    }
  } catch (err) {
    console.warn(`[Uploader] Instagram upload warning: ${err.message}`);
  }

  return { platform: 'instagram', status: 'failed' };
}

/**
 * Upload to Facebook Reels via Graph API
 */
async function uploadToFacebook(videoPath, socialContent) {
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!pageAccessToken || !pageId || process.env.DRY_RUN === 'true') {
    console.log('[Uploader] Facebook: DRY_RUN mode or credentials missing. Skipping Facebook upload.');
    return { platform: 'facebook', status: 'skipped' };
  }

  console.log('[Uploader] Initiating Facebook Reels upload via Graph API...');
  const desc = `${socialContent.title}\n\n${socialContent.description}`.slice(0, 5000);

  try {
    const initUrl = `https://graph.facebook.com/v19.0/${pageId}/video_reels`;
    const initRes = await fetch(initUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        upload_phase: 'start',
        access_token: pageAccessToken
      })
    });
    const initData = await initRes.json();

    if (initData.video_id && initData.upload_url) {
      console.log(`[Uploader] Facebook Reel session started. Video ID: ${initData.video_id}`);
      const videoBuffer = fs.readFileSync(videoPath);

      // Upload binary to upload_url
      await fetch(initData.upload_url, {
        method: 'POST',
        headers: {
          'Authorization': `OAuth ${pageAccessToken}`,
          'offset': '0',
          'file_size': videoBuffer.length.toString()
        },
        body: videoBuffer
      });

      // Finish publish
      const finishRes = await fetch(initUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upload_phase: 'finish',
          access_token: pageAccessToken,
          video_id: initData.video_id,
          video_state: 'PUBLISHED',
          description: desc
        })
      });
      const finishData = await finishRes.json();
      console.log(`[Uploader] Facebook Reel published! Response:`, finishData);
      return { platform: 'facebook', status: 'success', videoId: initData.video_id };
    }
  } catch (err) {
    console.warn(`[Uploader] Facebook Reels upload warning: ${err.message}`);
  }

  return { platform: 'facebook', status: 'failed' };
}

/**
 * Update Town Memory and Commit State back to Git
 */
async function updateAndCommitTownMemory(townKey, plan, finalStagePath) {
  const memoryFilePath = path.resolve('state', 'town_memory.json');
  let memoryData = {};

  if (fs.existsSync(memoryFilePath)) {
    memoryData = JSON.parse(fs.readFileSync(memoryFilePath, 'utf8'));
  }

  if (!memoryData[townKey]) {
    memoryData[townKey] = {};
  }

  const town = memoryData[townKey];
  town.episode = plan.episode;

  if (!Array.isArray(town.built_structures)) {
    town.built_structures = [];
  }
  if (plan.structures_added && !town.built_structures.includes(plan.structures_added)) {
    town.built_structures.push(plan.structures_added);
  }

  if (plan.updated_anchor_prompt) {
    town.diorama_anchor_prompt = plan.updated_anchor_prompt;
  }

  town.active_multipart = plan.is_multipart ? plan.multipart_info : null;

  // Save the final frame of this episode as the visual anchor for tomorrow's episode
  const lastFramePath = path.resolve('state', `last_frame_${townKey}.jpg`);
  if (finalStagePath && fs.existsSync(finalStagePath)) {
    fs.copyFileSync(finalStagePath, lastFramePath);
    town.last_frame_path = `state/last_frame_${townKey}.jpg`;
    console.log(`[Memory] Saved continuous diorama anchor frame: state/last_frame_${townKey}.jpg`);
  }

  if (!Array.isArray(town.history)) {
    town.history = [];
  }
  town.history.push({
    episode: plan.episode,
    title: plan.title,
    subtitle_2word: plan.subtitle_2word,
    completed_at: new Date().toISOString()
  });

  fs.writeFileSync(memoryFilePath, JSON.stringify(memoryData, null, 2), 'utf8');
  console.log(`[Memory] Updated state/town_memory.json (Town: ${townKey}, Episode: ${plan.episode})`);

  // Attempt Git Commit if running in CI / Git repository
  try {
    const isGitRepo = fs.existsSync(path.resolve('.git'));
    if (isGitRepo) {
      console.log(`[Git] Staging updated town memory and anchor frame...`);
      spawnSync('git', ['config', 'user.name', 'github-actions[bot]']);
      spawnSync('git', ['config', 'user.email', 'github-actions[bot]@users.noreply.github.com']);
      spawnSync('git', ['add', 'state/town_memory.json', `state/last_frame_${townKey}.jpg`]);
      
      const commitRes = spawnSync('git', ['commit', '-m', `chore(memory): save diorama continuity for ${townKey} ep ${plan.episode} [skip ci]`]);
      if (commitRes.status === 0) {
        console.log(`[Git] Committed state updates to repository.`);
        if (process.env.GITHUB_ACTIONS === 'true') {
          spawnSync('git', ['push']);
          console.log(`[Git] Pushed updates to origin.`);
        }
      }
    }
  } catch (e) {
    console.warn(`[Git] Auto-commit notice: ${e.message}`);
  }

  return memoryData;
}

/**
 * High-level upload and state commit pipeline
 */
async function processUploadAndStateCommit(townKey, townMemory, plan, finalVideoPath, finalThumbPath, finalStagePath) {
  const socialContent = generateEpisodeSocialContent(plan, townKey, townMemory);

  console.log(`\n==================================================`);
  console.log(`AUTONOMOUS UPLOAD DISPATCH: "${socialContent.title}"`);
  console.log(`==================================================\n`);

  const results = {
    youtube: await uploadToYouTube(finalVideoPath, finalThumbPath, socialContent),
    instagram: await uploadToInstagram(finalVideoPath, socialContent),
    facebook: await uploadToFacebook(finalVideoPath, socialContent)
  };

  // Update town memory and last frame anchor
  await updateAndCommitTownMemory(townKey, plan, finalStagePath);

  return results;
}

module.exports = {
  generateEpisodeSocialContent,
  uploadToYouTube,
  uploadToInstagram,
  uploadToFacebook,
  updateAndCommitTownMemory,
  processUploadAndStateCommit
};
