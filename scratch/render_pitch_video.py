import os, sys, subprocess, json

WORK_DIR = '/Users/maharshipandya/Documents/PayPal AI Hackathon/brag-output/work'
OUTPUT_DIR = '/Users/maharshipandya/Documents/PayPal AI Hackathon/brag-output'
SCREENSHOTS_DIR = os.path.join(WORK_DIR, 'screenshots')
AUDIO_DIR = os.path.join(WORK_DIR, 'audio')
MUSIC_FILE = os.path.join(WORK_DIR, 'music', 'happy-beats-business-moves-vol-1-by-ende-dot-app.mp3')
SFX_DIR = os.path.join(WORK_DIR, 'sfx')

os.makedirs(os.path.join(WORK_DIR, 'scene_renders'), exist_ok=True)

# Master Scene Definitions matching the exact 180.00s plan
SCENES = [
    {
        "id": "scene_01",
        "title": "THE ACUTE CRISIS & 0% PLATFORM TAKE RATE",
        "route": "givi-web.onrender.com",
        "duration": 16.50,
        "vo_file": os.path.join(AUDIO_DIR, "scene_01_timed.wav"),
        "shots": [
            {"img": "screen-01-landing.jpg", "dur": 8.50, "zoom": "in"},
            {"img": "screen-02-auth.jpg", "dur": 8.00, "zoom": "out"}
        ]
    },
    {
        "id": "scene_02",
        "title": "DONOR ONBOARDING & PAYPAL WALLET PRELOAD",
        "route": "/onboarding/donor",
        "duration": 17.50,
        "vo_file": os.path.join(AUDIO_DIR, "scene_02_timed.wav"),
        "shots": [
            {"img": "screen-03-onboarding-passions.png", "dur": 4.50, "zoom": "none"},
            {"img": "screen-04-onboarding-mode.png", "dur": 4.00, "zoom": "none"},
            {"img": "screen-05-wallet-preload-modal.png", "dur": 4.50, "zoom": "in"},
            {"img": "screen-07-givi-pass.jpg", "dur": 4.50, "zoom": "out"}
        ]
    },
    {
        "id": "scene_03",
        "title": "THE MICRO-RELIEF SWIPE DECK & SUPER SWIPES",
        "route": "/feed",
        "duration": 19.50,
        "vo_file": os.path.join(AUDIO_DIR, "scene_03_timed.wav"),
        "shots": [
            {"img": "screen-08-swipe-deck.jpg", "dur": 19.50, "zoom": "subtle_in"}
        ]
    },
    {
        "id": "scene_04",
        "title": "BENEFICIARY DIGNIFIED INTAKE & PAYPAL RAIL",
        "route": "/onboarding/beneficiary",
        "duration": 19.00,
        "vo_file": os.path.join(AUDIO_DIR, "scene_04_timed.wav"),
        "shots": [
            {"img": "screen-14-beneficiary-step1.png", "dur": 4.00, "zoom": "none"},
            {"img": "screen-15-beneficiary-step2.png", "dur": 4.00, "zoom": "none"},
            {"img": "screen-16-beneficiary-step3.png", "dur": 5.00, "zoom": "none"},
            {"img": "screen-17-beneficiary-step4.png", "dur": 6.00, "zoom": "in"}
        ]
    },
    {
        "id": "scene_05",
        "title": "GEMINI MULTIMODAL VISION & PRIVACY SHIELD",
        "route": "/profile (beneficiary)",
        "duration": 18.00,
        "vo_file": os.path.join(AUDIO_DIR, "scene_05_timed.wav"),
        "shots": [
            {"img": "screen-20-beneficiary-profile.png", "dur": 8.00, "zoom": "out"},
            {"img": "screen-21-beneficiary-gemini-vision.jpg", "dur": 10.00, "zoom": "in"}
        ]
    },
    {
        "id": "scene_06",
        "title": "EXPLORE DIRECTORY & BENEFICIARY LIVE AID TRACKER",
        "route": "/explore • /my-causes",
        "duration": 18.00,
        "vo_file": os.path.join(AUDIO_DIR, "scene_06_timed.wav"),
        "shots": [
            {"img": "screen-09-explore.jpg", "dur": 8.50, "zoom": "subtle_in"},
            {"img": "screen-19-beneficiary-tracker.jpg", "dur": 9.50, "zoom": "in"}
        ]
    },
    {
        "id": "scene_07",
        "title": "COMMUNITY IMPACT LEADERBOARD (#1 PODIUM)",
        "route": "/leaderboard",
        "duration": 13.00,
        "vo_file": os.path.join(AUDIO_DIR, "scene_07_timed.wav"),
        "shots": [
            {"img": "screen-10-leaderboard.jpg", "dur": 7.00, "zoom": "in"},
            {"img": "screen-10b-leaderboard-table.png", "dur": 6.00, "zoom": "out"}
        ]
    },
    {
        "id": "scene_08",
        "title": "DONOR PROFILE & ADVANCED VISUAL ANALYTICS",
        "route": "/profile (donor)",
        "duration": 12.50,
        "vo_file": os.path.join(AUDIO_DIR, "scene_08_timed.wav"),
        "shots": [
            {"img": "screen-11-donor-profile.jpg", "dur": 6.50, "zoom": "in"},
            {"img": "screen-11b-donor-profile-full.png", "dur": 6.00, "zoom": "out"}
        ]
    },
    {
        "id": "scene_09",
        "title": "AUTONOMOUS GIVING AGENT (BACKGROUND COMMERCE)",
        "route": "/agent",
        "duration": 15.50,
        "vo_file": os.path.join(AUDIO_DIR, "scene_09_timed.wav"),
        "shots": [
            {"img": "screen-12-agent.jpg", "dur": 15.50, "zoom": "in"}
        ]
    },
    {
        "id": "scene_10",
        "title": "RADICAL AG GRID PUBLIC TRANSPARENCY LEDGER",
        "route": "/transparency",
        "duration": 18.50,
        "vo_file": os.path.join(AUDIO_DIR, "scene_10_timed.wav"),
        "shots": [
            {"img": "screen-13-transparency-ledger.jpg", "dur": 18.50, "zoom": "subtle_in"}
        ]
    },
    {
        "id": "scene_11",
        "title": "THE MICRO-RELIEF REVOLUTION (GIVI 2026)",
        "route": "givi. Direct Relief",
        "duration": 12.00,
        "vo_file": os.path.join(AUDIO_DIR, "scene_11_timed.wav"),
        "shots": [
            {"img": "screen-13-transparency-ledger.jpg", "dur": 3.00, "zoom": "out"},
            {"img": "screen-07-givi-pass.jpg", "dur": 3.00, "zoom": "in"},
            {"img": "screen-08-swipe-deck.jpg", "dur": 3.00, "zoom": "subtle_in"},
            {"img": "logo.png", "dur": 3.00, "zoom": "none"}
        ]
    }
]

