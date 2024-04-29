import { hasComponent } from "bitecs";
import {
  EntityID,
  MediaVideoData,
  MediaVideo,
  NetworkedVideo,
  MediaVideoUpdateSrcEvent,
  updateVideoSrc,
  ProjectionModeName,
  VIDEO_FLAGS,
  getProjectionFromProjectionName,
  getProjectionNameFromProjection,
  App,
} from "hubs";

export interface GLTFVideoParams {
  src: string;
  projection: ProjectionModeName;
  autoPlay: boolean;
  controls: boolean;
  loop: boolean;
}

export function getVideo(app: App, eid: EntityID): GLTFVideoParams {
  const video = MediaVideoData.get(eid)!;
  return {
    src: video.src,
    loop: video.loop,
    autoPlay: video.autoplay,
    projection: getProjectionNameFromProjection(MediaVideo.projection[eid]),
    controls: MediaVideo.flags[eid] & VIDEO_FLAGS.CONTROLS ? true : false,
  };
}

export function setVideo(app: App, eid: EntityID, params: GLTFVideoParams) {
  const world = app.world;
  if (params.controls !== undefined) {
    if (params.controls) {
      NetworkedVideo.flags[eid] |= VIDEO_FLAGS.CONTROLS;
    } else {
      NetworkedVideo.flags[eid] &= ~VIDEO_FLAGS.CONTROLS;
    }
  }
  if (params.projection !== undefined) {
    NetworkedVideo.projection[eid] = getProjectionFromProjectionName(
      params.projection
    );
  }

  const video = MediaVideoData.get(eid)!;
  let shouldUpdateVideo = false;
  if (params.autoPlay !== undefined) {
    shouldUpdateVideo ||= video.autoplay !== params.autoPlay;
    video.autoplay = params.autoPlay;
  }
  if (params.loop !== undefined) {
    shouldUpdateVideo ||= video.loop !== params.loop;
    video.loop = params.loop;
  }
  let src = video.src;
  if (params.src !== undefined) {
    shouldUpdateVideo ||= video.src !== params.src;
    src = params.src;
  }
  if (
    shouldUpdateVideo &&
    !hasComponent(world, MediaVideoUpdateSrcEvent, eid)
  ) {
    updateVideoSrc(world, eid, src, video);
  }
}
