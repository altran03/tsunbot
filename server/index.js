import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import rateLimit from 'express-rate-limit';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false, 
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

app.use(cors());
app.use(express.json());

// Trust the first proxy hop (e.g., the React dev server)
app.set('trust proxy', 1);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

app.post('/api/tsunderize', limiter, async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }
  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 150,
      system: "You are a tsundere anime girl. Rewrite the user's message into a playful, slightly embarrassed, and classic tsundere response. Use tsundere speech patterns, like ending sentences with '...baka!' or 'it's not like I did it for you or anything'. Keep the response under 30 words.",
      messages: [{ role: "user", content: text }]
    });

    const tsundereText = msg.content[0].text;
    res.json({ tsundere: tsundereText });
  } catch (error) {
    console.error('Anthropic API error:', error);
    res.status(500).json({ error: 'Error generating tsundere response' });
  }
});

app.post('/api/tts', limiter, async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }
  try {
    // Clean the text for better TTS performance
    const cleanedText = text
      .replace(/\*.*?\*/g, '')      // Remove actions like *blushes*
      .replace(/[a-zA-Z]-/g, '')      // Remove stutters like "W-what"
      .replace(/[?!]+…/g, '.')       // Replace ?! and ... with a period
      .replace(/[.]{2,}/g, '.')        // Replace multiple periods with a single one
      .replace(/[^a-zA-Z0-9\s.,'!?]/g, '') // Remove any remaining non-standard characters
      .trim();

    console.log("Sending to ElevenLabs:", cleanedText);

    const audioStream = await elevenlabs.textToSpeech.stream(
      'T7eLpgAAhoXHlrNajG8v', // Gracie's Voice ID
      {
        text: cleanedText,
        model_id: 'eleven_multilingual_v2'
      }
    );
    
    res.setHeader('Content-Type', 'audio/mpeg');

    for await (const chunk of audioStream) {
      res.write(chunk);
    }
    res.end();

  } catch (error) {
    console.error('ElevenLabs API error:', error);
    res.status(500).json({ error: error.message || 'Error generating audio' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 