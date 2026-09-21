const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "RINGING",
        "ACCEPTED",
        "CONNECTED",
        "ENDED",
        "REJECTED",
        "MISSED",
        "CANCELLED",
      ],
      default: "RINGING",
    },

    recordingConsent: {
      type: Boolean,
      default: false,
    },

    recordingStatus: {
      type: String,
      enum: [
        "NOT_STARTED",
        "RECORDING",
        "UPLOADING",
        "READY",
        "FAILED",
      ],
      default: "NOT_STARTED",
    },

    recordingPath: {
      type: String,
      default: null,
    },

    recordingMimeType: {
      type: String,
      default: null,
    },

    recordingSize: {
      type: Number,
      default: null,
    },

    recordingUploadedAt: {
      type: Date,
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    connectedAt: {
      type: Date,
      default: null,
    },

    endedAt: {
      type: Date,
      default: null,
    },

    aiStatus: {
  type: String,
  enum: [
    "NOT_STARTED",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
  ],
  default: "NOT_STARTED",
},

transcript: {
  type: String,
  default: null,
},

emergencyDetected: {
  type: Boolean,
  default: false,
},

emergencyConfidence: {
  type: Number,
  default: null,
},

emergencyIntent: {
  type: String,
  default: null,
},

emergencyReason: {
  type: String,
  default: null,
},

analyzedAt: {
  type: Date,
  default: null,
},

aiError: {
  type: String,
  default: null,
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Call", callSchema);