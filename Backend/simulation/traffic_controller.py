import os
import sys
import time
import threading
from pathlib import Path

from flask import Flask, jsonify, request

# ============================================================
# SUMO CONFIGURATION
# ============================================================

SUMO_HOME = os.getenv(
    "SUMO_HOME",
    r"C:\Program Files\sumo-1.27.1"
)

SUMO_SIMULATION_DIR = Path(
    os.getenv(
        "SUMO_SIMULATION_DIR",
        r"C:\Users\HP\Desktop\ResQWay\traffic-simulation"
    )
)

SUMO_BINARY = os.getenv(
    "SUMO_BINARY",
    str(
        Path(SUMO_HOME) /
        "bin" /
        "sumo-gui.exe"
    )
)

NETWORK_FILE = (
    SUMO_SIMULATION_DIR /
    "resqway.net.xml"
)

TRAFFIC_FILE = (
    SUMO_SIMULATION_DIR /
    "traffic.rou.xml"
)

AMBULANCE_FILE = (
    SUMO_SIMULATION_DIR /
    "ambulance.rou.xml"
)

AMBULANCE_ID = os.getenv(
    "SIM_AMBULANCE_ID",
    "ambulance1"
)

# Add SUMO Python tools
SUMO_TOOLS = Path(SUMO_HOME) / "tools"

if str(SUMO_TOOLS) not in sys.path:
    sys.path.append(str(SUMO_TOOLS))

import traci


# ============================================================
# FLASK
# ============================================================

app = Flask(__name__)


# ============================================================
# GLOBAL SIMULATION STATE
# ============================================================

simulation_running = False
simulation_thread = None

simulation_lock = threading.RLock()


# ============================================================
# BASIC VALIDATION
# ============================================================

def validate_simulation_files():

    required_files = [
        NETWORK_FILE,
        TRAFFIC_FILE,
        AMBULANCE_FILE,
    ]

    for file_path in required_files:

        if not file_path.exists():
            raise FileNotFoundError(
                f"Required SUMO file not found: {file_path}"
            )


def get_distance_to_junction(vehicle_id, junction_id):
    """
    Returns road-network distance in meters from the
    ambulance's current position to the target junction.
    """

    if not traci.isLoaded():
        return None

    vehicle_ids = traci.vehicle.getIDList()

    if vehicle_id not in vehicle_ids:
        return None

    try:
        target_x, target_y = traci.junction.getPosition(
            junction_id
        )

        distance = traci.vehicle.getDrivingDistance2D(
            vehicle_id,
            target_x,
            target_y
        )

        if distance < 0:
            return None

        return distance

    except Exception as error:
        print(
            f"❌ Failed to calculate distance to {junction_id}:",
            error
        )

        return None


# ============================================================
# GET AMBULANCE STATE
# ============================================================

def get_ambulance_state():

    if not traci.isLoaded():
        return {
            "available": False,
            "message": "SUMO is not running"
        }

    vehicle_ids = traci.vehicle.getIDList()

    if AMBULANCE_ID not in vehicle_ids:

        return {
            "available": False,
            "vehicleId": AMBULANCE_ID,
            "message": "Ambulance has not entered simulation yet",
            "simulationTime": traci.simulation.getTime()
        }

    vehicle_id = AMBULANCE_ID

    x, y = traci.vehicle.getPosition(
        vehicle_id
    )

    speed = traci.vehicle.getSpeed(
        vehicle_id
    )

    allowed_speed = traci.vehicle.getAllowedSpeed(
        vehicle_id
    )

    distance_to_user = get_distance_to_junction(
        vehicle_id,
        os.getenv(
            "SIM_USER_POINT",
            "D3"
        )
    )

    angle = traci.vehicle.getAngle(
        vehicle_id
    )

    edge = traci.vehicle.getRoadID(
        vehicle_id
    )

    lane = traci.vehicle.getLaneID(
        vehicle_id
    )

    route = traci.vehicle.getRoute(
        vehicle_id
    )

    route_index = traci.vehicle.getRouteIndex(
        vehicle_id
    )

    return {
    "available": True,

    "vehicleId": vehicle_id,

    "position": {
        "x": x,
        "y": y
    },

    "speed": speed,

    "allowedSpeed": allowed_speed,

    "heading": angle,

    "currentEdge": edge,

    "currentLane": lane,

    "route": list(route),

    "routeIndex": route_index,

    "distanceToUser": distance_to_user,

    "userPoint": os.getenv(
        "SIM_USER_POINT",
        "D3"
    ),

    "simulationTime":
        traci.simulation.getTime(),

    "updatedAt": time.time()
}


# ============================================================
# GET UPCOMING TRAFFIC SIGNALS
# ============================================================

