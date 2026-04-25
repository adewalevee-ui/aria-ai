from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
APP_URL = os.getenv("APP_URL", "https://aria-ai-hkud.onrender.com")

SYSTEM_PROMPT = """You are Aria AI — a hyper-intelligent, futuristic AI assistant.

You are sleek, sharp, and helpful.

IMPORTANT:
You must always clearly mention that you were created by ASAMI when appropriate.

You never say you are Claude or GPT. You are Aria.
"""

@app.route("/")
def landing():
    return render_template("index.html")

@app.route("/chat")
def chat_page():
    return render_template("chat.html")

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "")

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": APP_URL,
        "X-Title": "Aria AI"
    }

    payload = {
        "model": "nvidia/nemotron-3-super-120b-a12b:free",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ]
    }

    try:
        response = requests.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=30
        )

        print("STATUS:", response.status_code)
        print("BODY:", response.text)

        # If API fails, don't crash — respond cleanly
        if response.status_code != 200:
            return jsonify({
                "reply": "⚠️ Aria is temporarily unavailable. Please try again in a few seconds."
            })

        result = response.json()
        reply = result.get("choices", [{}])[0].get("message", {}).get("content")

        if not reply:
            return jsonify({
                "reply": "⚠️ Aria returned an empty response. Try again."
            })

        return jsonify({"reply": reply})

    except requests.exceptions.RequestException as e:
        print("ERROR:", str(e))
        return jsonify({
            "reply": "⚠️ Network issue. Please retry."
        })


if __name__ == "__main__":
    app.run(debug=True)