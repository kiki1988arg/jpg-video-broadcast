
const urlParams = new URLSearchParams(window.location.search);
const user = urlParams.get('user');
const peerConnections = {};
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

socket.on("answer", (id, description) => {
  peerConnections[id].setRemoteDescription(description);
});

socket.on("watcher", id => {
  const peerConnection = new RTCPeerConnection(config);
  peerConnections[id] = peerConnection;

  let stream = videoElement.srcObject;
  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate, user);
    }
  };

  peerConnection
    .createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", id, peerConnection.localDescription);
    });
});

socket.on("candidate", (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", id => {
  peerConnections[id].close();
  delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
};

// Get camera and microphone
const videoElement = document.querySelector("video");
const audioSelect = document.querySelector("select#audioSource");
const videoSelect = document.querySelector("select#videoSource");
const enableAudioButton = document.querySelector("#toggle-audio");
const enableVideoButton = document.querySelector("#toggle-video");
enableAudioButton.addEventListener("click", toggleAudio);
enableVideoButton.addEventListener("click", toggleVideo);

audioSelect.onchange = getStream;
videoSelect.onchange = getStream;

var media = getStream()
  .then(getDevices)
  .then(gotDevices);

function getDevices() {
  return navigator.mediaDevices.enumerateDevices();
}

function gotDevices(deviceInfos) {
  window.deviceInfos = deviceInfos;
  for (const deviceInfo of deviceInfos) {
    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "audioinput") {
      option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
      audioSelect.appendChild(option);
    } else if (deviceInfo.kind === "videoinput") {
      option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    }
  }
}

function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const audioSource = audioSelect.value;
  const videoSource = videoSelect.value;
  const constraints = {
    audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
    video: { deviceId: videoSource ? { exact: videoSource } : undefined }
  };
  return navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .catch(handleError);
}

function gotStream(stream) {
  window.stream = stream;
  audioSelect.selectedIndex = [...audioSelect.options].findIndex(
    option => option.text === stream.getAudioTracks()[0].label
  );
  videoSelect.selectedIndex = [...videoSelect.options].findIndex(
    option => option.text === stream.getVideoTracks()[0].label
  );
  videoElement.srcObject = stream;
  socket.emit("broadcaster", user);
}

function handleError(error) {
  console.error("Error: ", error);
}

function toggleAudio() {
  if (window.stream) {
    var isMuted;
    window.stream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
      isMuted = track.enabled;
    });
    enableAudioButton.innerHTML = (isMuted) ? 'Mute' : 'Unmute';
    toggleClass('audio')
  }
}

function toggleVideo() {
  if (window.stream) {
    var isMuted;
    window.stream.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
      isMuted = track.enabled;
    });
    enableVideoButton.innerHTML = (isMuted) ? 'Ocultar cámara' : 'Mostrar cámara';
    toggleClass('video')
  }
}

function toggleClass(el) {
  if (el == 'video') {
    if (enableVideoButton.className == "audio-on")
      enableVideoButton.className = "audio-off";
    else
      enableVideoButton.className = "audio-on";
  }
  else {

    if (enableAudioButton.className == "audio-on")
      enableAudioButton.className = "audio-off";
    else
      enableAudioButton.className = "audio-on";
  }

}
