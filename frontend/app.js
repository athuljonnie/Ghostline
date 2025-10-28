// WebSocket and Audio Management
let ws = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// DOM Elements
const connectBtn = document.getElementById('connect-btn');
const recordBtn = document.getElementById('record-btn');
const recordText = document.getElementById('record-text');
const audioUpload = document.getElementById('audio-upload');
const conversation = document.getElementById('conversation');
const logs = document.getElementById('logs');
const clearLogsBtn = document.getElementById('clear-logs');
const agentSelect = document.getElementById('agent-select');
const recordingControls = document.getElementById('recording-controls');
const audioPlayerContainer = document.getElementById('audio-player-container');
const responseAudio = document.getElementById('response-audio');

// Status indicators
const serverStatus = document.getElementById('server-status');
const wsStatus = document.getElementById('ws-status');
const audioStatus = document.getElementById('audio-status');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkServerStatus();
    setupEventListeners();
    addLog('System initialized', 'info');
});

function setupEventListeners() {
    connectBtn.addEventListener('click', toggleConnection);
    recordBtn.addEventListener('mousedown', startRecording);
    recordBtn.addEventListener('mouseup', stopRecording);
    recordBtn.addEventListener('mouseleave', stopRecording);
    recordBtn.addEventListener('touchstart', startRecording);
    recordBtn.addEventListener('touchend', stopRecording);
    audioUpload.addEventListener('change', handleFileUpload);
    clearLogsBtn.addEventListener('click', clearLogs);
}

// Check if server is running
async function checkServerStatus() {
    try {
        const response = await fetch('http://localhost:8000/health');
        if (response.ok) {
            const data = await response.json();
            updateStatus(serverStatus, 'online', 'Connected');
            addLog('Server is healthy', 'success');
            addLog(`Components: ${JSON.stringify(data.components)}`, 'info');
        } else {
            updateStatus(serverStatus, 'offline', 'Error');
            addLog('Server returned error', 'error');
        }
    } catch (error) {
        updateStatus(serverStatus, 'offline', 'Offline');
        addLog('Cannot reach server at localhost:8000', 'error');
    }
}

// WebSocket Connection
function toggleConnection() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        disconnect();
    } else {
        connect();
    }
}

function connect() {
    const agent = agentSelect.value;
    const wsUrl = `ws://localhost:8000/ws/${agent}`;
    
    addLog(`Connecting to ${wsUrl}...`, 'info');
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        updateStatus(wsStatus, 'online', 'Connected');
        connectBtn.innerHTML = '<span class="btn-icon">🔌</span> Disconnect';
        connectBtn.style.background = '#E74C3C';
        recordingControls.style.display = 'block';
        addLog('WebSocket connected successfully', 'success');
        addMessage('system', 'Connected to AI Voice Assistant');
    };
    
    ws.onmessage = (event) => {
        handleServerMessage(event.data);
    };
    
    ws.onerror = (error) => {
        addLog('WebSocket error occurred', 'error');
        console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
        updateStatus(wsStatus, 'offline', 'Disconnected');
        connectBtn.innerHTML = '<span class="btn-icon">🔌</span> Connect to Server';
        connectBtn.style.background = '';
        recordingControls.style.display = 'none';
        addLog('WebSocket disconnected', 'warning');
    };
}

function disconnect() {
    if (ws) {
        ws.close();
        ws = null;
    }
}

// Handle messages from server
function handleServerMessage(data) {
    try {
        // Try to parse as JSON first
        const message = JSON.parse(data);
        
        if (message.type === 'transcription') {
            addLog(`Transcribed: ${message.text}`, 'info');
            addMessage('user', message.text);
        } else if (message.type === 'response') {
            addLog(`AI Response: ${message.text}`, 'success');
            addMessage('assistant', message.text);
        } else if (message.type === 'audio') {
            addLog('Received audio response', 'success');
            playAudioResponse(message.audio);
        } else if (message.type === 'error') {
            addLog(`Error: ${message.message}`, 'error');
            addMessage('system', `Error: ${message.message}`);
        } else if (message.type === 'status') {
            addLog(`Status: ${message.message}`, 'info');
        }
    } catch (e) {
        // If not JSON, might be binary audio data
        if (data instanceof Blob) {
            addLog('Received audio blob', 'success');
            playAudioBlob(data);
        } else {
            addLog('Received unknown message format', 'warning');
        }
    }
}