def render_shot(img_path, duration, output_path, zoom="none"):
    # Render a single still image into a video clip with 1920x1080 resolution
    # Uses high quality bicubic scaling and optional subtle zoom/pan
    fps = 30
    total_frames = int(duration * fps)

    if zoom == "in":
        vf = f"scale=2016:1134,zoompan=z='min(zoom+0.0008,1.06)':d={total_frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps={fps}"
    elif zoom == "subtle_in":
        vf = f"scale=1960:1102,zoompan=z='min(zoom+0.0004,1.03)':d={total_frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps={fps}"
    elif zoom == "out":
        vf = f"scale=2016:1134,zoompan=z='if(lte(zoom,1.0),1.06,max(1.001,zoom-0.0008))':d={total_frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps={fps}"
    else:
        vf = f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0xFAF9F7,fps={fps}"

    cmd = [
        "/opt/homebrew/bin/ffmpeg", "-y",
        "-loop", "1",
        "-i", img_path,
        "-vf", vf,
        "-t", f"{duration:.3f}",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "veryfast",
        "-r", "30",
        output_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def render_scene(scene, idx):
    scene_id = scene["id"]
    total_dur = scene["duration"]
    print(f"[{idx+1}/11] Rendering {scene_id} ({scene['title']}) — {total_dur:.2f}s...")

    # 1. Render sub-shots
    shot_clips = []
    for s_idx, shot in enumerate(scene["shots"]):
        shot_out = os.path.join(WORK_DIR, 'scene_renders', f"{scene_id}_shot_{s_idx}.mp4")
        img_full = os.path.join(SCREENSHOTS_DIR, shot["img"])
        render_shot(img_full, shot["dur"], shot_out, shot.get("zoom", "none"))
        shot_clips.append(shot_out)

    # 2. Concat shots into visual track
    concat_txt = os.path.join(WORK_DIR, 'scene_renders', f"{scene_id}_shots.txt")
    with open(concat_txt, "w") as f:
        for c in shot_clips:
            f.write(f"file '{c}'\n")

    shots_combined = os.path.join(WORK_DIR, 'scene_renders', f"{scene_id}_visual_base.mp4")
    subprocess.run([
        "/opt/homebrew/bin/ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", concat_txt,
        "-c", "copy",
        shots_combined
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 3. Add stylish, professional HUD overlays:
    # - Top Brand Pill (givi. ✦ 0% take rate ✦ 100% direct payouts)
    # - Bottom Left Scene Badge (e.g. SCENE 01 / 11 · TITLE)
    # - Bottom Right Live Route Badge (e.g. ROUTE: /feed)
    # Drawboxes & text using ffmpeg drawtext filter with crisp typography
    scene_num = idx + 1
    badge_title = f"{scene_num:02d} | {scene['title']}"
    route_badge = f"{scene['route']}"
    
    font_sans = "/System/Library/Fonts/SFNS.ttf"
    if not os.path.exists(font_sans):
        font_sans = "/System/Library/Fonts/Helvetica.ttc"

    # Escaping for drawtext
    escaped_title = badge_title.replace(":", "\\:").replace("'", "").replace(",", "\\,")
    escaped_route = route_badge.replace(":", "\\:").replace("'", "").replace(",", "\\,")

    filter_complex = (
        f"[0:v]"
        # Top banner background bar
        f"drawbox=x=0:y=0:w=1920:h=46:color=black@0.55:t=fill,"
        # Top brand text
        f"drawtext=fontfile='{font_sans}':text='givi.  ✦  100% DIRECT PAYPAL PAYOUTS  ✦  0% TAKE FEE  ✦  GEMINI VISION VERIFIED':fontcolor=0x22c55e:fontsize=16:x=32:y=15,"
        f"drawtext=fontfile='{font_sans}':text='PAYPAL AI HACKATHON 2026':fontcolor=white:fontsize=15:x=w-tw-32:y=15,"
        # Lower third badge background
        f"drawbox=x=32:y=1000:w=880:h=52:color=black@0.75:t=fill,"
        f"drawbox=x=32:y=1000:w=6:h=52:color=0x22c55e:t=fill,"
        # Lower third title
        f"drawtext=fontfile='{font_sans}':text='{escaped_title}':fontcolor=white:fontsize=18:x=52:y=1016,"
        # Route pill background
        f"drawbox=x=w-tw-72:y=1000:w=300:h=52:color=black@0.75:t=fill,"
        f"drawtext=fontfile='{font_sans}':text='ROUTE\\: {escaped_route}':fontcolor=0x86efac:fontsize=16:x=w-tw-52:y=1017[v_out]"
    )

    visual_with_hud = os.path.join(WORK_DIR, 'scene_renders', f"{scene_id}_visual_hud.mp4")
    subprocess.run([
        "/opt/homebrew/bin/ffmpeg", "-y",
        "-i", shots_combined,
        "-filter_complex", filter_complex,
        "-map", "[v_out]",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "veryfast",
        "-t", f"{total_dur:.3f}",
        visual_with_hud
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 4. Mix Scene Audio:
    # Visual duration = total_dur
    # Voiceover starts at 0.50s
    vo_file = scene["vo_file"]
    scene_final = os.path.join(WORK_DIR, 'scene_renders', f"{scene_id}_final.mp4")

    # Audio filter pads voiceover with 0.5s silence at start, and pads to exact total_dur
    audio_filter = (
        f"[1:a]adelay=500|500,apad=pad_dur={total_dur:.3f}[a_pad];"
        f"[a_pad]atrim=0:{total_dur:.3f}[a_out]"
    )

    subprocess.run([
        "/opt/homebrew/bin/ffmpeg", "-y",
        "-i", visual_with_hud,
        "-i", vo_file,
        "-filter_complex", audio_filter,
        "-map", "0:v",
        "-map", "[a_out]",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-t", f"{total_dur:.3f}",
        scene_final
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print(f"  ✓ {scene_id} rendered cleanly ({total_dur:.2f}s)!")
    return scene_final

def main():
    print("==================================================")
    print("STARTING 3-MINUTE GIVI PITCH VIDEO COMPOSITION")
    print("Target Duration: EXACTLY 180.00 SECONDS")
    print("Voice Agent: Jessica (af_jessica)")
    print("==================================================")

    final_scene_clips = []
    for idx, sc in enumerate(SCENES):
        clip = render_scene(sc, idx)
        final_scene_clips.append(clip)

    # Concat all 11 scene clips
    concat_list = os.path.join(WORK_DIR, "all_scenes.txt")
    with open(concat_list, "w") as f:
        for clip in final_scene_clips:
            f.write(f"file '{clip}'\n")

    assembled_video = os.path.join(WORK_DIR, "givi_pitch_assembled_vo.mp4")
    print("\nConcatenating 11 scenes into master timeline...")
    subprocess.run([
        "/opt/homebrew/bin/ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", concat_list,
        "-c", "copy",
        assembled_video
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Now add background music layer (Happy Beats / Business Moves Vol 1)
    # Loop music, duck to 0.16 during speech, swell to 0.28, fade out at end (177s-180s)
    # Master video duration: 180.000s
    print("\nMixing background score with voiceover ducking...")
    master_video = os.path.join(OUTPUT_DIR, "brag.mp4")

    # Music filter:
    # 1. Loop music to cover 180s
    # 2. Sidechain ducking against the voiceover track:
    # When voiceover is active, music ducks to ~0.16. When voiceover pauses, music gently swells to 0.28.
    # Fade in over 1.5s, fade out over 3.0s at end
    music_mix_filter = (
        f"[1:a]aloop=loop=-1:size=2e+09,atrim=0:180.000,afade=t=in:st=0:d=1.5,afade=t=out:st=176.5:d=3.5,volume=0.26[music_bed];"
        f"[music_bed][0:a]sidechaincompress=threshold=0.08:ratio=4:attack=50:release=400[ducked_music];"
        f"[0:a]volume=1.05[vo_boost];"
        f"[ducked_music][vo_boost]amix=inputs=2:duration=first:dropout_transition=0[a_final]"
    )

    subprocess.run([
        "/opt/homebrew/bin/ffmpeg", "-y",
        "-i", assembled_video,
        "-i", MUSIC_FILE,
        "-filter_complex", music_mix_filter,
        "-map", "0:v",
        "-map", "[a_final]",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "256k",
        "-t", "180.000",
        master_video
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Extract best poster frame (e.g. from Scene 07 at ~110s where Maharshi is #1 on Podium, or givi. Pass)
    poster_frame = os.path.join(OUTPUT_DIR, "brag.jpg")
    print("\nExtracting pristine poster thumbnail (brag.jpg)...")
    subprocess.run([
        "/opt/homebrew/bin/ffmpeg", "-y",
        "-ss", "00:01:50.000",
        "-i", master_video,
        "-vframes", "1",
        "-q:v", "2",
        poster_frame
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Check final duration of master_video
    probe_cmd = [
        "/opt/homebrew/bin/ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        master_video
    ]
    res = subprocess.run(probe_cmd, capture_output=True, text=True, check=True)
    final_dur = float(res.stdout.strip())

    print("\n==================================================")
    print("MASTER VIDEO GENERATION COMPLETE!")
    print(f"Output File: {master_video}")
    print(f"Poster File: {poster_frame}")
    print(f"Total Measured Duration: {final_dur:.3f} seconds")
    print(f"Strict 180s Requirement Met: {abs(final_dur - 180.0) < 0.1}")
    print("==================================================")

if __name__ == '__main__':
    main()

