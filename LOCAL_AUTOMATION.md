# Local Windows 11 Automation Guide (Google Flow / Veo + YouTube Shorts)

This guide explains how to generate genuine, continuous-motion miniature diorama construction videos using your authenticated **Google AI Pro (Google Flow / Veo)** browser session on Windows 11, then automatically assemble neural voiceover, acoustic ASMR foley, dynamic subtitles, series badges, and upload directly to **YouTube Shorts**.

---

## 1. Quick Architecture Overview

```
[Google Flow / Veo (labs.google/fx/tools/flow)]
         │ (Automated via Playwright with persistent session in .browser_profile)
         ▼
[5x High-Fidelity 1:87 HO-Scale Diorama Construction Video Clips]
         │ (Saved & Standardized to 1080x1920 @ 30fps)
         ▼
[Audio/Video Mastering Engine]
  ├── Azure Neural Voiceover (Microsoft Edge-TTS "en-US-AndrewNeural")
  ├── Multi-Layer Acoustic ASMR Foley (cement, troweling, tweezing, rolling)
  ├── Pre-Roll (400ms) & Post-Roll (600ms) settling padding (zero voice cutoffs)
  ├── Re-encoded Filter-Complex Concat (concat=n=5:v=1:a=1)
  ├── 3D High-Contrast Thumbnail (1080x1920 JPEG)
  └── Dynamic Episode & Series SVG Badge Overlays
         ▼
[Autonomous Dispatch & Continuity Sync]
  ├── Direct YouTube Shorts Upload via YouTube Data API v3
  └── State Continuity Update (state/town_memory.json & anchor frame)
```

---

## 2. One-Time Setup: Authenticate Google Flow (`npm run local:login`)

To allow Playwright to generate videos using your **Google AI Pro** subscription, log in once using the dedicated setup command:

```cmd
npm run local:login
```

### What Happens:
1. Google Chrome opens to `https://labs.google/fx/tools/flow`.
2. Sign in to your Google Account that has Google AI Pro / Veo access.
3. Once you see the Google Flow project or prompt interface, return to your terminal and press **ENTER** (or close the browser window).
4. All authentication tokens, cookies, and local state are saved to `.browser_profile/`.

> [!IMPORTANT]
> Both `.browser_profile/` and `.env` are strictly listed in `.gitignore`. Your Google session credentials and cookies will **NEVER** be committed or pushed to GitHub.

---

## 3. Running Local Generation & Testing

### A. Test Run (Dry Run — Video Generation & Assembly Only)
Inspect the generated video and 3D thumbnail locally in `output/` without uploading:

```cmd
npm run local:auto -- --town=smart_city --dry-run
```

Available series keys:
* `--town=smart_city` (Metropolis Smart City series)
* `--town=mountain_village` (Alpine Mountain Village series)
* `--town=desert_town` (Desert Outpost series)

### B. Live Run (Generate + Auto-Upload to YouTube Shorts)
Once tested, run without `--dry-run` to generate the next episode and automatically publish it to YouTube Shorts:

```cmd
npm run local:auto -- --town=smart_city
```

### Optional Command-Line Flags
* `--headless`: Runs the browser silently in the background (default is a visible Chrome window so you can watch generation live).
* `--timeout=240000`: Sets custom max wait time per stage in milliseconds (default: 180,000 ms = 3 minutes).
* `--skip-browser`: Skips the Flow generation step and re-masters existing clips in `output/<town_key>_ep<num>/clips/`.

---

## 4. Automatic Execution on Windows 11 (Task Scheduler)

You can configure Windows 11 to automatically run the builder and publish fresh episodes whenever your laptop turns on or on a schedule.

### Option A: One-Click PowerShell Command (Recommended)

Open **PowerShell as Administrator** and run:

```powershell
$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument '/c "cd /d C:\real-mini-township && npm run local:auto"'
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName "RealMiniTownshipAutopilot" -Action $Action -Trigger $Trigger -Settings $Settings -Description "Autonomous Mini Township Diorama Builder & YouTube Shorts Generator"
```

### Option B: Windows GUI Task Scheduler Step-by-Step

1. Press `Win + R`, type `taskschd.msc`, and press **Enter**.
2. In the right-hand panel, click **Create Basic Task...**.
3. **Name**: `Real Mini Township Autopilot`.
4. **Trigger**: Select **When I log on** (or choose **Daily** at your preferred time, e.g., 11:30 AM IST).
5. **Action**: Select **Start a program**.
   * **Program/script**: `cmd.exe`
   * **Add arguments**: `/c "cd /d C:\real-mini-township && npm run local:auto"`
6. Click **Next**, check **Open the Properties dialog for this task when I click Finish**, and click **Finish**.
7. In the Properties window:
   * Go to the **Conditions** tab.
   * **Uncheck** *"Start the task only if the computer is on AC power"* (so it runs even when running on battery).
   * **Check** *"Wake the computer to run this task"* (optional).
8. Click **OK** to save.

---

## 5. YouTube API Credentials in `.env` (For Local Direct Uploads)

If you want the local Windows runner to upload directly to your YouTube channel (rather than relying solely on GitHub Actions cloud runs), ensure your local `.env` file contains:

```env
YOUTUBE_CLIENT_ID=your_client_id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REFRESH_TOKEN=your_refresh_token
YOUTUBE_PRIVACY=public
```

If these keys are omitted or if `--dry-run` is active, the runner will assemble the complete 1080x1920 Short and 3D thumbnail in `output/` and cleanly skip upload without throwing any errors.
