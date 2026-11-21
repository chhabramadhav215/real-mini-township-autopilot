const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

/**
 * Audio/Video Master:
 * - Edge-TTS Narration (en-US-AndrewNeural)
 * - ASMR Construction Foley Synthesis & Mixing
 * - Lower-Center Dynamic Captions
 * - Real-World Construction Process Thumbnail Generator
 * - Final Vertical Video (1080x1920) Assembly (Zero Badges / Zero Distracting Overlays)
 */

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg error (${code}): ${stderr.slice(-300)}`));
    });
    proc.on('error', reject);
  });
}

function getMediaDuration(mediaPath) {
  try {
    const res = spawnSync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      mediaPath
    ]);
    const duration = parseFloat(res.stdout.toString().trim());
    return isNaN(duration) ? 4.0 : duration;
  } catch (e) {
    return 4.0;
  }
}

/**
 * Generate calm US-English narration using edge-tts (en-US-AndrewNeural)
 */
async function generateNarration(plan, outputDir) {
  const narrationDir = path.join(outputDir, 'narration');
  if (!fs.existsSync(narrationDir)) fs.mkdirSync(narrationDir, { recursive: true });

  const narrationPaths = [];

  for (let i = 0; i < plan.stages.length; i++) {
    const stage = plan.stages[i];
    const destMp3 = path.join(narrationDir, `narration_${stage.stage_num}.mp3`);

    if (fs.existsSync(destMp3) && fs.statSync(destMp3).size > 1000) {
      narrationPaths.push(destMp3);
      continue;
    }

    const text = stage.narration || `Stage ${stage.stage_num}: authentic construction process.`;
    let synthesized = false;

    // Retry with delay and fresh instance for robust Edge TTS synthesis
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const tempSubDir = path.join(narrationDir, `tmp_stage_${stage.stage_num}_${attempt}`);
        if (!fs.existsSync(tempSubDir)) fs.mkdirSync(tempSubDir, { recursive: true });

        const tts = new MsEdgeTTS();
        await tts.setMetadata('en-US-AndrewNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

        const result = await tts.toFile(tempSubDir, text);
        const generatedAudio = result.audioFilePath;

        if (fs.existsSync(generatedAudio) && fs.statSync(generatedAudio).size > 500) {
          // Accelerate narration to a crisp, punchy short-form reel pacing (1.12x speed)
          try {
            await runFFmpeg([
              '-i', generatedAudio,
              '-af', 'atempo=1.12',
              '-y',
              destMp3
            ]);
          } catch (e) {
            fs.copyFileSync(generatedAudio, destMp3);
          }
          fs.rmSync(tempSubDir, { recursive: true, force: true });
          console.log(`[AudioMaster] Generated punchy TTS narration for Stage ${stage.stage_num} via AndrewNeural (1.12x)`);
          synthesized = true;
          // Short delay between requests to respect edge socket reset
          await new Promise(r => setTimeout(r, 600));
          break;
        }
        fs.rmSync(tempSubDir, { recursive: true, force: true });
      } catch (err) {
        await new Promise(r => setTimeout(r, 1200));
      }
    }

    // Fallback narration chime if offline or network failure
    if (!synthesized) {
      console.log(`[AudioMaster] Synthesizing audio tone for Stage ${stage.stage_num}`);
      const synthArgs = [
        '-f', 'lavfi',
        '-i', 'sine=frequency=440:duration=3',
        '-af', 'volume=0.2,afade=t=out:st=2.5:d=0.5',
        '-y',
        destMp3
      ];
      await runFFmpeg(synthArgs);
    }

    narrationPaths.push(destMp3);
  }

  return narrationPaths;
}

/**
 * Procedural ASMR Miniature Construction Foley synthesis
 * Crisp acoustic placement, pour, scrape, tap, and peel textures
 */
async function generateASMRFoley(asmrType, durationSeconds, destPath) {
  const d = Math.max(durationSeconds, 2.0);

  const foleyPresets = {
    cement_pour: `anoisesrc=c=brown:r=44100:a=0.15,bandpass=f=280:w=220,lowpass=f=800,tremolo=f=3.5:d=0.85,volume=0.28`,
    trowel_scrape: `anoisesrc=c=pink:r=44100:a=0.10,bandpass=f=1600:w=800,lowpass=f=3200,tremolo=f=1.8:d=0.7,volume=0.22`,
    formwork_strip: `aevalsrc='0.22*sin(180*2*PI*t)*exp(-30*mod(t,0.9)) + 0.14*sin(650*2*PI*t)*exp(-50*mod(t,0.9)) + 0.08*(2*random(0)-1)*exp(-35*mod(t,0.9))':s=44100,lowpass=f=2200,volume=0.26`,
    brick_tap: `aevalsrc='0.25*sin(380*2*PI*t)*exp(-45*mod(t,0.75)) + 0.12*sin(920*2*PI*t)*exp(-60*mod(t,0.75))':s=44100,lowpass=f=1800,volume=0.26`,
    pin_placement: `aevalsrc='0.18*sin(1450*2*PI*t)*exp(-70*mod(t,0.6)) + 0.08*sin(2800*2*PI*t)*exp(-80*mod(t,0.6))':s=44100,lowpass=f=3600,volume=0.20`,
    sand_level: `anoisesrc=c=brown:r=44100:a=0.12,bandpass=f=550:w=350,lowpass=f=1400,tremolo=f=2.2:d=0.75,volume=0.22`,
    // Backward compatibility aliases
    dirt_scraping: `anoisesrc=c=brown:r=44100:a=0.12,bandpass=f=550:w=350,lowpass=f=1400,tremolo=f=2.2:d=0.75,volume=0.22`,
    cement_troweling: `anoisesrc=c=pink:r=44100:a=0.10,bandpass=f=1600:w=800,lowpass=f=3200,tremolo=f=1.8:d=0.7,volume=0.22`,
    brick_tapping: `aevalsrc='0.25*sin(380*2*PI*t)*exp(-45*mod(t,0.75)) + 0.12*sin(920*2*PI*t)*exp(-60*mod(t,0.75))':s=44100,lowpass=f=1800,volume=0.26`,
    spray_painting: `anoisesrc=c=pink:r=44100:a=0.08,bandpass=f=800:w=500,lowpass=f=1300,volume=0.15`,
    gravel_rolling: `anoisesrc=c=brown:r=44100:a=0.12,bandpass=f=450:w=300,lowpass=f=1100,tremolo=f=2:d=0.6,volume=0.20`,
    wood_cutting: `anoisesrc=c=brown:r=44100:a=0.12,bandpass=f=380:w=260,lowpass=f=1000,tremolo=f=2:d=0.5,volume=0.20`,
    wire_tweezing: `aevalsrc='0.18*sin(1450*2*PI*t)*exp(-70*mod(t,0.6)) + 0.08*sin(2800*2*PI*t)*exp(-80*mod(t,0.6))':s=44100,lowpass=f=3600,volume=0.20`
  };

  const filter = foleyPresets[asmrType] || foleyPresets.sand_level;

  const args = [
    '-f', 'lavfi',
    '-i', filter,
    '-t', `${d.toFixed(2)}`,
    '-af', `lowpass=f=4500,afade=t=in:st=0:d=0.2,afade=t=out:st=${(d - 0.2).toFixed(2)}:d=0.2`,
    '-y',
    destPath
  ];

  await runFFmpeg(args);
}

/**
 * Procedural Energetic Background Music Bed Generator
 * Synthesizes a driving, modern rhythmic musical bed using FFmpeg lavfi:
 * - 124 BPM subtle kick/sub-bass rhythm (mod(t, 0.484))
 * - Warm polyphonic harmonic chord bed (frequencies: 220, 261.6, 329.6, 392 Hz)
 * - Shaker/percussion texture providing forward momentum (mod(t, 0.242))
 * - Clean bandpass filter (80Hz to 3200Hz) so voiceover stays crisp and intelligible
 */
async function generateBackgroundMusic(durationSeconds, destPath) {
  const d = Math.max(durationSeconds, 4.0).toFixed(2);
  const filterExpr = `aevalsrc='0.12*sin(110*2*PI*t)*exp(-30*mod(t,0.484)) + 0.04*sin(220*2*PI*t)*cos(2*PI*0.12*t) + 0.05*sin(261.6*2*PI*t)*cos(2*PI*0.12*t) + 0.05*sin(329.6*2*PI*t)*sin(2*PI*0.12*t) + 0.02*(2*random(0)-1)*exp(-40*mod(t,0.242))':s=44100`;

  const args = [
    '-f', 'lavfi',
    '-i', filterExpr,
    '-t', `${d}`,
    '-af', `highpass=f=80,lowpass=f=3200,afade=t=in:st=0:d=0.5,afade=t=out:st=${(d - 0.6).toFixed(2)}:d=0.6`,
    '-y',
    destPath
  ];

  await runFFmpeg(args);
  return destPath;
}

/**
 * Create clean top-left part/series label badge SVG (e.g., Mini Modern Villa • Part 1)
 */
function createPartLabelOverlay(partLabel, destSvgPath) {
  const cleanLabel = (partLabel || 'Mini Build • Part 1')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .trim();

  const labelLength = cleanLabel.length;
  const pillWidth = Math.min(860, Math.max(380, labelLength * 18 + 80));
  const pillX = 60;

  const svg = `<svg width="1080" height="180" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="pillShadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.85"/>
      </filter>
      <linearGradient id="dotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10b981"/>
        <stop offset="100%" stop-color="#059669"/>
      </linearGradient>
    </defs>
    <!-- Frosted Dark Pill Backing -->
    <rect x="${pillX}" y="60" width="${pillWidth}" height="68" rx="22" fill="#030712" fill-opacity="0.80" stroke="rgba(255,255,255,0.22)" stroke-width="2" filter="url(#pillShadow)"/>
    <!-- Glowing Accent Dot -->
    <circle cx="${pillX + 32}" cy="94" r="8" fill="url(#dotGrad)"/>
    <!-- Clean Part / Series Label Typography -->
    <text x="${pillX + 54}" y="103" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="900" fill="#ffffff" letter-spacing="1.2">${cleanLabel}</text>
  </svg>`;

  fs.writeFileSync(destSvgPath, svg, 'utf8');
  return destSvgPath;
}

/**
 * Create color-coded Top-Left Episode Badge SVG
 */
function createBadgeOverlay(townKey, townMemory, episodeNum, destSvgPath) {
  const badgeText = townMemory.badge_text || "CITY";
  const badgeColor = townMemory.badge_color || "#2563eb";
  const badgeAccent = townMemory.badge_accent || "#60a5fa";
  const epString = String(episodeNum).padStart(2, '0');
  const fullLabel = `${badgeText} • EP ${epString}`;

  // SVG badge: 440px wide x 90px tall
  const svg = `<svg width="440" height="90" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${badgeColor}" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="${badgeAccent}" stop-opacity="0.9"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
    </defs>
    <!-- Background Pill with Shadow -->
    <rect x="6" y="6" width="428" height="78" rx="24" fill="#0f172a" fill-opacity="0.8" filter="url(#shadow)" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
    <!-- Color Pill Accent -->
    <rect x="14" y="14" width="70" height="62" rx="16" fill="url(#badgeGrad)"/>
    <!-- Glowing Status Indicator Dot -->
    <circle cx="49" cy="45" r="9" fill="#ffffff" filter="url(#shadow)"/>
    <!-- Typography -->
    <text x="104" y="54" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="2">${fullLabel}</text>
  </svg>`;

  fs.writeFileSync(destSvgPath, svg, 'utf8');
  return destSvgPath;
}

/**
 * Create lower-center high-retention short-form subtitle overlay
 * Features crisp typography, high-contrast yellow/white gradient, bold dark stroke, and drop shadow
 */
function createSubtitleOverlay(text, destSvgPath) {
  const cleanText = (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .trim();

  // Split into punchy 3-5 word lines (max ~28 chars per line)
  const words = cleanText.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const w of words) {
    if ((currentLine + ' ' + w).length > 28) {
      lines.push(currentLine.trim());
      currentLine = w;
    } else {
      currentLine += (currentLine ? ' ' : '') + w;
    }
  }
  if (currentLine) lines.push(currentLine.trim());

  const displayLines = lines.slice(0, 2);
  const maxLineLength = Math.max(...displayLines.map(l => l.length), 10);
  const pillWidth = Math.min(940, Math.max(480, maxLineLength * 31 + 80));
  const pillX = Math.round((980 - pillWidth) / 2);

  const svgHeight = displayLines.length === 1 ? 104 : 160;
  const line1Y = displayLines.length === 1 ? 66 : 60;
  const line2Y = 120;

  const svg = `<svg width="980" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="captionShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.95"/>
      </filter>
    </defs>
    <!-- Dynamic Rounded Frosted Backing Pill -->
    <rect x="${pillX}" y="8" width="${pillWidth}" height="${svgHeight - 16}" rx="24" fill="#030712" fill-opacity="0.68" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>
    <!-- Line 1: Background Heavy Stroke Pass (Outlined without shrinking glyph interior) -->
    <text x="490" y="${line1Y}" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="900" fill="none" stroke="#000000" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" text-anchor="middle" filter="url(#captionShadow)" letter-spacing="1">${displayLines[0] || ''}</text>
    <!-- Line 1: Foreground Pure White Fill -->
    <text x="490" y="${line1Y}" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="900" fill="#ffffff" stroke="none" text-anchor="middle" letter-spacing="1">${displayLines[0] || ''}</text>
    ${displayLines[1] ? `<!-- Line 2: Background Heavy Stroke Pass -->
    <text x="490" y="${line2Y}" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="42" font-weight="900" fill="none" stroke="#000000" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" text-anchor="middle" filter="url(#captionShadow)" letter-spacing="1">${displayLines[1]}</text>
    <!-- Line 2: Foreground High-Retention Yellow Fill -->
    <text x="490" y="${line2Y}" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="42" font-weight="900" fill="#fde047" stroke="none" text-anchor="middle" letter-spacing="1">${displayLines[1]}</text>` : ''}
  </svg>`;

  fs.writeFileSync(destSvgPath, svg, 'utf8');
  return destSvgPath;
}

/**
 * Generate Real-World Construction Process Thumbnail from Stage 5 Keyframe
 */
async function generateThumbnail(stage5Path, townKey, townMemory, episodeNum, subtitle2Word, destThumbPath) {
  console.log(`[AudioMaster] Generating Construction Process Thumbnail -> ${path.basename(destThumbPath)}`);

  const thumbSvgPath = destThumbPath.replace(/\.jpg$/, '_overlay.svg');
  const subText = (subtitle2Word || "CONSTRUCTION PROCESS").toUpperCase();

  const svg = `<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="heavy3d" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.95"/>
      </filter>
      <linearGradient id="gradSub" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="100%" stop-color="#eab308"/>
      </linearGradient>
    </defs>
    <!-- Subtle Dark Vignette Frame Border -->
    <rect x="0" y="0" width="1080" height="1920" fill="none" stroke="#000000" stroke-width="32" stroke-opacity="0.4"/>

    <!-- Center-Bottom Clean Construction Headline Block -->
    <!-- Dark Glass Panel -->
    <rect x="60" y="1520" width="960" height="280" rx="32" fill="#0b0f19" fill-opacity="0.88" stroke="rgba(255,255,255,0.22)" stroke-width="2.5" filter="url(#heavy3d)"/>
    
    <!-- 2-Word Bold Topic Headline -->
    <text x="100" y="1635" font-family="Arial, Helvetica, sans-serif" font-size="68" font-weight="900" fill="url(#gradSub)" filter="url(#heavy3d)" letter-spacing="2">${subText}</text>
    
    <!-- Subtitle Footnote -->
    <text x="100" y="1725" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#94a3b8" letter-spacing="2">MINIATURE FORMWORK &amp; ASMR REVEAL</text>
  </svg>`;

  fs.writeFileSync(thumbSvgPath, svg, 'utf8');

  // Burn thumbnail graphic with Stage 5 image as background
  const args = [
    '-i', stage5Path,
    '-i', thumbSvgPath,
    '-filter_complex', '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[bg];[bg][1:v]overlay=0:0[out]',
    '-map', '[out]',
    '-frames:v', '1',
    '-y',
    destThumbPath
  ];

  await runFFmpeg(args);
  if (fs.existsSync(thumbSvgPath)) fs.unlinkSync(thumbSvgPath);
  console.log(`[AudioMaster] Thumbnail generated successfully (${Math.round(fs.statSync(destThumbPath).size / 1024)} KB)`);
  return destThumbPath;
}

/**
 * Assemble Master Video
 * Concatenates all 5 stages (4 transitions + Grand Finale Reveal),
 * layers ASMR foley + Voiceover narration with breathing pre-roll & post-roll,
 * burns badges & subtitles, and normalizes audio with zero speech cutoffs.
 */
async function assembleMasterVideo(plan, townKey, townMemory, visualResult, outputDir) {
  const finalVideoPath = path.join(outputDir, `${townKey}_ep${plan.episode}.mp4`);
  const finalThumbPath = path.join(outputDir, `${townKey}_ep${plan.episode}_thumb.jpg`);

  const { transitionPaths, finalStagePath } = visualResult;

  // 1. Generate Voiceover Narration for all stages
  console.log(`[AudioMaster] Generating voiceover narration tracks...`);
  const narrationPaths = await generateNarration(plan, outputDir);

  // 2. Render Stage 5 Grand Finale Reveal video clip (so the completed town is fully revealed & narrated)
  const finaleVideoPath = path.join(outputDir, 'finale_reveal.mp4');
  if (!fs.existsSync(finaleVideoPath) || fs.statSync(finaleVideoPath).size < 10000) {
    console.log(`[AudioMaster] Rendering cinematic grand finale reveal for Stage 5 (Transformation Climax)...`);
    const finaleArgs = [
      '-loop', '1', '-t', '3.8', '-i', finalStagePath,
      '-vf', "scale=w='2*trunc((1080*(1.20-0.16*(t/3.8)))/2)':h='2*trunc((1920*(1.20-0.16*(t/3.8)))/2)':eval=frame,crop=1080:1920:'(in_w-1080)*(0.70-0.40*(t/3.8))':'(in_h-1920)*(0.30+0.35*(t/3.8))',scale=1080:1920:out_range=tv,format=yuv420p,settb=AVTB,setpts=PTS-STARTPTS",
      '-r', '30',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-y',
      finaleVideoPath
    ];
    await runFFmpeg(finaleArgs);
  }

  const allVideoTracks = transitionPaths.length >= plan.stages.length
    ? transitionPaths.slice(0, plan.stages.length)
    : [...transitionPaths, finaleVideoPath];

  // 3. Generate ASMR Foley Tracks for all 5 stages based on exact narration duration
  console.log(`[AudioMaster] Synthesizing acoustic ASMR miniature construction foley audio...`);
  const foleyDir = path.join(outputDir, 'foley');
  if (!fs.existsSync(foleyDir)) fs.mkdirSync(foleyDir, { recursive: true });

  const foleyPaths = [];
  const segDurations = [];

  for (let i = 0; i < plan.stages.length; i++) {
    const stage = plan.stages[i];
    const narrAudio = narrationPaths[i] || narrationPaths[0];
    const narrDuration = getMediaDuration(narrAudio);
    // Fast step-by-step cuts (~0.8s–2.2s rhythm across ~14–20s vertical reels)
    const isClimax = (i === plan.stages.length - 1);
    const minDur = isClimax ? 3.0 : 2.2;
    const requiredDuration = narrDuration + 0.15 + 0.35;
    const segDuration = Math.max(requiredDuration, minDur);
    segDurations.push(segDuration);

    const foleyPath = path.join(foleyDir, `foley_${i + 1}.wav`);
    await generateASMRFoley(stage.asmr_type, segDuration, foleyPath);
    foleyPaths.push(foleyPath);
  }

  // 4. Generate clean part/series label badge (e.g., Mini Modern Villa • Part 1)
  const segmentsDir = path.join(outputDir, 'segments');
  if (!fs.existsSync(segmentsDir)) fs.mkdirSync(segmentsDir, { recursive: true });

  const structureName = plan.multipart_info?.structure_name || plan.structure_name || plan.title || 'Structure';
  const partNum = plan.multipart_info?.part || plan.part || (((plan.episode - 1) % 4) + 1);
  const partLabel = `Mini ${structureName} • Part ${partNum}`;
  const partBadgeSvgPath = path.join(segmentsDir, 'part_badge.svg');
  createPartLabelOverlay(partLabel, partBadgeSvgPath);

  // Combine each segment: Video Track + Sync Narration & Foley + Clean Subtitle + Clean Part Label
  const segmentPaths = [];

  for (let i = 0; i < plan.stages.length; i++) {
    const stage = plan.stages[i];
    const transVideo = allVideoTracks[i] || allVideoTracks[allVideoTracks.length - 1];
    const narrAudio = narrationPaths[i] || narrationPaths[0];
    const foleyAudio = foleyPaths[i];
    const segDuration = segDurations[i];
    const videoDuration = getMediaDuration(transVideo);
    const segmentDest = path.join(segmentsDir, `segment_${i + 1}.mp4`);

    const subSvgPath = path.join(segmentsDir, `sub_${i + 1}.svg`);
    createSubtitleOverlay(stage.narration, subSvgPath);

    console.log(`[AudioMaster] Mastering Segment ${i + 1}/${plan.stages.length} (Duration: ${segDuration.toFixed(2)}s, Voiceover: ${getMediaDuration(narrAudio).toFixed(2)}s)...`);

    // Ensure continuous visual motion across segment duration without sluggish slow-motion
    let vFilter = '[0:v]';
    if (videoDuration > 0 && videoDuration < segDuration) {
      const stretch = Math.min(segDuration / videoDuration, 1.25);
      const padSec = Math.max(0, segDuration - videoDuration * stretch);
      vFilter = `[0:v]setpts=${stretch.toFixed(4)}*PTS${padSec > 0.05 ? `,tpad=stop_mode=clone:stop_duration=${padSec.toFixed(2)}` : ''}[vcut];[vcut]`;
    } else if (videoDuration >= segDuration) {
      vFilter = `[0:v]trim=duration=${segDuration.toFixed(2)},setpts=PTS-STARTPTS[vcut];[vcut]`;
    }

    const filterComplex = [
      `${vFilter}[4:v]overlay=0:0[vbadge];[vbadge][3:v]overlay=50:1440[vout]`,
      `[1:a]adelay=150|150,volume=1.0,highpass=f=100,lowpass=f=7500[anarr]`,
      `[2:a]volume=0.25,highpass=f=120,lowpass=f=6500,afade=t=in:st=0:d=0.2,afade=t=out:st=${(segDuration - 0.3).toFixed(2)}:d=0.3[afoley]`,
      `[anarr][afoley]amix=inputs=2:duration=longest:dropout_transition=0,volume=1.0,alimiter=limit=0.94[aout]`
    ].join(';');

    const segmentArgs = [
      '-i', transVideo,
      '-i', narrAudio,
      '-i', foleyAudio,
      '-i', subSvgPath,
      '-i', partBadgeSvgPath,
      '-filter_complex', filterComplex,
      '-map', '[vout]',
      '-map', '[aout]',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '20',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-pix_fmt', 'yuv420p',
      '-t', `${segDuration.toFixed(2)}`,
      '-y',
      segmentDest
    ];

    await runFFmpeg(segmentArgs);
    if (fs.existsSync(subSvgPath)) fs.unlinkSync(subSvgPath);
    segmentPaths.push(segmentDest);
  }

  if (fs.existsSync(partBadgeSvgPath)) fs.unlinkSync(partBadgeSvgPath);

  // 5. Generate Continuous Energetic Background Music Bed with Smooth Ducking
  const totalMasterDuration = segDurations.reduce((a, b) => a + b, 0);
  const climaxStartTime = segDurations.slice(0, segDurations.length - 1).reduce((a, b) => a + b, 0);

  console.log(`[AudioMaster] Generating energetic rhythmic background music bed (${totalMasterDuration.toFixed(1)}s, Climax at ${climaxStartTime.toFixed(1)}s)...`);
  const bgmDir = path.join(outputDir, 'bgm');
  if (!fs.existsSync(bgmDir)) fs.mkdirSync(bgmDir, { recursive: true });
  const bgmPath = path.join(bgmDir, 'bgm_bed.wav');
  await generateBackgroundMusic(totalMasterDuration + 2.0, bgmPath);

  // Concatenate all 5 segments and mix with background music (smooth ducking under voice, swell at transformation climax)
  console.log(`[AudioMaster] Concatenating ${segmentPaths.length} segments with master background music ducking...`);
  const concatFilter = [];
  const concatInputs = [];
  for (let i = 0; i < segmentPaths.length; i++) {
    concatInputs.push('-i', segmentPaths[i]);
    concatFilter.push(`[${i}:v][${i}:a]`);
  }
  const bgmInputIndex = segmentPaths.length;
  concatInputs.push('-i', bgmPath);

  concatFilter.push(`concat=n=${segmentPaths.length}:v=1:a=1[vmaster][aspeech];`);
  concatFilter.push(`[${bgmInputIndex}:a]volume='if(gte(t,${climaxStartTime.toFixed(2)}), 0.16, 0.06)':eval=frame[abgm_ducked];`);
  concatFilter.push(`[aspeech][abgm_ducked]amix=inputs=2:duration=first:dropout_transition=0,volume=1.0,alimiter=limit=0.94[amaster]`);

  const concatArgs = [
    ...concatInputs,
    '-filter_complex', concatFilter.join(''),
    '-map', '[vmaster]',
    '-map', '[amaster]',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '19',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-y',
    finalVideoPath
  ];

  await runFFmpeg(concatArgs);

  // 6. Generate Clean Construction Process Thumbnail
  await generateThumbnail(finalStagePath, townKey, townMemory, plan.episode, plan.subtitle_2word, finalThumbPath);

  const finalDuration = getMediaDuration(finalVideoPath);
  console.log(`[AudioMaster] MASTER VIDEO COMPLETE: ${finalVideoPath} (Duration: ${finalDuration.toFixed(1)}s, ${Math.round(fs.statSync(finalVideoPath).size / (1024 * 1024))} MB)`);

  return {
    finalVideoPath,
    finalThumbPath
  };
}

module.exports = {
  generateNarration,
  generateASMRFoley,
  generateBackgroundMusic,
  createBadgeOverlay,
  createPartLabelOverlay,
  createSubtitleOverlay,
  generateThumbnail,
  assembleMasterVideo,
  runFFmpeg
};
