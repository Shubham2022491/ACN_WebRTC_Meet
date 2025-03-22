import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};


// const socket = io("http://localhost:4000");

function App_() {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const [users, setUsers] = useState([]); // State to store users
  const peerConnections = {};
  // const socketListeners = useRef(false); // Track if listeners are registered

  useEffect(() => {
    // if (socketListeners.current) {
    //   alert("Listeners already registered. Skipping.");
    //   return;
    // }
    // socketListeners.current = true;
    const socket = io("http://localhost:4000");
   
    const createPeerConnection = (userSocketId) => {
      if (peerConnections[userSocketId]) {
        alert(`PeerConnection already exists for ${userSocketId}`);
        return peerConnections[userSocketId];
      }
      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("candidate", { candidate: e.candidate, target: userSocketId });
        }
      };

      pc.ontrack = (ev) => {
        if (remoteVideo.current) remoteVideo.current.srcObject = ev.streams[0];
      };

      peerConnections[userSocketId] = pc;
      return pc;
    };

    const createOffer = async (userSocketId) => {
      try {
        const pc = createPeerConnection(userSocketId);
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
        const pc = createPeerConnection(sender);
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




    socket.on("getAnswer", async ({ sdp, sender }) => {
      const pc = peerConnections[sender];
      if (pc && pc.signalingState !== "closed") {
        try {
          await pc.setRemoteDescription(sdp);
          console.log("Successfully set remote description.");
        } catch (error) {
          console.error("Error setting remote description:", error);
        }
      }
      alert(JSON.stringify(peerConnections, null, 2));
    });
    
    
    socket.on("getCandidate", async ({ candidate, sender }) => {
      const pc = peerConnections[sender];
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        console.error("Peer connection not found for candidate");
      }
    });
    
    navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      // Display the local stream in the local video element
      if (localVideo.current) localVideo.current.srcObject = stream;

      // Add tracks to all existing peer connections
      Object.values(peerConnections).forEach((pc) => {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      });
    })
    .catch((error) => {
      console.error("getUserMedia error:", error);
    });
    // alert("hi")
    socket.emit("join", { room: "1234", name: "John Doe" });
    // alert("joined")


    return () => {
      Object.values(peerConnections).forEach((pc) => {
        if (pc) {
          pc.ontrack = null;
          pc.onicecandidate = null;
          pc.oniceconnectionstatechange = null;
          pc.close();
        }
      });
      socket.disconnect();
      // Optionally clear the peerConnections object
      Object.keys(peerConnections).forEach((key) => delete peerConnections[key]);
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
