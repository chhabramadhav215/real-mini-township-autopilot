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

  const title = `${plan.title} | ${townMemory.name} Construction #shorts`;

  const description = `🏗️ Construction Process: ${plan.title}
Focus: ${plan.subtitle_2word}

Civil Engineering Challenge:
${plan.problem}

Construction Solution:
${plan.solution}

Authentic real-world construction and workshop craftsmanship. Real materials, precision engineering, and authentic ASMR sounds.

Watch the structure develop step by step!

#construction #building #craftsman #asmr #satisfying #engineering #process #shorts #reels #diy`;

  const hashtags = [
    '#construction', '#building', '#asmr', '#satisfying', 
    '#craftsman', '#engineering', '#process', '#shorts', '#reels'
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

  try {
    console.log('[Uploader] Authenticating with YouTube Data API v3...');
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    console.log(`[Uploader] Uploading "${socialContent.title}" to YouTube Shorts...`);
    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: socialContent.title.slice(0, 100),
          description: socialContent.description,
          tags: ['construction', 'building', 'asmr', 'shorts', 'craftsman', 'satisfying', 'engineering', 'process'],
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
        console.warn(`[Uploader] Setting thumbnail warning: ${err.message}`);
      }
    }

    return { platform: 'youtube', status: 'success', videoId, url: `https://youtube.com/shorts/${videoId}` };
  } catch (err) {
    console.warn(`[Uploader] YouTube upload error: ${err.message}. Skipping YouTube upload gracefully.`);
    return { platform: 'youtube', status: 'failed', error: err.message };
  }
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

  console.log('[Uploader] Initiating Instagram Reels upload via Graph API v21.0...');
  const caption = `${socialContent.title}\n\n${socialContent.description}`.slice(0, 2200);

  try {
    const isPublicUrl = typeof videoUrlOrPath === 'string' && (videoUrlOrPath.startsWith('http://') || videoUrlOrPath.startsWith('https://'));
    if (!isPublicUrl) {
      console.warn(`[Uploader] Instagram Reels requires a public HTTPS video_url. Received non-URL path: ${videoUrlOrPath}. Skipping Instagram upload.`);
      return { platform: 'instagram', status: 'skipped', reason: 'Public HTTPS video_url required' };
    }

    const initUrl = `https://graph.facebook.com/v21.0/${igUserId}/media`;
    const params = new URLSearchParams({
      access_token: accessToken,
      media_type: 'REELS',
      caption: caption,
      share_to_feed: 'true',
      video_url: videoUrlOrPath
    });

    console.log(`[Uploader] Creating Instagram Reel container with video_url: ${videoUrlOrPath.slice(0, 80)}...`);
    const initRes = await fetch(`${initUrl}?${params.toString()}`, { method: 'POST' });
    const initData = await initRes.json();

    if (initData.error) {
      console.error(`[Uploader] Instagram container creation error:`, JSON.stringify(initData.error));
      return { platform: 'instagram', status: 'failed', error: initData.error.message, details: initData.error };
    }

    if (!initData.id) {
      console.error(`[Uploader] Instagram container creation failed, no container ID returned:`, JSON.stringify(initData));
      return { platform: 'instagram', status: 'failed', error: 'No container ID returned', details: initData };
    }

    console.log(`[Uploader] Instagram container created: ${initData.id}. Polling container status until FINISHED...`);

    // Poll GET https://graph.facebook.com/v21.0/${initData.id}?fields=status_code&access_token=${accessToken}
    const statusUrl = `https://graph.facebook.com/v21.0/${initData.id}?fields=status_code&access_token=${encodeURIComponent(accessToken)}`;
    let isReady = false;
    const maxPollAttempts = 30; // 30 * 4s = up to 120s
    const pollIntervalMs = 4000;

    for (let attempt = 1; attempt <= maxPollAttempts; attempt++) {
      await new Promise(r => setTimeout(r, pollIntervalMs));
      try {
        const statusRes = await fetch(statusUrl);
        const statusData = await statusRes.json();

        if (statusData.error) {
          console.error(`[Uploader] Instagram container status poll error (attempt ${attempt}):`, JSON.stringify(statusData.error));
        }

        const statusCode = statusData?.status_code;
        console.log(`[Uploader] Instagram container ${initData.id} status (poll ${attempt}/${maxPollAttempts}): ${statusCode || 'UNKNOWN'}`);

        if (statusCode === 'FINISHED') {
          isReady = true;
          break;
        } else if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
          console.error(`[Uploader] Instagram container processing failed with status: ${statusCode}:`, JSON.stringify(statusData));
          return { platform: 'instagram', status: 'failed', error: `Container status: ${statusCode}`, details: statusData };
        }
      } catch (pollErr) {
        console.warn(`[Uploader] Notice polling Instagram container status (attempt ${attempt}): ${pollErr.message}`);
      }
    }

    if (!isReady) {
      console.error(`[Uploader] Instagram container ${initData.id} timed out before reaching FINISHED status.`);
      return { platform: 'instagram', status: 'failed', error: 'Container processing timed out' };
    }

    // Publish container via POST /media_publish
    console.log(`[Uploader] Instagram container ${initData.id} is ready. Publishing Reel...`);
    const publishUrl = `https://graph.facebook.com/v21.0/${igUserId}/media_publish`;
    const pubRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: initData.id,
        access_token: accessToken
      })
    });
    const pubData = await pubRes.json();

    if (pubData.error) {
      console.error(`[Uploader] Instagram media publish error:`, JSON.stringify(pubData.error));
      return { platform: 'instagram', status: 'failed', error: pubData.error.message, details: pubData.error };
    }

    if (pubData.id) {
      console.log(`[Uploader] Instagram Reel published successfully! Media ID: ${pubData.id}`);
      return { platform: 'instagram', status: 'success', id: pubData.id, details: pubData };
    }

    console.warn(`[Uploader] Instagram media publish returned unexpected response:`, JSON.stringify(pubData));
    return { platform: 'instagram', status: 'failed', error: 'No media ID returned on publish', details: pubData };
  } catch (err) {
    console.error(`[Uploader] Instagram upload exception: ${err.message}`);
    return { platform: 'instagram', status: 'failed', error: err.message };
  }
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

  console.log('[Uploader] Initiating Facebook Reels upload via Graph API v21.0...');
  const desc = `${socialContent.title}\n\n${socialContent.description}`.slice(0, 5000);

  // 1. Resolve Page access token via GET https://graph.facebook.com/v21.0/${pageId}?fields=access_token&access_token=${pageAccessToken}
  // (fallback to configured pageAccessToken if needed for System User or pre-resolved page tokens)
  let effectivePageToken = pageAccessToken;
  try {
    console.log(`[Uploader] Resolving Facebook Page access token for Page ${pageId}...`);
    const pageTokenUrl = `https://graph.facebook.com/v21.0/${pageId}?fields=access_token&access_token=${encodeURIComponent(pageAccessToken)}`;
    const pageTokenRes = await fetch(pageTokenUrl);
    const pageTokenData = await pageTokenRes.json();

    if (pageTokenData && pageTokenData.access_token) {
      effectivePageToken = pageTokenData.access_token;
      console.log(`[Uploader] Facebook Page access token resolved successfully.`);
    } else {
      if (pageTokenData && pageTokenData.error) {
        console.warn(`[Uploader] Page access token resolution notice: ${pageTokenData.error.message}. Falling back to configured token.`);
      } else {
        console.log(`[Uploader] Page access_token field not returned, falling back to configured token.`);
      }
    }
  } catch (err) {
    console.warn(`[Uploader] Notice resolving Page access token: ${err.message}. Falling back to configured token.`);
  }

  // 2. Start Video Reel session
  try {
    const initUrl = `https://graph.facebook.com/v21.0/${pageId}/video_reels`;
    const initRes = await fetch(initUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        upload_phase: 'start',
        access_token: effectivePageToken
      })
    });
    const initData = await initRes.json();

    if (initData.error) {
      console.error(`[Uploader] Facebook Reel start error:`, JSON.stringify(initData.error));
      return { platform: 'facebook', status: 'failed', error: initData.error.message, details: initData.error };
    }

    if (initData.video_id && initData.upload_url) {
      console.log(`[Uploader] Facebook Reel session started. Video ID: ${initData.video_id}`);
      const videoBuffer = fs.readFileSync(videoPath);

      // Upload binary to upload_url
      console.log(`[Uploader] Uploading video binary to Facebook (${(videoBuffer.length / (1024 * 1024)).toFixed(2)} MB)...`);
      const uploadRes = await fetch(initData.upload_url, {
        method: 'POST',
        headers: {
          'Authorization': `OAuth ${effectivePageToken}`,
          'offset': '0',
          'file_size': videoBuffer.length.toString()
        },
        body: videoBuffer
      });
      const uploadData = await uploadRes.json().catch(() => ({}));

      if (uploadData.error) {
        console.error(`[Uploader] Facebook Reel binary upload error:`, JSON.stringify(uploadData.error));
        return { platform: 'facebook', status: 'failed', error: uploadData.error.message, details: uploadData.error };
      }

      // Finish publish
      console.log(`[Uploader] Publishing Facebook Reel ${initData.video_id}...`);
      const finishRes = await fetch(initUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upload_phase: 'finish',
          access_token: effectivePageToken,
          video_id: initData.video_id,
          video_state: 'PUBLISHED',
          description: desc
        })
      });
      const finishData = await finishRes.json();

      if (finishData.error) {
        console.error(`[Uploader] Facebook Reel finish error:`, JSON.stringify(finishData.error));
        return { platform: 'facebook', status: 'failed', error: finishData.error.message, details: finishData.error };
      }

      console.log(`[Uploader] Facebook Reel published! Response:`, finishData);
      return { platform: 'facebook', status: 'success', videoId: initData.video_id, details: finishData };
    }

    console.warn(`[Uploader] Facebook Reel session start returned unexpected response:`, JSON.stringify(initData));
    return { platform: 'facebook', status: 'failed', error: 'Missing video_id or upload_url', details: initData };
  } catch (err) {
    console.error(`[Uploader] Facebook Reels upload exception: ${err.message}`);
    return { platform: 'facebook', status: 'failed', error: err.message };
  }
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
          const pushRes = spawnSync('git', ['push', 'origin', 'HEAD:main']);
          if (pushRes.status === 0) {
            console.log(`[Git] Pushed memory updates to origin.`);
          } else {
            console.log(`[Git] In-script push deferred to workflow step.`);
          }
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
async function processUploadAndStateCommit(townKey, townMemory, plan, finalVideoPath, finalThumbPath, finalStagePath, optionsOrUrl = {}) {
  const socialContent = generateEpisodeSocialContent(plan, townKey, townMemory);

  console.log(`\n==================================================`);
  console.log(`AUTONOMOUS UPLOAD DISPATCH: "${socialContent.title}"`);
  console.log(`==================================================\n`);

  let ytResult = { platform: 'youtube', status: 'skipped' };
  let igResult = { platform: 'instagram', status: 'skipped' };
  let fbResult = { platform: 'facebook', status: 'skipped' };

  // Determine Instagram video source: prefer public HTTPS video_url if provided
  let igVideoSource = finalVideoPath;
  if (typeof optionsOrUrl === 'string' && (optionsOrUrl.startsWith('http://') || optionsOrUrl.startsWith('https://'))) {
    igVideoSource = optionsOrUrl;
  } else if (optionsOrUrl && typeof optionsOrUrl === 'object') {
    if (optionsOrUrl.videoDownloadUrl) {
      igVideoSource = optionsOrUrl.videoDownloadUrl;
    } else if (optionsOrUrl.instagramVideoUrl) {
      igVideoSource = optionsOrUrl.instagramVideoUrl;
    }
  }

  try {
    ytResult = await uploadToYouTube(finalVideoPath, finalThumbPath, socialContent);
  } catch (e) {
    console.warn(`[Uploader] YouTube upload error caught: ${e.message}. Continuing...`);
    ytResult = { platform: 'youtube', status: 'failed', error: e.message };
  }

  try {
    igResult = await uploadToInstagram(igVideoSource, socialContent);
  } catch (e) {
    console.warn(`[Uploader] Instagram upload error caught: ${e.message}. Continuing...`);
    igResult = { platform: 'instagram', status: 'failed', error: e.message };
  }

  try {
    fbResult = await uploadToFacebook(finalVideoPath, socialContent);
  } catch (e) {
    console.warn(`[Uploader] Facebook upload error caught: ${e.message}. Continuing...`);
    fbResult = { platform: 'facebook', status: 'failed', error: e.message };
  }

  const results = {
    youtube: ytResult,
    instagram: igResult,
    facebook: fbResult
  };

  // Update town memory and last frame anchor - NEVER skipped even if uploads failed or skipped
  try {
    await updateAndCommitTownMemory(townKey, plan, finalStagePath);
  } catch (memErr) {
    console.error(`[Memory] Critical error saving town memory: ${memErr.message}`);
  }

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
