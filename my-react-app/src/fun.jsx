import { useEffect } from "react";
import { io } from "socket.io-client";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const socket = io("http://localhost:4000");

function App_() {


  useEffect(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);


    const createOffer = () => {
      // alert("create offer");
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
      // alert(JSON.stringify(users, null, 2));   
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
      // alert("got an offer:" + sdp);
      createAnswer(sdp);
    });

    socket.on("getAnswer", (sdp) => {
      console.log("Received SDP answer:", sdp);
    
      // Set the remote description with the received SDP answer
      pc.setRemoteDescription(sdp)
        .then(() => {
          console.log("Successfully set remote description.");
        })
        .catch((error) => {
          console.error("Error setting remote description:", error);
        });
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
    
    socket.on("getCandidate", (candidate) => {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).then(() => {
            alert("candidate add success");
        });
    });

    try {
      navigator.mediaDevices
          .getUserMedia({
              video: true,
              audio: true,
          })
          .then(stream => {
              if (localVideo.current) localVideo.current.srcObject = stream;

              stream.getTracks().forEach(track => {
                  pc.addTrack(track, stream);
              });
              pc.onicecandidate = e => {
                  if (e.candidate) {
                      console.log("onicecandidate");
                      socket.emit("candidate", e.candidate);
                  }
              };
              pc.oniceconnectionstatechange = e => {
                  console.log(e);
              };

              pc.ontrack = ev => {
                  console.log("add remotetrack success");
                  if (remoteVideo.current)
                      remoteVideo.current.srcObject = ev.streams[0];
              };

              socket.emit("join", {
                  room: "1234",
                  name: "John Doe",
              });
          })
          .catch(error => {
              alert(`getUserMedia error: ${error}`);
          });
    }catch (e) {
      alert(e);
    }


    return () => {
      pc.close(); // Clean up when component unmounts
    };
  }, []);

  return <h1>WebRTC Meet</h1>;
}

export default App_;
