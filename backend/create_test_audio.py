#!/usr/bin/env python3
"""Create a simple test audio file for testing the STT system."""

import wave
import numpy as np

def create_test_audio(filename="test_input.wav", duration=2.0, sample_rate=16000):
    """
    Create a simple test audio file with a sine wave tone.
    This can be used to test the audio processing pipeline.
    """
    # Generate a 440Hz tone (A note)
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    # Generate sine wave
    audio_data = np.sin(2 * np.pi * 440 * t)
    
    # Scale to 16-bit range
    audio_data = (audio_data * 32767).astype(np.int16)
    
    # Save as WAV file
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 2 bytes per sample (16-bit)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_data.tobytes())
    
    print(f"Created test audio file: {filename}")
    print(f"Duration: {duration}s, Sample rate: {sample_rate}Hz")

if __name__ == "__main__":
    create_test_audio()