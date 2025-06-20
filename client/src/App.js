import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // This effect is no longer needed for TTS
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponse('');
    try {
      const res = await fetch('/api/tsunderize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      });
      const data = await res.json();
      if (res.ok) {
        setResponse(data.tsundere);
      } else {
        setError(data.error || data.message || 'An error occurred');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
    setLoading(false);
  };

  const handleSpeak = async () => {
    if (!response) return;
    setAudioLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: response })
      });

      if (!res.ok) {
        throw new Error('Failed to generate audio');
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.play();

    } catch (err) {
      setError('Could not play audio. Please try again.');
    }
    setAudioLoading(false);
  };

  return (
    <div className="App">
      <div className="window">
        <div className="title-bar">
          <div className="traffic-lights">
            <div className="light red"></div>
            <div className="light yellow"></div>
            <div className="light green"></div>
          </div>
        </div>
        <div className="content">
          <h1>Tsunderizer 💢</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="What do you want to say... baka?"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input}>
              {loading ? 'Tsunderizing...' : 'Tsunderize!'}
            </button>
          </form>
          {error && <p className="error">{error}</p>}
          {response && (
            <div className="response-area">
              <div className="response-box">
                {response}
              </div>
              <button onClick={handleSpeak} disabled={audioLoading}>
                {audioLoading ? '...' : '🔊'} Read Aloud
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
