/**
 * Audio utility functions
 */

export const decodeBase64Audio = (base64Audio: string): Blob => {
  const audioData = atob(base64Audio);
  const arrayBuffer = new ArrayBuffer(audioData.length);
  const view = new Uint8Array(arrayBuffer);

  for (let i = 0; i < audioData.length; i++) {
    view[i] = audioData.charCodeAt(i);
  }

  return new Blob([arrayBuffer], { type: 'audio/mpeg' });
};

export const playAudioBlob = (blob: Blob): Promise<void> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };

    audio.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };

    audio.play().catch(reject);
  });
};

export const requestMicrophoneAccess = async (): Promise<MediaStream> => {
  return await navigator.mediaDevices.getUserMedia({ audio: true });
};

export const stopMediaStream = (stream: MediaStream): void => {
  stream.getTracks().forEach((track) => track.stop());
};
