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
        self.message_history = []
        self.last_lang_pair = (None, None) 

    async def process_audio(self, audio_file: UploadFile, native_lang: str, learning_lang: str):
        audio_bytes = await audio_file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
            temp_audio.write(audio_bytes)
            temp_audio_path = temp_audio.name

        transcript = self.transcribe_audio(temp_audio_path,native_lang, learning_lang)
        ai_response = self.generate_learning_response(
            transcript,
            native_lang,
            learning_lang,
        )
        audio_b64, duration, visemes = await self.stream_tts(ai_response,learning_lang)

        return {
            "transcript": transcript,
            "ai_response": ai_response,
            "audio_base64": audio_b64,
            "visemes": visemes
        }
##Make Chat history reset change when either langauge is changed
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

    def generate_learning_response(
        self,
        input_text: str,
        native_lang: str,
        learning_lang: str,
    ) -> str:
        # Reset history if languages change
        current_lang_pair = (native_lang, learning_lang)
        if current_lang_pair != self.last_lang_pair:
            self.message_history = []
            self.last_lang_pair = current_lang_pair

        # Add the system prompt if history is empty
        if not self.message_history:
            self.message_history.append({
                "role": "system",
                "content": (
                    f"You are a friendly and helpful language tutor. The user is a native {native_lang} speaker and is learning {learning_lang}. "
                    f"Always respond in 2–3 short, conversational sentences with a warm tone. "
                    f"Use a mix of {learning_lang} (with simple vocabulary) with the use of {native_lang} for scaffolding. "
                    f"Occasionally ask them to repeat short words or phrases out loud. "
                    f"If the user's next message sounds like they are responding to your 'repeat after me', compare what they said to the exact phrase you asked them to repeat. "
                    f"Give positive feedback if it's correct, or gently correct them if there are mistakes."
                )
            })

        # Append the user's latest message
        self.message_history.append({
            "role": "user",
            "content": input_text
        })

        # Get AI response with history context
        response = self.client.chat.completions.create(
            model="gpt-4o",  # Recommended for speed + accuracy
            messages=self.message_history
        )

        assistant_reply = response.choices[0].message.content

        self.message_history.append({
            "role": "assistant",
            "content": assistant_reply
        })

        return assistant_reply





    def humanize_text(self,text: str) -> str:
        filler_starters = ["Um...", "Uh...", "Like..."]
        mid_fillers = [", uh,", ", like,", ", hmm,"]
        end_pauses = ["...", " —", "…"]

        # Split by sentences more cleanly (handles '.', '?', '!')
        phrases = re.split(r'(?<=[.!?])\s+', text.strip())
        humanized = []

        for sentence in phrases:
            sentence = sentence.strip()
            if not sentence:
                continue

            # Add a random filler to the start
            if random.random() < 0.3:
                sentence = f"{random.choice(filler_starters)} {sentence}"

            # Add a random mid-sentence filler
            if random.random() < 0.3 and ',' in sentence:
                parts = sentence.split(',', 1)
                sentence = f"{parts[0]}{random.choice(mid_fillers)}{parts[1]}"

            # Add a pause to the end
            if random.random() < 0.5:
                sentence = sentence.rstrip('.!?') + random.choice(end_pauses)

            humanized.append(sentence)

        return ' '.join(humanized)


    def get_voice_id(self, language: str) -> str:
        voice_map = {
            "france": "t8BrjWUT5Z23DLLBzbuY",
            "english": "21m00Tcm4TlvDq8ikWAM",
            "spanish": "sDh3eviBhiuHKi0MjTNq",
            "dutch": "G53Wkf3yrsXvhoQsmslL"
        }
        return voice_map.get(language.lower(), "21m00Tcm4TlvDq8ikWAM")  # default to English

    async def stream_tts(self, text: str, Language: str):
      ##  humanized_text = self.humanize_text(text)
        uri = (
            f"wss://api.elevenlabs.io/v1/text-to-speech/{self.get_voice_id(Language)}/stream-input"
            f"?model_id=eleven_flash_v2_5&output_format=mp3_44100_128"
        )
        

        audio_data = b""

        async with websockets.connect(
            uri,
            extra_headers=[("xi-api-key", ELEVEN_KEY)]
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