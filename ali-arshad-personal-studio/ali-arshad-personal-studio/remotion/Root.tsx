import React from "react";
import { Composition } from "remotion";
import { VIDEO, durationInFrames } from "./brand";
import { CapabilitiesPipeline } from "./compositions/CapabilitiesPipeline";
import { N8nWorkflow } from "./compositions/N8nWorkflow";
import { AiAgentFlow } from "./compositions/AiAgentFlow";

/**
 * The motion library. Each composition is an 8s seamless loop at the shared
 * brand size (1600×900, 30fps). Render to /public/videos via `npm run
 * remotion:render:*`, then embed through components/ui/MotionMedia.
 */
export const RemotionRoot: React.FC = () => {
  const common = {
    fps: VIDEO.fps,
    width: VIDEO.width,
    height: VIDEO.height,
    durationInFrames: durationInFrames(VIDEO.loopSeconds),
  };
  return (
    <>
      <Composition id="CapabilitiesPipeline" component={CapabilitiesPipeline} {...common} />
      <Composition id="N8nWorkflow" component={N8nWorkflow} {...common} />
      <Composition id="AiAgentFlow" component={AiAgentFlow} {...common} />
    </>
  );
};
