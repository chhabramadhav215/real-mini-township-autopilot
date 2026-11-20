const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

/**
 * Visual Engine:
 * 100% Photorealistic Construction Process Generation (Zero Placeholder Boxes / Zero Watermarks)
 * - Primary Keyframes: HuggingFace FLUX.1-schnell / FLUX.1-dev (@gradio/client + HF API)
 * - Secondary Keyframes: Pollinations Flux with 4% Bottom Crop (Watermark-Free) & Exponential Backoff
 * - True I2V Motion: HuggingFace Spaces (LTX-Video, Wan2.1, CogVideoX, HunyuanVideo)
 * - Bulletproof Fallback: Pure Cinematic Ken Burns Pan/Zoom (1080x1920 @ 30fps, Zero Dissolve Grain/Morphs)
 */

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg failed (code ${code}): ${stderr.slice(-300)}`));
    });
    proc.on('error', reject);
  });
}

/**
 * Download file from URL to local disk
 */
async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const arrayBuf = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuf));
}

/**
 * Crop bottom 4% off an image using FFmpeg to eliminate any watermark
 * and scale precisely to 1080x1920
 */
async function cleanAndScaleImage(inputPath, outputPath) {
  const tempClean = outputPath + '.tmp.jpg';
  const args = [
    '-i', inputPath,
    '-vf', 'crop=in_w:in_h*0.96:0:0,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,scale=out_range=tv',
    '-q:v', '2',
    '-y',
    tempClean
  ];
  await runFFmpeg(args);
  if (fs.existsSync(tempClean)) {
    fs.copyFileSync(tempClean, outputPath);
    fs.unlinkSync(tempClean);
  }
}

/**
 * Verify integrity and minimum resolution/detail of an image file
 */
function verifyImageFile(imagePath) {
  if (!fs.existsSync(imagePath)) return false;
  const size = fs.statSync(imagePath).size;
  if (size < 35000) return false; // Detailed 1080x1920 images are typically > 40KB
  try {
    const res = spawnSync('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height',
      '-of', 'json',
      imagePath
    ]);
    if (res.status !== 0) return false;
    const info = JSON.parse(res.stdout.toString() || '{}');
    const stream = info.streams && info.streams[0];
    if (!stream || !stream.width || !stream.height) return false;
    if (stream.width < 720 || stream.height < 1080) return false;
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Sanitize and format a photorealistic civil engineering worksite prompt.
 * Strictly eliminates deformed human limb/hand close-ups, miniature/diorama terms,
 * clay/doll/statue figurines, and surreal morphing objects.
 */
function buildSanitizedEngineeringPrompt(stage, townKey) {
  const cleanTool = (stage.tool || 'construction equipment').trim();
  const cleanAction = (stage.action || 'assembling structure').trim();

  let basePrompt = stage.image_prompt || '';

  // Strip human close-up triggers that produce distorted/weird hands or surreal mannequins
  basePrompt = basePrompt
    .replace(/skilled adult craftsman worker hands actively using/gi, 'professional construction crew worksite showing')
    .replace(/craftsman worker hands actively using/gi, 'active worksite showing')
    .replace(/skilled adult craftsman hands actively using/gi, 'construction worksite showing')
    .replace(/craftsman hands actively using/gi, 'construction worksite showing')
    .replace(/skilled adult craftsman worker hands/gi, 'professional worksite equipment')
    .replace(/craftsman worker hands/gi, 'worksite equipment')
    .replace(/worker hands/gi, 'worksite tools')
    .replace(/craftsman hands/gi, 'worksite tools')
    .replace(/hands actively using/gi, 'heavy-duty tools aligned on')
    .replace(/hands actively/gi, 'equipment in position')
    .replace(/hands using/gi, 'equipment applying')
    .replace(/close-up construction angle/gi, 'wide to medium architectural construction view')
    .replace(/extreme close-up/gi, 'medium worksite perspective')
    .replace(/macro lens/gi, '35mm cinema lens')
    .replace(/miniature|diorama|ho-scale|1:87|cutting mat|tweezers|scale model/gi, 'real-world construction');

  // If no base prompt was available or it was too short, build a fresh crisp prompt
  if (!basePrompt || basePrompt.length < 50) {
    basePrompt = `Stage ${stage.stage_num}/5: Authentic real-world civil engineering worksite photography. Medium-to-wide architectural construction angle showing ${cleanAction}. Heavy-duty ${cleanTool} actively placed on the physical build surface. Ground-level view showing authentic building materials, compacted sub-base, and genuine structural elements under assembly. Shot on Sony FX6 cinema camera, natural daylight, razor-sharp focus on materials and structural alignment, 8k resolution, highly detailed realistic engineering.`;
  }

  // Append explicit negative guidance / realism enforcement
  const cleanPrompt = `${basePrompt.trim()} Clean civil engineering scene, wide-to-medium architectural shot, sharp focus on physical structural materials. Zero human limb distortions, no disembodied hands, no surreal clay or wooden figures, no toy people, no figurines. Crisp photorealistic 8k documentary cinematography.`;

  return cleanPrompt;
}

/**
 * Generate real photorealistic keyframe via HuggingFace FLUX Spaces (@gradio/client)
 */
async function tryGradioFlux(prompt, seed, hfToken, destPath) {
  const { Client } = require('@gradio/client');
  const spaces = ['black-forest-labs/FLUX.1-schnell', 'black-forest-labs/FLUX.1-dev'];

  for (const spaceName of spaces) {
    try {
      console.log(`[VisualEngine] Connecting to HuggingFace Space "${spaceName}" for real construction keyframe...`);
      const clientOptions = {};
      if (hfToken && hfToken.trim().length > 5) {
        clientOptions.token = hfToken;
      }

      const client = await Client.connect(spaceName, clientOptions);
      console.log(`[VisualEngine] Connected to ${spaceName}. Generating photorealistic construction photo...`);

      const result = await client.predict('/infer', {
        prompt: prompt,
        seed: seed || 739215,
        randomize_seed: false,
        width: 768,
        height: 1360,
        num_inference_steps: spaceName.includes('schnell') ? 4 : 20
      });

      if (result && result.data && result.data[0]) {
        const fileData = result.data[0];
        const imageUrl = typeof fileData === 'string' ? fileData : (fileData.url || fileData.path);

        if (imageUrl) {
          console.log(`[VisualEngine] FLUX output generated from ${spaceName}. Downloading and scaling...`);
          const tempRaw = destPath + '.raw.webp';
          await downloadFile(imageUrl, tempRaw);
          await cleanAndScaleImage(tempRaw, destPath);
          if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw);

          if (verifyImageFile(destPath)) {
            console.log(`[VisualEngine] Real keyframe verified from ${spaceName}: ${path.basename(destPath)}`);
            return destPath;
          }
        }
      }
    } catch (err) {
      console.warn(`[VisualEngine] Gradio Space "${spaceName}" notice: ${err.message}`);
    }
  }

  return null;
}

/**
 * Generate real keyframe via HuggingFace Inference API router
 */
async function tryHFInferenceAPI(prompt, seed, hfToken, destPath) {
  if (!hfToken || hfToken.trim().length < 5) return null;

  const models = [
    'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
    'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-dev'
  ];

  for (const endpoint of models) {
    try {
      console.log(`[VisualEngine] Trying HF Router Endpoint: ${endpoint.split('/').pop()}...`);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: 768,
            height: 1360,
            seed: seed
          }
        })
      });

      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        if (arrayBuf.byteLength > 20000) {
          const tempRaw = destPath + '.router.jpg';
          fs.writeFileSync(tempRaw, Buffer.from(arrayBuf));
          await cleanAndScaleImage(tempRaw, destPath);
          if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw);

          if (verifyImageFile(destPath)) {
            console.log(`[VisualEngine] Generated verified keyframe via HF Router API`);
            return destPath;
          }
        }
      }
    } catch (err) {
      console.warn(`[VisualEngine] HF Router error: ${err.message}`);
    }
  }

  return null;
}

/**
 * Generate real keyframe via Pollinations Flux with watermark cropping and retries
 */
async function tryPollinationsFlux(prompt, seed, destPath) {
  const maxRetries = 4;
  const models = ['flux-realism', 'flux', 'turbo'];

  const concisePrompt = prompt.length > 900 ? prompt.slice(0, 900) : prompt;
  const encoded = encodeURIComponent(concisePrompt);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    for (const model of models) {
      try {
        console.log(`[VisualEngine] Pollinations Flux (attempt ${attempt}/${maxRetries}, model: ${model})...`);
        const url = `https://image.pollinations.ai/prompt/${encoded}?width=1080&height=2000&model=${model}&seed=${seed}&nologo=true&enhance=false`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 40000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const buf = await res.arrayBuffer();
          // Verify valid image buffer (greater than 35KB and not JSON error)
          if (buf.byteLength > 35000) {
            const rawHeader = Buffer.from(buf.slice(0, 50)).toString('utf8');
            if (!rawHeader.includes('error') && !rawHeader.includes('status')) {
              const tempPoll = destPath + '.raw_poll.jpg';
              fs.writeFileSync(tempPoll, Buffer.from(buf));
              // Crop 4% off bottom to completely remove any watermark & scale to 1080x1920
              await cleanAndScaleImage(tempPoll, destPath);
              if (fs.existsSync(tempPoll)) fs.unlinkSync(tempPoll);

              if (verifyImageFile(destPath)) {
                console.log(`[VisualEngine] Watermark-free photorealistic keyframe saved via Pollinations Flux (${Math.round(fs.statSync(destPath).size / 1024)} KB)`);
                return destPath;
              }
            }
          }
        }
      } catch (err) {
        // Continue to next model/attempt
      }
    }

    // Exponential backoff before next attempt
    if (attempt < maxRetries) {
      const waitMs = attempt * 6000;
      console.log(`[VisualEngine] Rate limit pause (${waitMs / 1000}s) before next retry...`);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }

  return null;
}

