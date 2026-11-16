# EcoDrone Solutions Inc. — preview site (draft, noindex)

Serve locally:  cd /workspace/ecodrone-site && python3 -m http.server 8080  →  http://localhost:8080/
Rebuild pages:  python3 _build/build.py  (generates the 8 root pages)
Every page carries <meta name="robots" content="noindex,nofollow">; robots.txt disallows all.

## Design
Slate/charcoal + fresh green is the sole design at the root (css/site.css).

## Media
All photos and clips are stills or cuts from EcoDrone / Western Work Drones' own field footage (Daryl's Google Drive). No stock or AI imagery.
Clips: muted, looping, no audio; H.264 MP4 (Main profile, level 3.1, yuv420p, +faststart) listed first, plus VP9 WebM and a JPG poster.
Under prefers-reduced-motion: reduce, the clip is hidden and the poster shown; js/site.js pauses playback. If autoplay is refused (e.g. iOS Low Power Mode), a "Tap to play" button appears over the poster.

| Clip | Page / slot | Drive ID | Source timecode | MP4 / WebM / poster |
|---|---|---|---|---|
| vid/hero-reseeding | Home, hero background | 1ydMrIfAk9fDmRA6rVmO3_kXKD67LfHGu | 00:08–00:16 | 2.15 MB / 1.85 MB / 183 KB |
| vid/spreading-pass | Services, seed & material dispersal | 1DbPKUqqqjBZHrzueIPL3uUelOmjZQEIr | 00:00–00:07 | 1.13 MB / 0.91 MB / 176 KB |
| vid/heavy-lift | Services, heavy material lifting | 1-yvJ8Bq90tyftr-TmGMr9fBzop4GUh14 | 00:06–00:11 | 0.21 MB / 0.17 MB / 9 KB |
| vid/aerial-site-check | Services, "From the air" | 18HLYO6oXCEy8mf3wdlE-X71ZFCFcWfv2 | 00:00–00:08 | 1.14 MB / 1.00 MB / 210 KB |
| vid/burn-slope-site | Projects, right-of-way reseeding | 1qsnaXFoRiBwjsbOv40W1i0O112S1QOd1 | 01:22–01:29 (4:5 crop) | 1.09 MB / 0.91 MB / 104 KB |
| vid/reseed-terrace | Projects, slope reseeding | 1uCw5HhklhAEpZ949TyzpKJkrOmHrxR1e | 00:18–00:26 | 1.20 MB / 0.97 MB / 180 KB |

| Image | Drive ID | Notes |
|---|---|---|
| img/reseed-06.jpg | 1ydMrIfAk9fDmRA6rVmO3_kXKD67LfHGu | still @14s |
| img/reseed-07.jpg | 1U6K9SJE7kmqTLdfxR9tTUrl6riXAN13n | still @20s |
| img/reseed-10.jpg | 1sd5sfwwpalDylUDu9Mq_qODVYykL1Gy8 | still @20s |
| img/j150-forest-seeding.jpg | 1F39vjMkILM9UwVmlytLaN2vIdAc2CSKt | graded frame, cropped 4:5 |
| img/burn-slope-01.jpg | 1qsnaXFoRiBwjsbOv40W1i0O112S1QOd1 | still @84s |
| img/burn-slope-02.jpg | 1qsnaXFoRiBwjsbOv40W1i0O112S1QOd1 | still @96s |
| img/heavy-lift-sling.jpg | 1-yvJ8Bq90tyftr-TmGMr9fBzop4GUh14 | still @9.5s |
| img/Ecodrone-Logo-*.png | company's own logo (current site) | |

## Fleet names
DJI Agras T40: official name per DJI (https://www.dji.com/ca/mobile/t40, page title "AGRAS T40").
DJI Agras T70P: official model name per DJI (https://ag.dji.com/t70p). No DJI specifications are published on the site.
Lift kits are available for the agricultural drones only: EAVision J150/J100 and DJI Agras T40/T70P, not the DJI Matrice 4E or Mini 5 Pro.
Registration statements cover only the EAVision J150/J100, DJI Matrice 4E and DJI Mini 5 Pro. No registration or compliance claim is made for the T40 or T70P.
EAVision J150 / J100 manufacturer declaration: Transport Canada list of drones with a CAR 922.08 safety assurance declaration.
