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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Call", callSchema);