/**
 * Progressive Keyframe Generator (100% Real Photorealism - Zero Placeholder Cards)
 */
async function generateKeyframe(stage, townKey, episode, townSeed, outputDir) {
  const filename = `stage_${stage.stage_num}.jpg`;
  const destPath = path.join(outputDir, filename);

  if (fs.existsSync(destPath) && verifyImageFile(destPath)) {
    console.log(`[VisualEngine] Using existing verified keyframe: ${filename}`);
    return destPath;
  }

  const prompt = buildSanitizedEngineeringPrompt(stage, townKey);

  // Use stage-specific seed to guarantee each stage produces a distinct, progressive scene
  const stageSeed = (townSeed + (stage.stage_num * 1047) + (episode * 79)) % 1000000;
  const hfToken = process.env.HF_TOKEN;

  // 1. PRIMARY: HuggingFace FLUX Space via @gradio/client
  console.log(`[VisualEngine] ---> GENERATING STAGE ${stage.stage_num}/5 (PRIMARY: HuggingFace FLUX, Seed: ${stageSeed})`);
  let resultPath = await tryGradioFlux(prompt, stageSeed, hfToken, destPath);
  if (resultPath && verifyImageFile(resultPath)) return resultPath;

  // 2. SECONDARY: HuggingFace Inference API Router
  resultPath = await tryHFInferenceAPI(prompt, stageSeed, hfToken, destPath);
  if (resultPath && verifyImageFile(resultPath)) return resultPath;

  // 3. TERTIARY: Pollinations Flux with 4% Bottom Crop (Watermark-Free)
  console.log(`[VisualEngine] ---> FALLING BACK TO POLLINATIONS FLUX (4% Watermark Crop, Seed: ${stageSeed})`);
  resultPath = await tryPollinationsFlux(prompt, stageSeed, destPath);
  if (resultPath && verifyImageFile(resultPath)) return resultPath;

  throw new Error(`Failed to generate photorealistic keyframe for Stage ${stage.stage_num} after retries.`);
}

