// The servers a browser uses to find a path for the video call (WebRTC "ICE servers").
//   STUN  lets the two browsers discover their public addresses. Free public servers are the default.
//   TURN  relays the video when no direct path exists (some mobile networks and strict Wi-Fi block direct calls).
//         It costs money to run, so it is configured only when you set it in the .env file:
//           TURN_URL=turn:your-turn-server:3478        (several, comma separated, are allowed)
//           TURN_USERNAME=...
//           TURN_CREDENTIAL=...
//         Or give the whole list yourself:  ICE_SERVERS=[{"urls":"stun:..."},{"urls":"turn:...","username":"..","credential":".."}]
// The list is sent to the browser when a call is joined (never put TURN passwords in the React code).
function getIceServers(env = process.env) {
  if (env.ICE_SERVERS) {
    try {
      const list = JSON.parse(env.ICE_SERVERS);
      if (Array.isArray(list) && list.length > 0) return list;
    } catch {
      console.log("ICE_SERVERS in .env is not valid JSON; using the default servers.");
    }
  }

  const servers = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];

  if (env.TURN_URL && env.TURN_USERNAME && env.TURN_CREDENTIAL) {
    servers.push({
      urls: env.TURN_URL.split(",").map((u) => u.trim()).filter(Boolean),
      username: env.TURN_USERNAME,
      credential: env.TURN_CREDENTIAL,
    });
  }
  return servers;
}

module.exports = { getIceServers };
