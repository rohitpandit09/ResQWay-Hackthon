const fs = require("fs");
const GroqSDK = require("groq-sdk");

const Groq = GroqSDK.default || GroqSDK;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// =====================================================
// AUDIO -> TEXT
// =====================================================

const transcribeAudio = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Audio file not found: ${filePath}`);
  }

  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(filePath),

    model: process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo",

    response_format: "json",

    temperature: 0,
  });

  return transcription.text?.trim() || "";
};

// =====================================================
// TEXT -> EMERGENCY INTENT
// =====================================================

const detectEmergencyIntent = async (transcript) => {
  if (!transcript || !transcript.trim()) {
    throw new Error("Transcript is empty");
  }

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_INTENT_MODEL || "openai/gpt-oss-20b",

    temperature: 0,

    messages: [
      {
        role: "system",
        content: `
You are the emergency-intent classifier for ResQWay.

Your job is ONLY to determine whether the conversation
contains a genuine request for ambulance or urgent medical
emergency assistance.

Do not diagnose the patient.

Do not provide medical advice.

Respond using the required JSON schema.

Set isEmergency=true when the transcript clearly indicates
that immediate ambulance/emergency assistance is being requested.

Examples of emergency intent:
- "Please send an ambulance."
- "My father has collapsed, send an ambulance."
- "There has been an accident and we need an ambulance."
- "He is unconscious, please come quickly."

Examples of non-emergency:
- "What is the ambulance number?"
- "I want to ask about ambulance charges."
- "Cancel the ambulance."
- casual conversation without an emergency request.

Use a confidence value between 0 and 1.
          `,
      },

      {
        role: "user",
        content: `Transcript:

"${transcript}"`,
      },
    ],

    response_format: {
      type: "json_schema",

      json_schema: {
        name: "emergency_intent",

        strict: true,

        schema: {
          type: "object",

          properties: {
            isEmergency: {
              type: "boolean",
            },

            confidence: {
              type: "number",
            },

            intent: {
              type: "string",

              enum: [
                "AMBULANCE_REQUIRED",
                "MEDICAL_EMERGENCY",
                "NOT_EMERGENCY",
                "UNKNOWN",
              ],
            },

            reason: {
              type: "string",
            },
          },

          required: ["isEmergency", "confidence", "intent", "reason"],

          additionalProperties: false,
        },
      },
    },
  });

  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty classification");
  }

  return JSON.parse(content);
};

module.exports = {
  transcribeAudio,
  detectEmergencyIntent,
};
