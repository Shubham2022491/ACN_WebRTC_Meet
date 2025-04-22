const SPEECH_SERVER_URL = 'http://localhost:5000/api';

// Function to send speech text to server
export const sendSpeechText = async (userId, message) => {
    try {
        const response = await fetch(`${SPEECH_SERVER_URL}/speech`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                message
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send speech text');
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending speech text:', error);
        throw error;
    }
};

// Function to get messages for a specific user
export const getUserMessages = async (userId) => {
    try {
        const response = await fetch(`${SPEECH_SERVER_URL}/messages/${userId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch user messages');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching user messages:', error);
        throw error;
    }
};

// Function to get all messages
export const getAllMessages = async () => {
    try {
        const response = await fetch(`${SPEECH_SERVER_URL}/messages`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch all messages');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching all messages:', error);
        throw error;
    }
};

// Function to format timestamp
export const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
};

// Function to generate a random user ID
export const generateUserId = () => {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}; 