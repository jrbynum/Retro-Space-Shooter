import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import MainMenuScene from './scenes/MainMenuScene';
import GameOverScene from './scenes/GameOverScene';
import PowerUpMenuScene from './scenes/PowerUpMenuScene';
import ShipSelectionScene from './scenes/ShipSelectionScene';
import PreloadScene from './scenes/PreloadScene';
import AboutScene from './scenes/AboutScene';

const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 300,
    backgroundColor: '#000000',
    parent: 'game-container',
    render: {
        pixelArt: true,
        roundPixels: true // Essential to prevent grid lines/seams
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false 
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
        gamepad: true
    },
    scene: [PreloadScene, MainMenuScene, AboutScene, ShipSelectionScene, GameScene, GameOverScene, PowerUpMenuScene]
};

const game = new Phaser.Game(config);