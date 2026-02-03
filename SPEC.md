# Retro 2D Space Shooter Spec

## Overview
A classic top-down scrolling space shooter game built with Phaser. The player controls a spaceship, dodging obstacles and fighting waves of alien enemies.

## Core Mechanics
1.  **Player Control:**
    *   Top-down movement (WASD or Arrow keys).
    *   Shooting mechanics (Spacebar).
2.  **Enemies:**
    *   Flying alien ships that move towards the player or in patterns.
    *   Basic collision detection (Player vs Enemy, Laser vs Enemy).
3.  **Environment:**
    *   Scrolling space background with parallax stars.
4.  **Game Loop:**
    *   Score tracking.
    *   Game Over state upon collision.

## Assets (Local Mappings)
All assets have been moved to `public/assets/` for easy access.

| Entity | Source (Original Collection) | Project Path |
| :--- | :--- | :--- |
| **Player Ship** | `top-down-shooter-ship/spritesheets/thrust/ship-01.png` | `assets/player.png` |
| **Enemy** | `alien-flying-enemy/sprites/alien-enemy-flying1.png` | `assets/enemy.png` |
| **Background** | `space_background_pack/.../parallax-space-backgound.png` | `assets/background.png` |
| **Stars** | `space_background_pack/.../parallax-space-stars.png` | `assets/stars.png` |
| **Laser** | `SpaceShipShooter/.../laser-bolts1.png` | `assets/laser.png` |
| **Explosion** | `SpaceShipShooter/.../explosion.png` | `assets/explosion.png` |

## Milestones

### Milestone 1: The Lonely Void (Basic Movement)
*   **Goal:** A playable ship moving against a scrolling background.
*   **Requirements:**
    *   Initialize Phaser game instance.
    *   Load Player, Background, and Star assets.
    *   Implement infinite scrolling background (Parallax effect).
    *   Implement Player movement (Arrows/WASD).
    *   *Playable Check:* You can fly the ship around the screen, and the stars move to create depth.

### Milestone 2: First Contact (Shooting & Enemies)
*   **Goal:** The ability to shoot and destroy a dummy enemy.
*   **Requirements:**
    *   Implement Laser firing mechanism (Spacebar).
    *   Spawn a static or simple moving Enemy.
    *   Implement Collision Detection:
        *   Laser hits Enemy -> Enemy destroyed (plays explosion animation).
        *   Player hits Enemy -> Game Over (console log or simple text).
    *   Load Laser and Explosion assets.
*   *Playable Check:* You can shoot an enemy, see it explode, and die if you crash into it.

### Milestone 3: The War Begins (Game Loop & Polish)
*   **Goal:** A full game loop with scoring and restarting.
*   **Requirements:**
    *   Enemy Spawning Logic (Waves or random intervals).
    *   Score UI (Text display).
    *   Game Over Scene (Restart button).
    *   Sound Effects (if available, otherwise placeholders).
    *   Code refactoring for better structure (Scenes).
*   *Playable Check:* A complete arcade session where you try to get a high score before dying, with the ability to restart.