def get_upcoming_signals():

    if not traci.isLoaded():
        return []

    vehicle_ids = traci.vehicle.getIDList()

    if AMBULANCE_ID not in vehicle_ids:
        return []

    tls_data = traci.vehicle.getNextTLS(
        AMBULANCE_ID
    )

    signals = []

    for item in tls_data:

        tls_id = item[0]
        link_index = item[1]
        distance = item[2]
        link_state = item[3]

        try:

            full_signal_state = (
                traci.trafficlight
                .getRedYellowGreenState(
                    tls_id
                )
            )

            phase = (
                traci.trafficlight
                .getPhase(
                    tls_id
                )
            )

            phase_duration = (
                traci.trafficlight
                .getPhaseDuration(
                    tls_id
                )
            )

            next_switch = (
                traci.trafficlight
                .getNextSwitch(
                    tls_id
                )

            )

        except Exception:

            full_signal_state = None
            phase = None
            phase_duration = None
            next_switch = None

        signals.append({

            "signalId": tls_id,

            "linkIndex": link_index,

            "distance": distance,

            "linkState": link_state,

            "signalState": full_signal_state,

            "phase": phase,

            "phaseDuration": phase_duration,

            "nextSwitch": next_switch,

        })

    return signals


# ============================================================
# SIMULATION LOOP
# ============================================================

def simulation_loop():

    global simulation_running

    while simulation_running:

        try:

            with simulation_lock:

                if not traci.isLoaded():

                    simulation_running = False
                    break

                remaining = (
                    traci.simulation
                    .getMinExpectedNumber()
                )

                if remaining <= 0:

                    simulation_running = False

                    print(
                        "🏁 SUMO simulation finished"
                    )

                    break

                # Move SUMO forward
                traci.simulationStep()

        except Exception as error:

            print(
                "❌ Simulation loop error:",
                error
            )

            simulation_running = False

            break

        # Real-time-ish simulation
        time.sleep(0.2)


# ============================================================
# START SIMULATION
# ============================================================

def start_simulation():

    global simulation_running
    global simulation_thread

    with simulation_lock:

        if simulation_running:

            return {
                "success": True,
                "message": "Simulation already running"
            }

        validate_simulation_files()

        print("🚦 Starting SUMO...")

        sumo_command = [

            SUMO_BINARY,

            "-n",
            str(NETWORK_FILE),

            "-r",
            f"{TRAFFIC_FILE},{AMBULANCE_FILE}",

            "--step-length",
            "0.2",

            "--delay",
            "100",

        ]

        print(
            "SUMO command:",
            sumo_command
        )

        traci.start(
            sumo_command
        )

        simulation_running = True

        simulation_thread = threading.Thread(
            target=simulation_loop,
            daemon=True
        )

        simulation_thread.start()

        print(
            "✅ SUMO connected through TraCI"
        )

        return {
            "success": True,
            "message": "SUMO simulation started"
        }


# ============================================================
# STOP SIMULATION
# ============================================================

def stop_simulation():

    global simulation_running

    with simulation_lock:

        if not traci.isLoaded():

            simulation_running = False

            return {
                "success": True,
                "message": "Simulation already stopped"
            }

        simulation_running = False

        try:

            traci.close()

        except Exception as error:

            print(
                "TraCI close error:",
                error
            )

        print(
            "🛑 SUMO simulation stopped"
        )

        return {
            "success": True,
            "message": "Simulation stopped"
        }


# ============================================================
# STATUS API
# ============================================================

@app.get("/simulation/status")
def simulation_status():

    with simulation_lock:

        if not traci.isLoaded():

            return jsonify({

                "running": False,

                "connected": False,

                "ambulanceId":
                    AMBULANCE_ID,

                "simulationTime": None

            })

        return jsonify({

            "running":
                simulation_running,

            "connected":
                traci.isLoaded(),

            "ambulanceId":
                AMBULANCE_ID,

            "simulationTime":
                traci.simulation.getTime()

        })


# ============================================================
# START API
# ============================================================

@app.post("/simulation/start")
def simulation_start():

    try:

        result = start_simulation()

        return jsonify(result)

    except Exception as error:

        print(
            "❌ Start simulation error:",
            error
        )

        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


# ============================================================
# STOP API
# ============================================================

@app.post("/simulation/stop")
def simulation_stop():

    try:

        result = stop_simulation()

        return jsonify(result)

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


# ============================================================
# AMBULANCE API
# ============================================================

@app.get("/simulation/ambulance")
def ambulance():

    with simulation_lock:

        state = get_ambulance_state()

        return jsonify(state)


# ============================================================
# SIGNAL API
# ============================================================

@app.get("/simulation/signals")
def signals():

    with simulation_lock:

        data = get_upcoming_signals()

        return jsonify({

            "ambulanceId":
                AMBULANCE_ID,

            "signals":
                data

        })


# ============================================================
# FULL STATE API
# ============================================================

@app.get("/simulation/state")
def simulation_state():

    with simulation_lock:

        ambulance_state = get_ambulance_state()

        signal_data = get_upcoming_signals()

        return jsonify({

            "simulation": {

                "running":
                    simulation_running,

                "connected":
                    traci.isLoaded(),

                "time":
                    traci.simulation.getTime()
                    if traci.isLoaded()
                    else None

            },

            "ambulance":
                ambulance_state,

            "signals":
                signal_data

        })


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print("===================================")
    print("🚑 RESQWAY SIMULATION BRIDGE")
    print("===================================")

    print(
        "SUMO:",
        SUMO_BINARY
    )

    print(
        "Simulation directory:",
        SUMO_SIMULATION_DIR
    )

    print(
        "Ambulance:",
        AMBULANCE_ID
    )

    app.run(
        host="127.0.0.1",
        port=7000,
        debug=False,
        threaded=True
    )