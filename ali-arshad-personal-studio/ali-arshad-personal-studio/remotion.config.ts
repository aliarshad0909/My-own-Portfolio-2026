/**
 * Remotion render configuration. Dev/build-time only — Remotion is a
 * devDependency and never ships to the client. Rendered output goes to
 * public/videos and is embedded via components/ui/MotionMedia.
 */
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Transparent background is not needed; the brand obsidian is the background.
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