// Audio Recording
async function startRecording() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        addLog('Please connect to server first', 'warning');
        return;
    }
    
    if (isRecording) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            await sendAudio(audioBlob);
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
            updateStatus(audioStatus, 'offline', 'Not Recording');
        };
        
        mediaRecorder.start();
        isRecording = true;
        
        recordBtn.classList.add('recording');
        recordText.textContent = 'Recording... Release to Send';
        updateStatus(audioStatus, 'recording', 'Recording');
        addLog('Started recording', 'info');
        
    } catch (error) {
        addLog('Failed to access microphone: ' + error.message, 'error');
        alert('Please allow microphone access to use voice input');
    }
}

function stopRecording() {
    if (!isRecording || !mediaRecorder) return;
    
    mediaRecorder.stop();
    isRecording = false;
    
    recordBtn.classList.remove('recording');
    recordText.textContent = 'Hold to Talk';
    addLog('Stopped recording, sending audio...', 'info');
}

// Send audio to server
async function sendAudio(audioBlob) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        addLog('WebSocket not connected', 'error');
        return;
    }
    
    try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        ws.send(arrayBuffer);
        addLog(`Sent ${audioBlob.size} bytes of audio`, 'success');
        addMessage('system', 'Processing your audio...');
    } catch (error) {
        addLog('Failed to send audio: ' + error.message, 'error');
    }
}

// Handle file upload
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        addLog('Please connect to server first', 'warning');
        alert('Please connect to the server first');
        return;
    }
    
    addLog(`Uploading file: ${file.name} (${file.size} bytes)`, 'info');
    
    try {
        await sendAudio(file);
        addMessage('system', `Uploaded: ${file.name}`);
    } catch (error) {
        addLog('Failed to upload file: ' + error.message, 'error');
    }
    
    // Reset input
    event.target.value = '';
}

// Play audio response
function playAudioResponse(base64Audio) {
    try {
        const audioData = atob(base64Audio);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < audioData.length; i++) {
            view[i] = audioData.charCodeAt(i);
        }
        
        const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        playAudioBlob(blob);
    } catch (error) {
        addLog('Failed to play audio: ' + error.message, 'error');
    }
}

function playAudioBlob(blob) {
    const url = URL.createObjectURL(blob);
    responseAudio.src = url;
    audioPlayerContainer.style.display = 'block';
    responseAudio.play();
    addLog('Playing audio response', 'success');
}

// UI Helper Functions
function addMessage(sender, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    if (sender !== 'system') {
        const label = document.createElement('div');
        label.className = 'message-label';
        label.textContent = sender === 'user' ? '👤 You' : '🤖 AI Assistant';
        messageDiv.appendChild(label);
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    messageDiv.appendChild(contentDiv);
    
    conversation.appendChild(messageDiv);
    conversation.scrollTop = conversation.scrollHeight;
}

function addLog(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    logEntry.innerHTML = `
        <span class="log-time">[${timestamp}]</span>
        <span class="log-level ${level}">[${level.toUpperCase()}]</span>
        <span class="log-message">${message}</span>
    `;
    
    logs.appendChild(logEntry);
    logs.scrollTop = logs.scrollHeight;
}

function clearLogs() {
    logs.innerHTML = '';
    addLog('Logs cleared', 'info');
}

function updateStatus(element, statusClass, text) {
    element.className = `status-value ${statusClass}`;
    element.textContent = text;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Space bar to record (when connected)
    if (e.code === 'Space' && ws && ws.readyState === WebSocket.OPEN) {
        e.preventDefault();
        if (!isRecording) {
            startRecording();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && isRecording) {
        e.preventDefault();
        stopRecording();
    }
});
