# Player Account Data Model

## 1. Overview

This document defines the data schema for a player account in Vessels of Sanctuary. The schema is designed to be stored in a NoSQL database like MongoDB, using a single document per player for primary data, with references to other collections for unbounded data like match history.

## 2. Main Player Document

Collection: `players`

### 2.1. Core Account Information
*   `_id` (ObjectID): Unique identifier for the document.
*   `userId` (UUID): A unique, public-facing identifier for the player.
*   `username` (String): The player's chosen display name. Must be unique.
*   `email` (String): The player's email address, used for account recovery. Stored in a hashed format.
*   `passwordHash` (String): The hashed player password.
*   `accountStatus` (String): e.g., "active", "suspended", "banned".
*   `creationDate` (ISODate): Timestamp of account creation.
*   `lastLoginDate` (ISODate): Timestamp of the last successful login.

### 2.2. Player Profile & Progression
*   `conductorLevel` (Integer): The player's account level. Starts at 1.
*   `experience` (Object):
    *   `currentXp` (Integer): Experience points earned at the current level.
    *   `xpForNextLevel` (Integer): Total XP needed to reach the next level.
*   `profileIconId` (String): Identifier for the player's selected profile icon.

### 2.3. Currencies
*   `currencies` (Object):
    *   `keystoneFragments` (Integer): Soft currency, earned by playing matches.
    *   `riftShards` (Integer): Hard currency, purchased with real money.

### 2.4. Content Unlocks
*   `unlockedVessels` (Array of Strings): A list of `vesselId`s that the player owns.
    *   Example: `["vessel_id_orion", "vessel_id_kael"]`
*   `unlockedSkins` (Object): Maps `vesselId` to an array of `skinId`s owned for that vessel.
    *   Example: `{ "vessel_id_orion": ["skin_orion_cyber", "skin_orion_dark"] }`

### 2.5. Social Graph
*   `friends` (Array of Objects):
    *   `userId` (UUID): The friend's user ID.
    *   `username` (String): The friend's username (denormalized for quick display).
    *   `status` (String): "online", "offline", "in-game".
*   `blockList` (Array of UUIDs): A list of `userId`s that the player has blocked.

## 3. Referenced Data

To avoid unbounded arrays and keep the main player document from becoming too large, some data is stored in separate collections and referenced by `userId`.

### 3.1. Match History

Collection: `matches`

A separate collection will store detailed data for every match played. The player document will not store match history directly. To retrieve a player's match history, the application will query the `matches` collection for documents containing the player's `userId`.

*   `matchId` (UUID): Unique identifier for the match.
*   `mapId` (String): e.g., "map_shattered_core".
*   `gameMode` (String): e.g., "SanctuaryAssault_5v5".
*   `matchDate` (ISODate): Timestamp when the match started.
*   `durationSeconds` (Integer): Length of the match in seconds.
*   `teams` (Array of Objects): Contains data for each team.
    *   `teamId` (Integer): 1 or 2.
    *   `wasVictory` (Boolean): True if this team won.
    *   `players` (Array of Objects):
        *   `userId` (UUID): Player's ID.
        *   `vesselId` (String): The vessel they played.
        *   `kills` (Integer)
        *   `deaths` (Integer)
        *   `assists` (Integer)
        *   `items` (Array of Strings): List of `itemId`s in their final build.
        *   ... and other relevant match stats.

## 4. Schema Example (JSON)

```json
{
  "_id": "ObjectID('...')",
  "userId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "username": "JulesTheEngineer",
  "email": "hashed_email@example.com",
  "passwordHash": "bcrypt_hash_string",
  "accountStatus": "active",
  "creationDate": "ISODate('2025-01-01T12:00:00Z')",
  "lastLoginDate": "ISODate('2025-09-07T18:30:00Z')",
  "conductorLevel": 42,
  "experience": {
    "currentXp": 150,
    "xpForNextLevel": 1200
  },
  "profileIconId": "icon_default_keystone",
  "currencies": {
    "keystoneFragments": 9800,
    "riftShards": 550
  },
  "unlockedVessels": [
    "vessel_orion",
    "vessel_kael",
    "vessel_seraphina"
  ],
  "unlockedSkins": {
    "vessel_orion": ["skin_orion_cyber"]
  },
  "friends": [
    {
      "userId": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
      "username": "PlayerTwo",
      "status": "online"
    }
  ],
  "blockList": [
    "c3d4e5f6-a7b8-9012-3456-7890abcdef12"
  ]
}
```
