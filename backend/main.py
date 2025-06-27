import openai
import tempfile
import base64
import json
import asyncio
import websockets
from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware


OPENAI_KEY = "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"
ELEVEN_KEY = "sk_951d9a2de7e34e9a3bd33837f5685dbf70d65150ece70e56"
VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel

openai.api_key = OPENAI_KEY
client = openai

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        audio_b64, visemes = await self.stream_tts_with_visemes(ai_response)

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

    async def stream_tts_with_visemes(self, text: str):
            VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel
            uri = (
                f"wss://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/stream-input"
                f"?auto_mode=true&output_format=mp3_44100_128&sync_alignment=true"
            )

            audio_data = b""
            visemes = []

            async with websockets.connect(
                uri,
                extra_headers={"xi-api-key": ELEVEN_KEY}
            ) as ws:
                # Valid initial payload — only supported fields
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
                    print("ELEVEN:", msg)
                    data = json.loads(msg)

                    # Safely collect audio chunks
                    if "audio" in data and data["audio"]:
                        try:
                            audio_data += base64.b64decode(data["audio"])
                        except Exception as e:
                            print("Decode error:", e)

                    # Collect visemes
                    alignment = data.get("normalizedAlignment") or {}
                    if all(k in alignment for k in ("chars", "charStartTimesMs", "charsDurationsMs")):
                        for ch, st, dr in zip(alignment["chars"], alignment["charStartTimesMs"], alignment["charsDurationsMs"]):
                            visemes.append({
                                "char": ch,
                                "start": round(st / 1000, 3),
                                "end": round((st + dr) / 1000, 3)
                            })

                    if data.get("isFinal"):
                        break

            # Return fallback if nothing generated
            if not audio_data:
                print("No audio returned by ElevenLabs.")
                return "", []
            print("This is VISEMSe", visemes)
            audio_b64 = base64.b64encode(audio_data).decode("utf-8")
            return audio_b64, visemes




tutor = AudioLanguageTutor(client)

@app.post("/process-audio/")
async def process_audio(
    audio: UploadFile,
    native_language: str = Form(...),
    learning_language: str = Form(...)
):
    result = await tutor.process_audio(audio, native_language, learning_language)
    return JSONResponse(content=result)
