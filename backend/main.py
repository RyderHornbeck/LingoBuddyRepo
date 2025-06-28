import openai
import tempfile
import base64
import json
import asyncio
import websockets
from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydub import AudioSegment
import io
import re
from openai import OpenAI

OPENAI_KEY = "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"
ELEVEN_KEY = "sk_951d9a2de7e34e9a3bd33837f5685dbf70d65150ece70e56"
VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel


client = OpenAI(api_key=OPENAI_KEY)




app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def approximate_visemes(text: str, duration: float):
    words = re.findall(r"\w+", text.upper())
    total_chars = sum(len(w) for w in words)
    if total_chars == 0:
        return []

    time_per_char = duration / total_chars
    visemes = []
    t = 0.0

    for word in words:
        for char in word:
            visemes.append({
                "char": char,
                "start": round(t, 2),
                "end": round(t + time_per_char, 2)
            })
            t += time_per_char

    return visemes

class AudioLanguageTutor:
    def __init__(self, client):
        self.client = client

    async def process_audio(self, audio_file: UploadFile, native_lang: str, learning_lang: str):
        audio_bytes = await audio_file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
            temp_audio.write(audio_bytes)
            temp_audio_path = temp_audio.name

        transcript = self.transcribe_audio(temp_audio_path)
        ai_response = self.generate_learning_response(transcript, native_lang, learning_lang)
        audio_b64, duration, visemes = await self.stream_tts(ai_response)

        return {
            "transcript": transcript,
            "ai_response": ai_response,
            "audio_base64": audio_b64,
            "visemes": visemes
        }

    def transcribe_audio(self, audio_path: str) -> str:
        with open(audio_path, "rb") as f:
            transcript = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=f
            )
        return transcript.text

    def generate_learning_response(self, input_text: str, native_lang: str, learning_lang: str) -> str:
        prompt = (
            f"You are a helpful language tutor. The user speaks {native_lang} and is learning {learning_lang}. "
            f"Given the following input from the user, reply in a combination of {learning_lang} with simple vocabulary, and some in {native_lang} to make it feel as if they are learning with an {native_lang} speaker. "
            f"User said: {input_text}"
        )

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )

        return response.choices[0].message.content

    async def stream_tts(self, text: str):
        uri = (
            f"wss://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/stream-input"
            f"?auto_mode=true&output_format=mp3_44100_128"
        )

        audio_data = b""

        async with websockets.connect(
            uri,
            extra_headers={"xi-api-key": ELEVEN_KEY}
        ) as ws:
            await ws.send(json.dumps({
                "text": text,
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75
                },
                "generation_config": {
                    "chunk_length_schedule": [120, 160, 250]
                }
            }))

            await ws.send(json.dumps({"text": ""}))  # End of stream

            async for msg in ws:
                data = json.loads(msg)

                if "audio" in data and data["audio"]:
                    try:
                        audio_data += base64.b64decode(data["audio"])
                    except Exception as e:
                        print("Decode error:", e)

                if data.get("isFinal"):
                    break

        if not audio_data:
            print("No audio returned by ElevenLabs.")
            return "", 0.0, []

        # Get duration using pydub
        audio = AudioSegment.from_file(io.BytesIO(audio_data), format="mp3")
        duration_seconds = round(len(audio) / 1000.0, 2)  # ms to sec

        visemes = approximate_visemes(text, duration_seconds)
        audio_b64 = base64.b64encode(audio_data).decode("utf-8")
        return audio_b64, duration_seconds, visemes


tutor = AudioLanguageTutor(client)

@app.post("/process-audio/")
async def process_audio(
    audio: UploadFile,
    native_language: str = Form(...),
    learning_language: str = Form(...)
):
    result = await tutor.process_audio(audio, native_language, learning_language)
    return JSONResponse(content=result)