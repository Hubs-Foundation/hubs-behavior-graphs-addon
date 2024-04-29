import { defineQuery, enterQuery, exitQuery } from "bitecs";
import {
  HubsWorld,
  EntityID,
  Networked,
  MediaVideoData,
  MediaLoaded,
  MediaVideo,
  NetworkedVideo,
  MediaVideoUpdateSrcEvent,
  App,
  MediaRoot,
  findAncestorWithComponent,
} from "hubs";
import { mediaEvents } from "../nodes/media-nodes";

type VideoListeners = {
  onPlay: EventListener;
  onPause: EventListener;
  onEnd: EventListener;
};

function addVideoListeners(world: HubsWorld, eid: EntityID) {
  const mediaRoot = findAncestorWithComponent(world, MediaRoot, eid)!;
  const mediaState = mediaEvents.get(mediaRoot)!;
  if (mediaState) {
    const video = MediaVideoData.get(eid) as HTMLVideoElement;
    const listeners = videoListeners.get(eid)!;
    video.addEventListener("play", listeners.onPlay);
    video.addEventListener("pause", listeners.onPause);
    video.addEventListener("end", listeners.onEnd);
    mediaState.emitters["onMediaEvent"].emit({
      entity: mediaRoot,
      event: "create",
    });
  }
}

function removeVideoListeners(world: HubsWorld, eid: EntityID) {
  const mediaRoot = findAncestorWithComponent(world, MediaRoot, eid)!;
  const mediaState = mediaEvents.get(mediaRoot)!;
  if (mediaState) {
    const video = MediaVideoData.get(eid) as HTMLVideoElement;
    const listeners = videoListeners.get(eid)!;
    video.removeEventListener("play", listeners.onPlay);
    video.removeEventListener("pause", listeners.onPause);
    video.removeEventListener("end", listeners.onEnd);
    mediaState.emitters["onMediaEvent"].emit({
      entity: mediaRoot,
      event: "destroy",
    });
  }
}

const videoListeners = new Map<EntityID, VideoListeners>();
const mediaQuery = defineQuery([
  MediaVideo,
  Networked,
  NetworkedVideo,
  MediaLoaded,
]);
const mediaEnterQuery = enterQuery(mediaQuery);
const mediaExitQuery = exitQuery(mediaQuery);
const mediaVideoSrcUpdatedQuery = defineQuery([
  MediaVideo,
  MediaVideoUpdateSrcEvent,
]);
const mediaVideoSrcUpdatedEnterQuery = enterQuery(mediaVideoSrcUpdatedQuery);
const mediaVideoSrcUpdatedExitQuery = exitQuery(mediaVideoSrcUpdatedQuery);
export function mediaSystem(app: App) {
  const world = app.world;
  mediaVideoSrcUpdatedEnterQuery(world).forEach((eid) =>
    removeVideoListeners(world, eid)
  );
  mediaVideoSrcUpdatedExitQuery(world).forEach((eid) =>
    addVideoListeners(world, eid)
  );

  mediaEnterQuery(world).forEach((eid) => {
    const mediaRoot = findAncestorWithComponent(world, MediaRoot, eid)!;
    const mediaState = mediaEvents.get(mediaRoot)!;
    if (mediaState) {
      const listeners = {
        onPlay: (ev: Event) =>
          mediaState.emitters["onMediaEvent"].emit({
            entity: mediaRoot,
            event: "play",
          }),
        onPause: (ev: Event) =>
          mediaState.emitters["onMediaEvent"].emit({
            entity: mediaRoot,
            event: "pause",
          }),
        onEnd: (ev: Event) =>
          mediaState.emitters["onMediaEvent"].emit({
            entity: mediaRoot,
            event: "end",
          }),
      };
      videoListeners.set(eid, listeners);
      addVideoListeners(world, eid);
    }
  });

  mediaExitQuery(world).forEach((eid) => {
    removeVideoListeners(world, eid);
    videoListeners.delete(eid);
  });
}
