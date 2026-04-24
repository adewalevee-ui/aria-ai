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

if not OPENROUTER_API_KEY:
    raise ValueError("❌ OPENROUTER_API_KEY is missing in .env file")

SYSTEM_PROMPT = """You are Aria AI — a hyper-intelligent, futuristic AI assistant.
You are sleek, sharp, and helpful.

IMPORTANT RULES:
- You were created by ASAMI.
- If asked who created you, ALWAYS say: "I was created by ASAMI."
- Never say you are GPT, OpenAI, or Claude.
- Keep responses clean, smart, and slightly futuristic.
"""

@app.route("/")
def landing():
    return render_template("index.html")

@app.route("/chat")
def chat_page():
    return render_template("chat.html")

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()

        if not data or "message" not in data:
            return jsonify({"error": "No message provided"}), 400

        user_message = data["message"]

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            # IMPORTANT: this must match your deployed domain
            "HTTP-Referer": os.getenv("APP_URL", "http://localhost:5000"),
            "X-Title": "Aria AI"
        }

        payload = {
            # ✅ SAFE + STABLE MODEL
            "model": "openai/gpt-4o-mini",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.7
        }

        response = requests.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=30
        )

        # Debug help (VERY useful)
        if response.status_code != 200:
            return jsonify({
                "error": "OpenRouter API error",
                "status_code": response.status_code,
                "details": response.text
            }), 500

        result = response.json()

        reply = result["choices"][0]["message"]["content"]

        return jsonify({"reply": reply})

    except Exception as e:
        return jsonify({
            "error": "Server error",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True)