/**
 * Try external commercial Video APIs if user has configured keys in GitHub Secrets / .env
 */
async function tryExternalVideoAPIs(firstFramePath, motionPrompt, destVideoPath) {
  // 1. Fal.ai (Wan 2.1 / LTX-Video)
  const falKey = process.env.FAL_KEY;
  if (falKey && falKey.trim().length > 5) {
    try {
      console.log(`[VisualEngine] Attempting I2V via Fal.ai API...`);
      const imgBuffer = fs.readFileSync(firstFramePath);
      const b64Image = `data:image/jpeg;base64,${imgBuffer.toString('base64')}`;

      const submitRes = await fetch('https://queue.fal.run/fal-ai/wan/v2.1/image-to-video', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image_url: b64Image,
          prompt: motionPrompt,
          aspect_ratio: '9:16'
        })
      });

      const submitData = await submitRes.json();
      if (submitData.video?.url) {
        console.log(`[VisualEngine] Fal.ai video generated successfully!`);
        await downloadFile(submitData.video.url, destVideoPath);
        return destVideoPath;
      }
    } catch (e) {
      console.warn(`[VisualEngine] Fal.ai notice: ${e.message}`);
    }
  }

  // 2. Pollinations Video API (if POLLINATIONS_API_KEY is configured)
  const pollKey = process.env.POLLINATIONS_API_KEY;
  if (pollKey && pollKey.trim().length > 5) {
    try {
      console.log(`[VisualEngine] Attempting I2V via Pollinations Video API...`);
      const encoded = encodeURIComponent(motionPrompt.slice(0, 200));
      const res = await fetch(`https://gen.pollinations.ai/video/${encoded}?model=seedance-pro`, {
        headers: { 'Authorization': `Bearer ${pollKey}` }
      });
      if (res.ok) {
        const vidBuffer = await res.arrayBuffer();
        if (vidBuffer.byteLength > 20000) {
          fs.writeFileSync(destVideoPath, Buffer.from(vidBuffer));
          console.log(`[VisualEngine] Pollinations video generated successfully!`);
          return destVideoPath;
        }
      }
    } catch (e) {
      console.warn(`[VisualEngine] Pollinations Video notice: ${e.message}`);
    }
  }

  return null;
}

