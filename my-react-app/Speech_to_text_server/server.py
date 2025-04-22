from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Dictionary to store messages
# Format: {timestamp: {userId: str, message: str}, ...}
messages = {}

@app.route('/api/speech', methods=['POST'])
def receive_speech():
    try:
        data = request.json
        user_id = data.get('userId')
        message = data.get('message')
        print(user_id, message)  # Debugging line
        timestamp = datetime.now().isoformat()

        if not user_id or not message:
            return jsonify({'error': 'Missing userId or message'}), 400

        # Store message with timestamp as key
        messages[timestamp] = {
            'userId': user_id,
            'message': message
        }

        return jsonify({
            'status': 'success',
            'message': 'Speech text received and stored',
            'timestamp': timestamp
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages/<user_id>', methods=['GET'])
def get_user_messages(user_id):
    try:
        # Filter messages by user ID
        user_messages = {
            timestamp: data 
            for timestamp, data in messages.items() 
            if data['userId'] == user_id
        }
        
        # Convert to list of objects with timestamp
        formatted_messages = [
            {
                'timestamp': timestamp,
                'message': data['message']
            }
            for timestamp, data in user_messages.items()
        ]
        
        # Sort by timestamp
        formatted_messages.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({'messages': formatted_messages}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages', methods=['GET'])
def get_all_messages():
    try:
        # Convert to list of objects with timestamp
        formatted_messages = [
            {
                'timestamp': timestamp,
                'userId': data['userId'],
                'message': data['message']
            }
            for timestamp, data in messages.items()
        ]
        
        # Sort by timestamp
        formatted_messages.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({'messages': formatted_messages}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 