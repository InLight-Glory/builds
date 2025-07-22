# 🔌 WebSocket Event Specification
**Version:** 1.0
**Date:** July 22, 2025

## 1. Overview
This document defines the structure and payload for core WebSocket events sent between the game client and the Node.js server. This is not an exhaustive list but serves as the foundation for our real-time communication protocol.

**Format:** All data will be sent as JSON strings.

---

## 2. Client-to-Server (C2S) Events

### `player:move`
* **Trigger:** Sent by the client on every frame that the player provides a movement input.
* **Purpose:** To inform the server of the player's intended movement direction.
* **Payload:**
    ```json
    {
      "type": "player:move",
      "data": {
        "direction": { "x": 0.707, "z": -0.707 }, // Normalized Vector2
        "sequence": 123 // A sequence number for ordering packets
      }
    }
    ```

### `player:swap`
* **Trigger:** Sent by the client when the player presses the `Shift` key and the swap is not on cooldown.
* **Purpose:** To request a swap between the player's two Vessels.
* **Payload:**
    ```json
    {
      "type": "player:swap",
      "data": {
        "timestamp": 1677612345678 // Client-side timestamp
      }
    }
    ```

---

## 3. Server-to-Client (S2C) Events

### `game:state`
* **Trigger:** Sent by the server at a fixed interval (e.g., 20 times per second).
* **Purpose:** To provide all clients with the authoritative state of all dynamic objects in the game.
* **Payload:**
    ```json
    {
      "type": "game:state",
      "data": {
        "players": [
          {
            "id": "player_123",
            "activeVesselIndex": 0,
            "position": { "x": 10.5, "z": -25.1 },
            "rotation": { "y": 1.57 }
          }
        ],
        "timestamp": 1677612345690
      }
    }
    ```

### `player:swap_confirm`
* **Trigger:** Sent by the server to a specific client after validating and executing their swap request.
* **Purpose:** To confirm that the swap was successful and provide the new state.
* **Payload:**
    ```json
    {
      "type": "player:swap_confirm",
      "data": {
        "playerId": "player_123",
        "newActiveVesselIndex": 1,
        "cooldown": 5.0
      }
    }
    
