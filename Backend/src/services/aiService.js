const fs = require("fs");
const {
  createEmergencyFromCall,
} = require("./emergencyService");

const Call = require("../models/Call");

const {
  transcribeAudio,
  detectEmergencyIntent,
} = require("./groqService");

const analyzeCall = async (callId) => {
  const call = await Call.findById(callId);

  if (!call) {
    throw new Error("Call not found");
  }

  // Recording must exist
  if (!call.recordingPath) {
    throw new Error(
      "No recording is available for this call"
    );
  }

  // Recording consent must exist
  if (!call.recordingConsent) {
    throw new Error(
      "Recording consent was not granted"
    );
  }

  // Recording must be ready
  if (call.recordingStatus !== "READY") {
    throw new Error(
      `Recording is not ready. Current status: ${call.recordingStatus}`
    );
  }

  if (!fs.existsSync(call.recordingPath)) {
    throw new Error(
      "Recording file does not exist on server"
    );
  }

  // Mark AI processing
  call.aiStatus = "PROCESSING";
  call.aiError = null;

  await call.save();

  let emergency = null;

    if (call.emergencyDetected) {
    emergency =
        await createEmergencyFromCall(
        call._id
        );

    console.log(
        `🚨 Emergency session created: ${emergency._id}`
    );
    }

  try {
    console.log(`🎙️ Transcribing call: ${callId}`);

    // ==========================================
    // STEP 1 — AUDIO -> TEXT
    // ==========================================

    const transcript =
      await transcribeAudio(
        call.recordingPath
      );

    if (!transcript) {
      throw new Error(
        "No speech was detected in the recording"
      );
    }

    console.log("📝 Transcript:");
    console.log(transcript);

    call.transcript = transcript;

    await call.save();

    // ==========================================
    // STEP 2 — TEXT -> EMERGENCY INTENT
    // ==========================================

    console.log(
      `🤖 Detecting emergency intent: ${callId}`
    );

    const intent =
      await detectEmergencyIntent(
        transcript
      );

    console.log("🚨 AI Result:");
    console.log(intent);

    // ==========================================
    // SAVE RESULT
    // ==========================================

    call.emergencyDetected =
      Boolean(intent.isEmergency);

    call.emergencyConfidence =
      Number(intent.confidence);

    call.emergencyIntent =
      intent.intent;

    call.emergencyReason =
      intent.reason;

    call.aiStatus = "COMPLETED";

    call.analyzedAt = new Date();

    await call.save();

    return {
    callId: call._id,

    transcript,

    ai: {
        isEmergency:
        call.emergencyDetected,

        confidence:
        call.emergencyConfidence,

        intent:
        call.emergencyIntent,

        reason:
        call.emergencyReason,
    },

    emergency: emergency
        ? {
            id: emergency._id,
            status: emergency.status,
            ambulanceId:
            emergency.ambulanceId,

            simulation:
            emergency.simulation,
        }
        : null,

    aiStatus: call.aiStatus,
    };
  } catch (error) {
    call.aiStatus = "FAILED";

    call.aiError =
      error.message?.slice(0, 1000) ||
      "AI analysis failed";

    await call.save();

    throw error;
  }
};

module.exports = {
  analyzeCall,
};