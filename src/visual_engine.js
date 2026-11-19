const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Visual Engine:
 * Step A: Locked-Angle Progressive Keyframes (Pollinations Flux + HF Flux.1-dev fallback)
 * Step B: First-to-Last Frame I2V via HuggingFace Spaces (Wan-AI / LTX-Video)
 * Step C: Bulletproof FFmpeg Macro Breathing & Morph Fallback
 */

// Helper to run FFmpeg as a Promise
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
 * Download an image from URL and save to disk
 */
async function downloadImage(url, destPath, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const arrayBuf = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuf));
}

/**
 * Generate a procedural fallback diorama keyframe if external AI networks are unreachable
 */
async function generateProceduralKeyframe(destPath, stage, townKey, episode, townSeed) {
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const colors = {
    mountain_village: { base: '#2d2218', ground: '#4a3b2c', highlight: '#2e7d32' },
    smart_city: { base: '#1e242b', ground: '#2b303a', highlight: '#2563eb' },
    desert_town: { base: '#3d2516', ground: '#8d5b36', highlight: '#ea580c' }
  };
  const theme = colors[townKey] || colors.smart_city;

  // Render high-res 1080x1920 diorama graphic using FFmpeg lavfi filters
  const stageNum = stage.stage_num;
  const progressRatio = stageNum / 5.0;
  const stageAction = (stage.action || `Stage ${stageNum}`).replace(/'/g, "");

  const args = [
    '-f', 'lavfi',
    '-i', `color=c=${theme.ground}:s=1080x1920:d=1`,
    '-vf',
    `drawbox=x=80:y=240:w=920:h=1440:color=${theme.base}@0.95:t=fill,` +
    `drawgrid=width=60:height=60:thickness=1:color=white@0.07,` +
    `drawbox=x=200:y=600:w=680:h=${Math.round(200 + progressRatio * 400)}:color=${theme.highlight}@0.35:t=fill,` +
    `drawtext=text='DIORAMA WORKBENCH • 45° ISOMETRIC VIEW':x=(w-text_w)/2:y=320:fontcolor=white@0.5:fontsize=28,` +
    `drawtext=text='${townKey.toUpperCase()} • STAGE ${stageNum}/5':x=(w-text_w)/2:y=380:fontcolor=white:fontsize=48,` +
    `drawtext=text='${stageAction.slice(0, 42)}':x=(w-text_w)/2:y=450:fontcolor=yellow@0.9:fontsize=32,` +
    `drawtext=text='[Craftsman Hands Active at Worksite]':x=(w-text_w)/2:y=1200:fontcolor=white@0.7:fontsize=36`,
    '-frames:v', '1',
    '-y',
    destPath
  ];

  await runFFmpeg(args);
}

/**
 * Step A: Progressive Keyframe Generation
 */
async function generateKeyframe(stage, townKey, episode, townSeed, outputDir) {
  const filename = `stage_${stage.stage_num}.jpg`;
  const destPath = path.join(outputDir, filename);

  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 5000) {
    console.log(`[VisualEngine] Using existing keyframe: ${filename}`);
    return destPath;
  }

  // Construct locked-seed prompt with strict continuity anchoring
  const cleanPrompt = stage.image_prompt.replace(/[\r\n]+/g, ' ').trim();
  const hfToken = process.env.HF_TOKEN;

  // 1. Try Pollinations Flux (model=flux-realism, locked seed)
  try {
    console.log(`[VisualEngine] Generating Stage ${stage.stage_num} via Pollinations Flux (seed: ${townSeed})...`);
    // Keep prompt length optimal for URL GET request while preserving key macro & action details
    const concisePrompt = cleanPrompt.length > 450 ? cleanPrompt.slice(0, 450) : cleanPrompt;
    const encodedPrompt = encodeURIComponent(concisePrompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1920&model=flux-realism&seed=${townSeed}&nologo=true&enhance=false`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40000);

    const res = await fetch(pollinationsUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const buf = await res.arrayBuffer();
      if (buf.byteLength > 8000) {
        fs.writeFileSync(destPath, Buffer.from(buf));
        console.log(`[VisualEngine] Stage ${stage.stage_num} keyframe saved (${Math.round(buf.byteLength / 1024)} KB)`);
        // Short pause between Pollinations API calls
        await new Promise(r => setTimeout(r, 1200));
        return destPath;
      }
    } else {
      console.warn(`[VisualEngine] Pollinations returned HTTP ${res.status} for stage ${stage.stage_num}`);
    }
  } catch (err) {
    console.warn(`[VisualEngine] Pollinations error for stage ${stage.stage_num}: ${err.message}`);
  }

  // 2. Try Hugging Face FLUX.1-dev with HF_TOKEN if available
  if (hfToken && hfToken.trim().length > 5) {
    try {
      console.log(`[VisualEngine] Trying HuggingFace FLUX.1-dev for Stage ${stage.stage_num}...`);
      const hfRes = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: cleanPrompt,
          parameters: {
            width: 1080,
            height: 1920,
            seed: townSeed
          }
        })
      });

      if (hfRes.ok) {
        const buf = await hfRes.arrayBuffer();
        if (buf.byteLength > 8000) {
          fs.writeFileSync(destPath, Buffer.from(buf));
          console.log(`[VisualEngine] Stage ${stage.stage_num} keyframe generated via HF Flux.1-dev`);
          return destPath;
        }
      }
    } catch (err) {
      console.warn(`[VisualEngine] HF Flux error: ${err.message}`);
    }
  }

  // 3. Fallback procedural diorama keyframe
  console.log(`[VisualEngine] Generating procedural diorama keyframe for Stage ${stage.stage_num}`);
  await generateProceduralKeyframe(destPath, stage, townKey, episode, townSeed);
  return destPath;
}

/**
 * Step B: Moving Hands Transition via Hugging Face Gradio Client
 */
async function tryHuggingFaceI2V(firstFramePath, lastFramePath, motionPrompt, hfToken) {
  if (!hfToken || hfToken.trim().length < 5) return null;

  try {
    const { Client, handle_file } = require('@gradio/client');

    console.log(`[VisualEngine] Attempting HuggingFace Wan2.1 First-to-Last Frame Space...`);
    // Connect to Wan2.1 First-Last-Frame video generation
    const client = await Client.connect("Wan-AI/Wan2.1-FLF2V-14B-720P", {
      hf_token: hfToken
    });

    const firstFile = handle_file(firstFramePath);
    const lastFile = handle_file(lastFramePath);

    // Call prediction with timeout
    const resultPromise = client.predict("/generate_video", [
      firstFile,
      lastFile,
      motionPrompt,
      16, // num_frames
      4   // fps / motion guidance
    ]);

    // Timeout after 45 seconds to keep pipeline responsive
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("HuggingFace Space queue timed out")), 45000)
    );

    const res = await Promise.race([resultPromise, timeoutPromise]);
    if (res && res.data && res.data[0]) {
      const videoData = res.data[0];
      const videoUrl = typeof videoData === 'string' ? videoData : (videoData.url || videoData.path);
      if (videoUrl) {
        console.log(`[VisualEngine] HF Wan2.1 generated video: ${videoUrl}`);
        return videoUrl;
      }
    }
  } catch (err) {
    console.warn(`[VisualEngine] HuggingFace Space unavailable (${err.message}). Proceeding to FFmpeg fallback.`);
  }

  return null;
}

/**
 * Step C: Bulletproof FFmpeg Optical Flow & Macro Breathing Transition
 * Creates a smooth 4-second 1080x1920 video with organic lens breathing & craftsman work morph
 */
async function createFFmpegTransition(firstFramePath, lastFramePath, motionPrompt, destVideoPath) {
  console.log(`[VisualEngine] Rendering seamless macro breathing transition -> ${path.basename(destVideoPath)}`);

  // We slightly upscale each image to 1120x1990 and apply subtle macro breathing oscillation:
  // x = 20 + 6*sin(t*2.5), y = 35 + 5*cos(t*2.5)
  // Crossfade morph starts at offset 1.8s and lasts 1.2s, total duration 4.0s.
  const filterComplex = [
    // Stream 0 (Stage N) - 3.0s duration
    `[0:v]scale=1120:1990:force_original_aspect_ratio=increase,crop=1080:1920:20+6*sin(t*2.5):35+5*cos(t*2.5),format=yuv420p,settb=AVTB,setpts=PTS-STARTPTS[v0]`,
    // Stream 1 (Stage N+1) - 2.5s duration
    `[1:v]scale=1120:1990:force_original_aspect_ratio=increase,crop=1080:1920:20+6*cos(t*2.2):35+5*sin(t*2.2),format=yuv420p,settb=AVTB,setpts=PTS-STARTPTS[v1]`,
    // Crossfade morph transition between them
    `[v0][v1]xfade=transition=dissolve:duration=1.2:offset=1.8,format=yuv420p[outv]`
  ].join(';');

  const args = [
    '-loop', '1', '-t', '3.0', '-i', firstFramePath,
    '-loop', '1', '-t', '2.5', '-i', lastFramePath,
    '-filter_complex', filterComplex,
    '-map', '[outv]',
    '-r', '30',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-t', '4.0',
    '-y',
    destVideoPath
  ];

  await runFFmpeg(args);
  console.log(`[VisualEngine] Transition video compiled successfully: ${path.basename(destVideoPath)}`);
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

  // 1. Generate all 5 keyframes
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
    const motionPrompt = plan.stages[i].motion_prompt;
    const destVideo = path.join(transitionsDir, `transition_${i + 1}.mp4`);

    if (fs.existsSync(destVideo) && fs.statSync(destVideo).size > 10000) {
      console.log(`[VisualEngine] Using existing transition: ${path.basename(destVideo)}`);
      transitionPaths.push(destVideo);
      continue;
    }

    console.log(`[VisualEngine] Building Transition ${i + 1}/4 (Stage ${i + 1} -> Stage ${i + 2})...`);

    // Try HuggingFace Space first
    let videoUrl = null;
    if (hfToken) {
      videoUrl = await tryHuggingFaceI2V(firstPath, lastPath, motionPrompt, hfToken);
    }

    if (videoUrl) {
      try {
        await downloadImage(videoUrl, destVideo);
        transitionPaths.push(destVideo);
        continue;
      } catch (e) {
        console.warn(`[VisualEngine] Failed downloading HF video: ${e.message}`);
      }
    }

    // FFmpeg Bulletproof Fallback
    await createFFmpegTransition(firstPath, lastPath, motionPrompt, destVideo);
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
  createFFmpegTransition,
  runFFmpeg
};