/**
 * True Image-to-Video Motion via HuggingFace I2V Spaces with Active Verified Endpoints
 */
async function tryHFI2VSpaces(firstFramePath, lastFramePath, motionPrompt, hfToken, destVideoPath) {
  const { Client, handle_file } = require('@gradio/client');

  const spaces = [
    {
      name: 'Lightricks/ltx-video-distilled',
      endpoint: '/image_to_video',
      buildArgs: (file) => [
        motionPrompt.slice(0, 200),
        'worst quality, inconsistent motion, blurry, jittery, distorted, deformed hands, extra limbs, miniature, toy, diorama, static, frozen',
        file,
        null, // video_i
        704,  // height
        480,  // width
        'image-to-video', // task
        3,    // duration seconds
        9,    // frames from input video (minimum required is 9)
        42,   // seed
        true, // randomize seed
        3.0,  // CFG
        true  // improve texture
      ]
    },
    {
      name: 'mediasynthesismuseum/stable-video-diffusion',
      endpoint: '/video',
      buildArgs: (file) => [
        file,
        42,   // seed
        true, // randomize seed
        140,  // motion bucket id (high motion)
        6     // fps
      ]
    },
    {
      name: 'zai-org/CogVideoX-5B-Space',
      endpoint: '/generate',
      buildArgs: (file) => [
        motionPrompt.slice(0, 180),
        file,
        null,
        0.85, // strength
        -1,   // random seed
        false,
        true
      ]
    }
  ];

  for (const space of spaces) {
    // Attempt with token first (if provided); if rejected or 401, retry without token as public user
    const tokenAttempts = (hfToken && hfToken.trim().length > 5) ? [hfToken, null] : [null];

    for (const tokenToUse of tokenAttempts) {
      try {
        console.log(`[VisualEngine] Testing I2V Space "${space.name}" (${tokenToUse ? 'authenticated' : 'public'})...`);
        const clientOptions = {};
        if (tokenToUse) clientOptions.token = tokenToUse;

        const client = await Client.connect(space.name, clientOptions);
        console.log(`[VisualEngine] Connected to ${space.name}! Submitting image + motion prompt...`);

        const firstFile = handle_file(firstFramePath);
        const predictArgs = space.buildArgs(firstFile);

        const predictPromise = client.predict(space.endpoint, predictArgs);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Space queue timed out after 35s")), 35000)
        );

        const res = await Promise.race([predictPromise, timeoutPromise]);
        if (res && res.data && res.data[0]) {
          const videoData = res.data[0];
          const videoUrl = typeof videoData === 'string' ? videoData : (videoData.url || videoData.video?.url || videoData.path);
          if (videoUrl) {
            console.log(`[VisualEngine] I2V SUCCESS: Generated real AI video via Space "${space.name}"!`);
            const tempRawVid = destVideoPath + '.raw.mp4';
            await downloadFile(videoUrl, tempRawVid);
            await runFFmpeg([
              '-i', tempRawVid,
              '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,scale=out_range=tv',
              '-r', '30',
              '-c:v', 'libx264',
              '-preset', 'veryfast',
              '-crf', '22',
              '-pix_fmt', 'yuv420p',
              '-y',
              destVideoPath
            ]);
            if (fs.existsSync(tempRawVid)) fs.unlinkSync(tempRawVid);
            return destVideoPath;
          }
        }
      } catch (err) {
        console.warn(`[VisualEngine] Space "${space.name}" (${tokenToUse ? 'auth' : 'pub'}) notice: ${err.message.slice(0, 100)}`);
        if (!tokenToUse) break;
      }
    }
  }

  return null;
}

