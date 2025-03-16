import { useEffect } from "react";
import { io } from "socket.io-client";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const socket = io("http://localhost:4000");

function App_() {
  useEffect(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add media tracks
    // navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
    //   stream.getTracks().forEach(track => pc.addTrack(track, stream));
    // });

    // // Gather ICE candidates
    // pc.onicecandidate = (event) => {
    //   if (event.candidate) {
    //       // Send candidate to the remote peer
    //       sendCandidateToRemote(event.candidate);
    //   }
    // };

    socket.emit("join", { room: "1234", name: "John Doe" });


    const createOffer = () => {
      alert("create offer");
      pc
          .createOffer({offerToReceiveAudio: true, offerToReceiveVideo: true})
          .then(sdp => {
              pc.setLocalDescription(sdp);
              socket.emit("offer", sdp);
          })
          .catch(error => {
              console.log(error);
          });
    };

    socket.on("room_users", async users => {
      alert(JSON.stringify(users, null, 2));   
      createOffer()   
    });

    const createAnswer = (sdp) => {
      pc.setRemoteDescription(sdp).then(() => {
          console.log("answer set remote description success");
          pc
              .createAnswer({
                  offerToReceiveVideo: true,
                  offerToReceiveAudio: true,
              })
              .then(sdp1 => {
                  console.log("create answer");
                  pc.setLocalDescription(sdp1);
                  socket.emit("answer", sdp1);
              })
              .catch(error => {
                  console.log(error);
              });
      });
    };

    socket.on("getOffer", async sdp => {
      alert("get offer:" + sdp);
      createAnswer(sdp);
    });

    socket.on("getAnswer", (sdp) => {
      alert("get answer:" + sdp);
      pc.setRemoteDescription(sdp);
    });
    
    



    return () => {
      pc.close(); // Clean up when component unmounts
    };
  }, []);

  return <h1>WebRTC Meet</h1>;
}

export default App_;
