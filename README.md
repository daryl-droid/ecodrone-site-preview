# EcoDrone Solutions Inc. — preview site (draft, noindex)

Serve locally:  python3 -m http.server 8080  →  http://localhost:8080/
Every page carries <meta name="robots" content="noindex,nofollow">; robots.txt disallows all.

## Design
Slate/charcoal + fresh green (css/site.css). Text over video sits on a dark overlay sized per clip so it meets WCAG AA.

## Background clips
Decorative section backgrounds: muted, autoplay, loop, playsinline, no controls, no audio. Seamless ~7–8 s loops (1 s crossfade at the seam).
H.264 MP4 (Main, level 3.1, yuv420p, 1280×720, +faststart) with a JPG poster. If autoplay is refused the poster shows silently; under prefers-reduced-motion the poster is shown and playback is paused.

| File | Page | Slot | Length | MP4 | Poster |
|---|---|---|---|---|---|
| vid/hero-seeding.mp4 | Home | hero background | 8.0 s | 1.89 MB | 117 KB |
| vid/about-ridge.mp4 | About | page banner | 8.0 s | 1.49 MB | 100 KB |
| vid/services-spreading.mp4 | Services | page banner | 7.0 s | 1.29 MB | 99 KB |
| vid/services-aerial.mp4 | Services | "From the air" band | 7.5 s | 1.29 MB | 93 KB |
| vid/why-slope-pass.mp4 | Why EcoDrone | page banner | 8.0 s | 1.47 MB | 130 KB |
| vid/sustain-valley.mp4 | Sustainability | page banner | 8.0 s | 1.43 MB | 38 KB |
| vid/projects-terrace.mp4 | Projects | page banner | 8.0 s | 1.44 MB | 129 KB |
| vid/eis-hillside.mp4 | Environmental Impact Statement | page banner | 8.0 s | 1.42 MB | 89 KB |
| vid/contact-forest.mp4 | Contact | page banner | 8.0 s | 1.42 MB | 129 KB |

## Fleet names
DJI Agras T40 and DJI Agras T70P are listed by their DJI model names. No manufacturer specifications are published on the site.
Lift kits are available for the agricultural drones only: EAVision J150/J100 and DJI Agras T40/T70P.