/**
 * Generate distinct, cinematic camera motion filter for each stage
 * - Stage 1: Establishing Push-In + Upward Tilt (revealing foundation & site)
 * - Stage 2: Smooth Lateral Dolly Pan Left-to-Right across worksite
 * - Stage 3: Close-Up Worksite Push & Diagonal Glide (tool & assembly alignment)
 * - Stage 4: Smooth Lateral Dolly Pan Right-to-Left (materials & surface sweep)
 * - Stage 5: Grand Cinematic Pull-Back & Elevation Reveal (finished structure)
 */
function getStageMotionFilter(stageNum, duration) {
  const D = Math.max(duration, 0.5).toFixed(2);
  const num = ((Math.max(1, stageNum) - 1) % 5) + 1;
  switch (num) {
    case 1:
      // Stage 1: Establishing Push-In + Upward Tilt
      return `scale=w='2*trunc((1080*(1.05+0.12*(t/${D})))/2)':h='2*trunc((1920*(1.05+0.12*(t/${D})))/2)':eval=frame,crop=1080:1920:'(in_w-1080)*(0.30+0.40*(t/${D}))':'(in_h-1920)*(0.65-0.35*(t/${D}))'`;
    case 2:
      // Stage 2: Smooth Lateral Dolly Pan Left-to-Right
      return `scale=w='2*trunc((1080*1.16)/2)':h='2*trunc((1920*1.16)/2)':eval=init,crop=1080:1920:'(in_w-1080)*(0.15+0.70*(t/${D}))':'(in_h-1920)*(0.45+0.08*sin(t*1.2))'`;
    case 3:
      // Stage 3: Close-Up Worksite Push & Diagonal Glide
      return `scale=w='2*trunc((1080*(1.08+0.14*(t/${D})))/2)':h='2*trunc((1920*(1.08+0.14*(t/${D})))/2)':eval=frame,crop=1080:1920:'(in_w-1080)*(0.20+0.55*(t/${D}))':'(in_h-1920)*(0.30+0.40*(t/${D}))'`;
    case 4:
      // Stage 4: Smooth Lateral Dolly Pan Right-to-Left
      return `scale=w='2*trunc((1080*1.16)/2)':h='2*trunc((1920*1.16)/2)':eval=init,crop=1080:1920:'(in_w-1080)*(0.85-0.70*(t/${D}))':'(in_h-1920)*(0.50-0.08*cos(t*1.2))'`;
    case 5:
    default:
      // Stage 5: Grand Cinematic Pull-Back & Elevation Reveal
      return `scale=w='2*trunc((1080*(1.18-0.12*(t/${D})))/2)':h='2*trunc((1920*(1.18-0.12*(t/${D})))/2)':eval=frame,crop=1080:1920:'(in_w-1080)*(0.65-0.35*(t/${D}))':'(in_h-1920)*(0.35+0.30*(t/${D}))'`;
  }
}

