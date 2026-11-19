# Hybrid Local-Queue + GitHub-Scheduled-Upload Automation Guide

This guide details the **Hybrid Local-Queue + GitHub-Scheduled-Upload architecture** for `real-mini-township-autopilot`. It allows you to pre-generate genuine 1:87 HO-scale miniature diorama construction episodes using **Google AI Pro (Google Flow / Veo)** whenever your Windows 11 laptop is turned on, while **GitHub Actions publishes them autonomously on schedule** (even when your laptop is turned off or in sleep mode).

Local disk space is automatically capped under **2.0 GB** with smart cleanup of previously published episodes.

---

## 1. System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ WINDOWS 11 LAPTOP (Runs whenever turned on or via Task Scheduler)      │
│                                                                        │
│ 1. Storage Auto-Cleanup:                                               │
│    Reads state/upload_queue.json and deletes raw clips and rendered    │
│    .mp4/.jpg files for any episodes marked uploaded: true.             │
│                                                                        │
│ 2. Storage Quota Check:                                                │
│    Ensures total local queue size is strictly < 1.8 GB (Hard Cap: 2GB) │
│                                                                        │
│ 3. Batch Diorama Generation:                                           │
│    Uses Google Flow / Veo (Playwright) to generate 5 real-motion clips  │
│    across Mountain Village, Smart City, and Desert Town.               │
│                                                                        │
│ 4. Cloud Release Hosting:                                              │
│    Uploads .mp4 & .jpg to GitHub Releases (keeps git repo < 5 MB)      │
│    and pushes metadata to state/upload_queue.json on origin/main.      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Pushes state/upload_queue.json
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ GITHUB ACTIONS CLOUD SCHEDULE (Runs 24/7 even with laptop powered off) │
│                                                                        │
│ 06:00 UTC (11:30 AM IST) -> Mountain Village                           │
│ 12:00 UTC (05:30 PM IST) -> Smart City                                 │
│ 17:00 UTC (10:30 PM IST) -> Desert Town                                │
│                                                                        │
│ 1. Checks state/upload_queue.json for pre-rendered Google Flow asset   │
│ 2. Downloads master .mp4 & thumbnail from GitHub Release asset         │
│ 3. Publishes to YouTube Shorts (+ Instagram / Facebook Reels if set)   │
│ 4. Deletes GitHub Release asset to conserve cloud quota                │
│ 5. Marks episode uploaded: true in state/upload_queue.json             │
│ 6. Syncs updated state back to origin/main                             │
│                                                                        │
│ * Note: If queue is empty, falls back to autonomous cloud diffusion    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. One-Time Setup: Authenticate Google Flow (`npm run local:login`)

Log into your Google AI Pro / Veo account once in a persistent Chrome browser profile:

```cmd
npm run local:login
```

* Chrome opens to `https://labs.google/fx/tools/flow`.
* Log in with your Google account that has Google AI Pro access.
* Once you see the Google Flow generation interface, return to the terminal and press **ENTER**.
* Session cookies and storage are saved in `.browser_profile/` (strictly gitignored).

---

## 3. Local Queue Management Commands

### A. Batch Generate Upcoming Episodes (`npm run local:queue`)
Pre-generates upcoming episodes across the 3 towns, uploads assets to GitHub Releases, and updates `state/upload_queue.json`:

```cmd
npm run local:queue
```

#### Optional Options:
* `--max=5`: Set maximum episodes to batch build in this session (Default: 3).
* `--town=smart_city`: Target a specific town instead of auto-balancing.
* `--clean-only`: Run storage cleanup of uploaded files and exit.
* `--dry-run`: Render and master locally without uploading to GitHub Releases.
* `--headless`: Run Playwright in background without visible Chrome window.

### B. Quick Storage Cleanup (`npm run queue:clean`)
Reclaims local disk space immediately by deleting files for episodes already uploaded by GitHub Actions:

```cmd
npm run queue:clean
```

---

## 4. Automatic Startup & Cleanup on Windows 11

### A. One-Click Batch Runner (`run_township_queue.bat`)
A lightweight batch runner is included in the project root:
* Pulls the latest upload status from GitHub (`git pull --rebase origin main`).
* Cleans up local disk space for all published episodes.
* Tops up the queue with upcoming episodes while total storage is under **1.8 GB**.
* Logs all activity to `logs/queue_run.log`.

You can double-click `run_township_queue.bat` at any time, or let Windows Task Scheduler run it automatically.

### B. Task Scheduler Setup (Runs whenever Laptop Turns On)

#### Option 1: PowerShell Command (Recommended)
Open **PowerShell as Administrator** and execute:

```powershell
$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument '/c "cd /d C:\real-mini-township && run_township_queue.bat --no-pause"'
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName "RealMiniTownshipQueue" -Action $Action -Trigger $Trigger -Settings $Settings -Description "Autonomous 2GB-Capped Mini Township Diorama Batch Builder"
```

#### Option 2: Windows GUI Task Scheduler
1. Press `Win + R`, type `taskschd.msc`, and press **Enter**.
2. Click **Create Basic Task...** in the Actions pane on the right.
3. **Name**: `Real Mini Township Queue Builder`.
4. **Trigger**: Select **When I log on** (or choose **Daily** at a preferred time).
5. **Action**: Select **Start a program**.
   * **Program/script**: `cmd.exe`
   * **Add arguments**: `/c "cd /d C:\real-mini-township && run_township_queue.bat --no-pause"`
6. Click **Next**, check **Open the Properties dialog for this task when I click Finish**, and click **Finish**.
7. In the Properties window:
   * **Conditions** tab: Uncheck *"Start the task only if the computer is on AC power"*.
   * **Settings** tab: Check *"Run task as soon as possible after a scheduled start is missed"*.
8. Click **OK** to save.

---

## 5. Storage Quota & GitHub Release Secrets

### Local Storage Enforcement (2 GB Limit)
* **Soft limit (1.8 GB)**: The runner stops generating new episodes once total folder size in `output/` + `queue_out/` reaches 1.8 GB, preventing laptop disk bloat.
* **Hard cap (2.0 GB)**: Generation is strictly halted until GitHub Actions publishes pending episodes and frees local storage during the next startup cleanup.

### GitHub Release Hosting (`GITHUB_TOKEN` in `.env`)
To allow the local batch builder to upload large `.mp4` and `.jpg` assets to GitHub Releases, add your GitHub Personal Access Token to your local `.env`:

```env
GITHUB_TOKEN=ghp_yourPersonalAccessTokenHere
```

*(Token requires `repo` scope to create releases and upload assets).*
