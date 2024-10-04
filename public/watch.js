const urlParams = new URLSearchParams(window.location.search);
const user = urlParams.get('user');

let peerConnection;
const config = {
  iceServers: [
    {
      "urls": "stun:stun.l.google.com:19302",
    },
    // { 
    //   "urls": "turn:TURN_IP?transport=tcp",
    //   "username": "TURN_USERNAME",
    //   "credential": "TURN_CREDENTIALS"
    // }
  ],
  iceTransportPolicy: 'all',
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};

const socket = io.connect(window.location.origin);
const video = document.querySelector("video");

const enableAudioButton = document.querySelector("#toggle-audio");
enableAudioButton.addEventListener("click", toggleMute)


socket.on("offer", (id, description) => {
  peerConnection = new RTCPeerConnection(config);
  peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("answer", id, peerConnection.localDescription);
    });
  peerConnection.ontrack = event => {
    video.srcObject = event.streams[0];
  };
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };
});


socket.on("candidate", (id, candidate) => {
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
});

socket.on("connect", () => {
  socket.emit("watcher", user);
});

socket.on("broadcaster", () => {
  socket.emit("watcher");
});


window.addEventListener("unload", (event) => {
    socket.close();
  peerConnection.close();
});


function enableAudio() {
  console.log("Enabling audio")
  video.muted = false;
}

function toggleMute() {
  var video = document.getElementById("video");
  video.muted = !video.muted;
  enableAudioButton.innerHTML = (video.muted) ? 'Unmute' : 'Mute';
  toggleClass();
}

function toggleClass() {
  if (enableAudioButton.className == "audio-on")
    enableAudioButton.className = "audio-off";
  else
    enableAudioButton.className = "audio-on";
}