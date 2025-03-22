import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const socket = io("http://localhost:4000");

function App_() {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const [users, setUsers] = useState([]); // State to store users

  useEffect(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    const createOffer = async (userSocketId) => {
      try {
        const sdp = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(sdp);
        socket.emit("offer", { sdp, target: userSocketId });
      } catch (error) {
        console.error("Error creating offer:", error);
      }
    };
    
    // Receive and store room users
    socket.on("room_users", async (users) => {
      setUsers(users);
      console.log("Users in room:", users);
      for (let user of users) {
        if (user.id !== socket.id) {
          await createOffer(user.id); // Ensure each offer is created sequentially
        }
      }
    });




    const createAnswer = async (sdp, sender) => {
      try {
        await pc.setRemoteDescription(sdp);
        const answerSdp = await pc.createAnswer({
          offerToReceiveVideo: true,
          offerToReceiveAudio: true,
        });
        await pc.setLocalDescription(answerSdp);
        
        // Send the answer back to the sender
        // alert(sender)
        socket.emit("answer", { sdp: answerSdp, target: sender });
        console.log(`Answer sent to ${sender}`);
      } catch (error) {
        console.error("Error creating answer:", error);
      }
    };

    socket.on("getOffer", async ({ sdp, sender }) => {
      // alert("Received offer from:", sender);
      await createAnswer(sdp, sender);
    });


    socket.on("getAnswer", async ({ sdp, sender })  => {
      if (pc.signalingState !== "closed") {
        try {
          await pc.setRemoteDescription(sdp);
          // alert("got answer from ")
          // alert(sender)
          console.log("Successfully set remote description.");
        } catch (error) {
          console.error("Error setting remote description:", error);
        }
      }
    });
    
    pc.onicecandidate = e => {
      if (e.candidate) {
          // alert("onicecandidate");
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
      <h2>Users in Room</h2>
      <ul>
        {users.map((user, index) => (
          <li key={index}>{user.name} ({user.socketId})</li>
        ))}
      </ul>
    </div>
  );
}

export default App_;
