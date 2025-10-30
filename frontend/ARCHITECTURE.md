# Frontend Architecture

## 🏗️ Folder Structure

```
src/
├── components/              # React components
│   ├── ui/                 # Reusable UI components
│   │   ├── ConnectionStatus.tsx
│   │   ├── StateIndicator.tsx
│   │   ├── TranscriptionPanel.tsx
│   │   ├── VoiceButton.tsx
│   │   ├── LogsPanel.tsx
│   │   └── index.ts        # Barrel exports
│   └── voice/              # Voice-specific components
│       ├── SpectralPresence.tsx
│       └── VoiceInterface.tsx
├── hooks/                  # Custom React hooks
│   ├── useWebSocket.ts    # WebSocket management
│   ├── useAudioRecorder.ts # Audio recording
│   ├── useLogs.ts         # Log management
│   └── index.ts           # Barrel exports
├── services/              # External services
│   └── websocket.service.ts # WebSocket client
├── types/                 # TypeScript definitions
│   └── voice.types.ts     # Voice interface types
├── utils/                 # Utility functions
│   └── audio.utils.ts     # Audio helper functions
├── constants/             # Application constants
│   └── theme.ts          # Design tokens & config
├── App.tsx               # Root component
└── main.tsx              # Entry point
```

## 📋 Architecture Principles

### 1. **Separation of Concerns**
- **Components**: Presentational logic only
- **Hooks**: State management and side effects
- **Services**: External API communication
- **Utils**: Pure helper functions
- **Types**: TypeScript definitions

### 2. **Component Structure**

#### UI Components (`components/ui/`)
Small, reusable, presentational components:
- `ConnectionStatus`: WebSocket connection indicator
- `StateIndicator`: System state display
- `TranscriptionPanel`: Input/output display
- `VoiceButton`: Microphone control button
- `LogsPanel`: System logs viewer

#### Voice Components (`components/voice/`)
Feature-specific components:
- `SpectralPresence`: Audio visualization
- `VoiceInterface`: Main orchestration component

### 3. **Custom Hooks**

#### `useWebSocket`
Manages WebSocket connection and messaging:
```typescript
const { isConnected, sendAudio, readyState } = useWebSocket(onMessage, addLog);
```

#### `useAudioRecorder`
Handles microphone access and recording:
```typescript
const { isRecording, startRecording, stopRecording } = useAudioRecorder(
  onRecordingComplete,
  addLog
);
```

#### `useLogs`
Manages system logs:
```typescript
const { logs, addLog, clearLogs } = useLogs();
```

### 4. **Services Layer**

#### `WebSocketService`
- Encapsulates WebSocket logic
- Handles reconnection
- Message parsing
- Error handling

### 5. **Type Safety**

All types defined in `types/voice.types.ts`:
- `SystemState`: Application states
- `LogEntry`: Log entry structure
- `ServerMessage`: Server message format
- `VoiceState`: Voice interface state

### 6. **Utility Functions**

Pure helper functions in `utils/`:
- `decodeBase64Audio`: Decode base64 audio
- `playAudioBlob`: Play audio blob
- `requestMicrophoneAccess`: Get microphone stream
- `stopMediaStream`: Stop media tracks

## 🎨 Design Tokens

Centralized in `constants/theme.ts`:
- Colors
- Typography
- Motion/Animation
- Spacing
- API Configuration

## 🔄 Data Flow

```
User Action
    ↓
VoiceInterface (orchestration)
    ↓
Custom Hooks (state & side effects)
    ↓
Services (external communication)
    ↓
UI Components (presentation)
```

## 📦 Benefits

### ✅ Maintainability
- Single responsibility per module
- Easy to locate and update code
- Clear dependencies

### ✅ Reusability
- UI components can be used anywhere
- Hooks can be shared across features
- Services are framework-agnostic

### ✅ Testability
- Pure functions are easy to test
- Components receive props only
- Hooks can be tested in isolation

### ✅ Scalability
- Easy to add new features
- Clear patterns to follow
- Minimal refactoring needed

## 🚀 Development Workflow

### Adding a New Feature

1. **Define Types** (`types/`)
2. **Create Service** (`services/`)
3. **Build Hook** (`hooks/`)
4. **Create UI Components** (`components/ui/`)
5. **Integrate in Feature Component** (`components/voice/`)

### Adding a UI Component

1. Create component in `components/ui/`
2. Export from `components/ui/index.ts`
3. Import where needed

### Adding a Hook

1. Create hook in `hooks/`
2. Export from `hooks/index.ts`
3. Use in components

## 📝 Code Style

- **TypeScript**: Strict mode enabled
- **Naming**: PascalCase for components, camelCase for functions
- **Exports**: Named exports preferred
- **Comments**: JSDoc for public APIs
- **File Structure**: One component per file

## 🔧 Hot Reload

All changes are hot-reloaded thanks to:
- Vite's HMR with polling enabled
- Volume mounts in Docker
- `CHOKIDAR_USEPOLLING=true`

## 📚 References

- [React Best Practices](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