/**
 * Continuous Working Motion Video Synthesizer (Zero Dissolve Grain / Zero Surreal Morphs)
 * Renders smooth, cinematic Ken Burns camera motion at 1080x1920 @ 30fps.
 * Eliminates noisy dissolves and multi-seed morphing hallucinations.
 */
async function createContinuousWorkingMotionVideo(firstFramePath, lastFramePath, stage, townSeed, destVideoPath, transitionsDir, clipDuration = 4.8) {
  if (!destVideoPath || typeof destVideoPath !== 'string') {
    throw new TypeError(`[VisualEngine] destVideoPath must be a valid string path. Received: ${typeof destVideoPath} (${destVideoPath})`);
  }
  if (!transitionsDir || typeof transitionsDir !== 'string') {
    transitionsDir = path.dirname(destVideoPath);
  }

  const stageNum = stage ? (stage.stage_num || 1) : 1;
  const isSingleKeyframe = !lastFramePath || firstFramePath === lastFramePath;

  console.log(`[VisualEngine] Synthesizing continuous working motion video -> ${path.basename(destVideoPath)} (Stage ${stageNum}, ${isSingleKeyframe ? 'single-stage' : '2-shot cut'}, ${clipDuration}s @ 30fps)`);

  if (isSingleKeyframe) {
    // Single Stage: Smooth cinematic Ken Burns camera glide across the verified keyframe
    const motionFilter = getStageMotionFilter(stageNum, clipDuration);
    const args = [
      '-loop', '1', '-t', `${clipDuration}`, '-i', firstFramePath,
      '-vf', `${motionFilter},scale=1080:1920:out_range=tv,format=yuv420p,settb=AVTB,setpts=PTS-STARTPTS`,
      '-r', '30',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '19',
      '-pix_fmt', 'yuv420p',
      '-t', `${clipDuration}`,
      '-y',
      destVideoPath
    ];
    await runFFmpeg(args);
  } else {
    // 2-Shot Transition connecting stage i and stage i+1 with clean camera progression and zero morphing
    const halfDuration = parseFloat((clipDuration / 2).toFixed(2));
    const filter1 = getStageMotionFilter(stageNum, halfDuration);
    const filter2 = getStageMotionFilter(stageNum + 1, halfDuration);
    const filterComplex = [
      `[0:v]${filter1},scale=1080:1920:out_range=tv,format=yuv420p,settb=AVTB,setpts=PTS-STARTPTS[v0]`,
      `[1:v]${filter2},scale=1080:1920:out_range=tv,format=yuv420p,settb=AVTB,setpts=PTS-STARTPTS[v1]`,
      `[v0][v1]concat=n=2:v=1:a=0[outv]`
    ].join(';');

    const args = [
      '-loop', '1', '-t', `${halfDuration}`, '-i', firstFramePath,
      '-loop', '1', '-t', `${halfDuration}`, '-i', lastFramePath,
      '-filter_complex', filterComplex,
      '-map', '[outv]',
      '-r', '30',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '19',
      '-pix_fmt', 'yuv420p',
      '-t', `${clipDuration}`,
      '-y',
      destVideoPath
    ];
    await runFFmpeg(args);
  }

  if (fs.existsSync(destVideoPath)) {
    const fileSizeKb = Math.round(fs.statSync(destVideoPath).size / 1024);
    console.log(`[VisualEngine] Continuous working motion video compiled: ${path.basename(destVideoPath)} (${fileSizeKb} KB)`);
  }
  return destVideoPath;
}

