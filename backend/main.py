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
from typing import List, Dict
import random
import re
from fastapi import FastAPI, Form
from pydantic import BaseModel

OPENAI_KEY = "OpenAIKey"
ELEVEN_KEY = "ElevenLabsKey"
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
        self.message_history = []
        self.last_lang_pair = (None, None) 

    async def process_audio(self, audio_file: UploadFile, native_lang: str, learning_lang: str, MessageIndex: int,):
        audio_bytes = await audio_file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
            temp_audio.write(audio_bytes)
            temp_audio_path = temp_audio.name

        transcript = self.transcribe_audio(temp_audio_path,native_lang, learning_lang)
        ai_response = self.generate_learning_response(
            transcript,
            native_lang,
            learning_lang,
            MessageIndex,
        )
        audio_b64, duration, visemes = await self.stream_tts(ai_response,learning_lang)

        return {
            "transcript": transcript,
            "ai_response": ai_response,
            "audio_base64": audio_b64,
            "visemes": visemes
        }
    def transcribe_audio(self, audio_path: str, native_lang: str, learning_lang: str) -> str:
        with open(audio_path, "rb") as f:
            transcript = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                language=None,
                prompt=(
                    f"This audio may switch between {native_lang} and {learning_lang}. "
                    f"Transcribe everything clearly and accurately even if the speaker mixes the two languages."
                )
            )
        return transcript.text


##Make Chat history reset change when either langauge is changed
    def get_personality_by_nationality(self, text: str):
        people = {
            "french": {
                "name": "Camille",
                "traits": "From Paris, loves baking, has a small dog, works at a bakery"
            },
            "english": {
                "name": "John",
                "traits": "From London, likes reading and tea, has a cat, works as a teacher"
            },
            "spanish": {
                "name": "Javier",
                "traits": "From Madrid, plays guitar, loves the beach, works as a tour guide"
            },
            "dutch": {
                "name": "Daan",
                "traits": "From Amsterdam, rides a bike everywhere, likes soccer, works as an engineer"
            },
            "chinese": {
                "name": "Li Wei",
                "traits": "From Beijing, enjoys calligraphy, drinks green tea, works as a software developer"
            },
            "japanese": {
                "name": "Haruka",
                "traits": "From Tokyo, loves anime and drawing, has a pet rabbit, studies graphic design"
            }
        }

        text_lower = text.lower()
        for nationality in people:
            if nationality in text_lower:
                person = people[nationality]
                return f"{person['name']}: {person['traits']}"

        return "No matching nationality found."

    def generate_learning_response(
        self,
        input_text: str,
        native_lang: str,
        learning_lang: str,
        messageIndex: int,
    ) -> str:
        if not hasattr(self, "message_histories"):
            self.message_histories = []

        # Ensure the index is valid and create a new slot if necessary
        while len(self.message_histories) <= messageIndex:
            self.message_histories.append([])

        message_history = self.message_histories[messageIndex]

        # Add the system prompt if history is empty
        if not message_history:
            YourPersonality = self.get_personality_by_nationality(learning_lang)
            message_history.append({
                "role": "system",
                "content": (
                    f"You are {YourPersonality}, and you are a friendly and helpful language tutor. The user is a native {native_lang} speaker and is learning {learning_lang}. "
                    f"Always respond in 2–3 short, conversational sentences with a warm tone. "
                    f"Use a mix of {learning_lang} (with simple vocabulary) with mostly {native_lang} for scaffolding. "
                    f"Occasionally ask them to repeat short words or phrases out loud. Only ask them if it's necessary and you haven't asked them to repeat anything in a while. "
                    f"If the user's next message sounds like they are responding to your 'repeat after me', compare what they said to the exact phrase you asked them to repeat. "
                    f"Give positive feedback if it's correct, or gently correct them if there are mistakes."
                )
            })

        # Append the user's latest message
        message_history.append({
            "role": "user",
            "content": input_text
        })

        # Get AI response with history context
        response = self.client.chat.completions.create(
            model="gpt-4o",  # Recommended for speed + accuracy
            messages=message_history
        )

        assistant_reply = response.choices[0].message.content

        # Append assistant's reply
        message_history.append({
            "role": "assistant",
            "content": assistant_reply
        })

        return assistant_reply






    def get_voice_id(self, language: str) -> str:
        voice_map = {
            "japanese":"3JDquces8E8bkmvbh6Bc",
            "chinese": "bhJUNIXWQQ94l8eI2VUf",
            "french": "DOqLhiOMs8JmafdomNTP",
            "english": "PoPHDFYHijTq7YiSCwE3",
            "spanish": "sDh3eviBhiuHKi0MjTNq",
            "dutch": "G53Wkf3yrsXvhoQsmslL"
        }
        return voice_map.get(language.lower(), "21m00Tcm4TlvDq8ikWAM")  # default to English

    async def stream_tts(self, text: str, Language: str):
        uri = (
            f"wss://api.elevenlabs.io/v1/text-to-speech/{self.get_voice_id(Language)}/stream-input"
            f"?model_id=eleven_flash_v2_5&output_format=mp3_44100_128"
        )

        audio_data = b""

        # Set speed based on language
        voice_settings = {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
        #if Language.lower() == "french":
         #   voice_settings["speed"] = 0.8

        async with websockets.connect(
            uri,
            extra_headers=[("xi-api-key", ELEVEN_KEY)]
        ) as ws:
            await ws.send(json.dumps({
                "text": text,
                "voice_settings": voice_settings,
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
    learning_language: str = Form(...),
    MessageIndex: int = Form(...)
):
    result = await tutor.process_audio(audio, native_language, learning_language, MessageIndex)
    return JSONResponse(content=result)
