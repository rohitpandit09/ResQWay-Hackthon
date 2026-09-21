const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema(
  {
    callId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Call",
      required: true,
      unique: true,
    },

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

    ambulanceId: {
      type: String,
      required: true,
      default: "ambulance1",
    },

    status: {
      type: String,
      enum: [
        "CREATED",
        "ACTIVE",
        "EN_ROUTE_TO_USER",
        "USER_REACHED",
        "USER_PICKED_UP",
        "EN_ROUTE_TO_HOSPITAL",
        "HOSPITAL_REACHED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "CREATED",
    },

    simulation: {
      userPoint: {
        type: String,
        required: true,
      },

      hospitalPoint: {
        type: String,
        required: true,
      },

      ambulanceStartPoint: {
        type: String,
        required: true,
      },
    },

    currentAmbulanceState: {
      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },

      speed: {
        type: Number,
        default: null,
      },

      heading: {
        type: Number,
        default: null,
      },

      currentEdge: {
        type: String,
        default: null,
      },

      simulationTime: {
        type: Number,
        default: null,
      },

      updatedAt: {
        type: Date,
        default: null,
      },
    },

    route: {
      type: [String],
      default: [],
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    distanceToUser: {
    type: Number,
    default: null,
    },

    etaToUser: {
    type: Number,
    default: null,
    },

    signalData: {
    type: [
        {
        signalId: String,
        distance: Number,
        etaSeconds: Number,
        signalState: String,
        phase: Number,
        phaseDuration: Number,
        nextSwitch: Number,
        },
    ],
    default: [],
    },
  },

  
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Emergency",
  emergencySchema
);