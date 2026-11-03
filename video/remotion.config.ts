import { Config } from '@remotion/cli/config';

// Rendering happens on GitHub Actions (.github/workflows/video.yml), not on a laptop.
Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
Config.setConcurrency(null);
Config.setChromiumOpenGlRenderer('swangle');
