import { Realtime } from "@superviz/socket-client";

export function createRoom(roomName: string) {
  const realtime = new Realtime(
    this.opts.apiKey,
    this.opts.environment,
    this.opts.participant,
    "",
    ""
  );
  
  const room = this.realtime.connect(roomName);

  return {
    realtime,
    room,
  }
}