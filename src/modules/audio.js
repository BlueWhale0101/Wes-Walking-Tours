export const createAudioController = ({ setStatus }) => {
  let utterance = null;

  const stopSpeech = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    utterance = null;
  };

  const fallbackSpeech = (stop) => {
    if (!("speechSynthesis" in window)) {
      setStatus("Audio unavailable");
      return;
    }
    stopSpeech();
    utterance = new SpeechSynthesisUtterance((stop.script || []).join("\n\n"));
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    setStatus("Playing browser voice fallback");
  };

  return {
    async play({ player, stop }) {
      stopSpeech();
      if (!player) {
        fallbackSpeech(stop);
        return;
      }
      try {
        await player.play();
        setStatus("Playing");
      } catch {
        fallbackSpeech(stop);
      }
    },
    stop(player) {
      if (player) {
        player.pause();
        player.currentTime = 0;
      }
      stopSpeech();
      setStatus("Stopped");
    }
  };
};