/**
 * Orchestrate all 5 keyframes and 4 transitions for an episode
 */
async function generateEpisodeVisuals(plan, townKey, townMemory, outputDir) {
  const stagesDir = path.join(outputDir, 'stages');
  const transitionsDir = path.join(outputDir, 'transitions');
  if (!fs.existsSync(stagesDir)) fs.mkdirSync(stagesDir, { recursive: true });
  if (!fs.existsSync(transitionsDir)) fs.mkdirSync(transitionsDir, { recursive: true });

  const townSeed = townMemory.camera_seed || 739215;
  const hfToken = process.env.HF_TOKEN;

  // 1. Generate all 5 progressive keyframes
  const keyframePaths = [];
  for (let i = 0; i < plan.stages.length; i++) {
    const stage = plan.stages[i];
    const keyframePath = await generateKeyframe(stage, townKey, plan.episode, townSeed, stagesDir);
    keyframePaths.push(keyframePath);
  }

  // 2. Generate 4 transitions connecting the 5 stages
  const transitionPaths = [];
  for (let i = 0; i < keyframePaths.length - 1; i++) {
    const firstPath = keyframePaths[i];
    const lastPath = keyframePaths[i + 1];
    const stage = plan.stages[i];
    const motionPrompt = stage.motion_prompt;
    const destVideo = path.join(transitionsDir, `transition_${i + 1}.mp4`);

    if (fs.existsSync(destVideo) && fs.statSync(destVideo).size > 10000) {
      console.log(`[VisualEngine] Using existing transition: ${path.basename(destVideo)}`);
      transitionPaths.push(destVideo);
      continue;
    }

    console.log(`\n[VisualEngine] ==========================================`);
    console.log(`[VisualEngine] Generating Motion Transition ${i + 1}/4 (Stage ${i + 1} -> ${i + 2})`);
    console.log(`[VisualEngine] Action: ${stage.action}`);
    console.log(`[VisualEngine] Tool:   ${stage.tool}`);
    console.log(`[VisualEngine] ==========================================`);

    // 1. Try External Commercial Video APIs (Fal.ai, Replicate, Pollinations Video)
    let videoSuccess = await tryExternalVideoAPIs(firstPath, motionPrompt, destVideo);

    // 2. Try Hugging Face I2V Spaces (LTX-Video, SVD, CogVideoX)
    if (!videoSuccess) {
      videoSuccess = await tryHFI2VSpaces(firstPath, lastPath, motionPrompt, hfToken, destVideo);
    }

    // 3. Guaranteed Continuous Working Motion Synthesizer (Zero Dissolve Grain / Zero Ghosting)
    if (!videoSuccess) {
      videoSuccess = await createContinuousWorkingMotionVideo(firstPath, lastPath, stage, townSeed, destVideo, transitionsDir);
    }

    transitionPaths.push(destVideo);
  }

  return {
    keyframePaths,
    transitionPaths,
    finalStagePath: keyframePaths[keyframePaths.length - 1]
  };
}

module.exports = {
  generateEpisodeVisuals,
  generateKeyframe,
  createContinuousWorkingMotionVideo,
  tryHFI2VSpaces,
  tryExternalVideoAPIs,
  cleanAndScaleImage,
  verifyImageFile,
  buildSanitizedEngineeringPrompt,
  getStageMotionFilter,
  runFFmpeg
};
