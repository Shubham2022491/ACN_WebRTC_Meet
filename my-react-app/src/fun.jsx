import { useEffect,useRef } from "react";
import { io } from "socket.io-client";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const socket = io("http://localhost:4000");

function App_() {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  useEffect(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);


    const createOffer = async () => {
      try {
        const sdp = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(sdp);
        socket.emit("offer", sdp);
      } catch (error) {
        console.error("Error creating offer:", error);
      }
    };

    socket.on("room_users", async users => {
      // alert(JSON.stringify(users, null, 2));   
      createOffer()   
    });


    const createAnswer = async (sdp) => {
      try {
        await pc.setRemoteDescription(sdp);
        const answerSdp = await pc.createAnswer({
                        offerToReceiveVideo: true,
                        offerToReceiveAudio: true,
                    });
        await pc.setLocalDescription(answerSdp);
        socket.emit("answer", answerSdp);
      } catch (error) {
        console.error("Error creating answer:", error);
      }
    };

    socket.on("getOffer", async sdp => {
      // alert("got an offer:" + sdp);
      createAnswer(sdp);
    });

    socket.on("getAnswer", async (sdp) => {
      if (pc.signalingState !== "closed") {
        try {
          await pc.setRemoteDescription(sdp);
          console.log("Successfully set remote description.");
        } catch (error) {
          console.error("Error setting remote description:", error);
        }
      }
    });
    
    pc.onicecandidate = e => {
      if (e.candidate) {
          alert("onicecandidate");
          socket.emit("candidate", e.candidate);
      }
    };
    pc.oniceconnectionstatechange = e => {
      alert(e);
    };
    

    socket.on("getCandidate", async (candidate) => {
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      if (localVideo.current) localVideo.current.srcObject = stream;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (ev) => {
        if (remoteVideo.current) remoteVideo.current.srcObject = ev.streams[0];
      };

      socket.emit("join", { room: "1234", name: "John Doe" });
    })
    .catch((error) => {
      console.error("getUserMedia error:", error);
    });


    return () => {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.oniceconnectionstatechange = null;
      pc.close();
    };
  }, []);

  return (
    <div>
      <h1>WebRTC Meet</h1>
      <video ref={localVideo} autoPlay playsInline></video>
      <video ref={remoteVideo} autoPlay playsInline></video>
    </div>
  );
}

export default App_;
