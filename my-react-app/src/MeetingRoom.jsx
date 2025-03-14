import { useLocation } from "react-router-dom";

function MeetingRoom() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const roomId = searchParams.get("room_id"); // Extract room ID from URL

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-96 text-center">
                <h1 className="text-2xl font-semibold mb-4">Meeting Room</h1>
                <p className="text-gray-600">Room ID: <strong>{roomId}</strong></p>
            </div>
        </div>
    );
}

export default MeetingRoom; // ✅ Remove the extra parentheses
