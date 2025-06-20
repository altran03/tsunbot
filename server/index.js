import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/tsunderize', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }
  try {
    const prompt = `Rewrite the following message as if you are a tsundere anime girl. Be playful, a bit embarrassed, and use typical tsundere speech patterns.\n\nOriginal: ${text}\n\nTsundere:`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a tsundere anime girl.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 100
    });
    const tsundereText = completion.choices[0].message.content.trim();
    res.json({ tsundere: tsundereText });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error generating tsundere response' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 