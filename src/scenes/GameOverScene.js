import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create(data) {
        this.sound.stopAll();

        const oldHighScore = parseInt(localStorage.getItem('highScore') || '0');
        const isNewRecord = data.score > oldHighScore;
        
        // Cumulative stats
        const totalKilled = parseInt(localStorage.getItem('totalKilled') || '0') + data.enemiesKilled;
        localStorage.setItem('totalKilled', totalKilled.toString());

        // Dark overlay
        this.add.rectangle(200, 150, 400, 300, 0x000000, 0.8).setOrigin(0.5);

        // Game Over Title
        this.add.text(200, 40, 'GAME OVER', {
            fontSize: '32px',
            fill: '#ff0000',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        if (isNewRecord) {
            this.handleNewHighScore(data.score, data);
        } else {
            this.showStats(data);
        }
    }

    handleNewHighScore(newScore, data) {
        this.add.text(200, 85, 'NEW HIGH SCORE!', {
            fontSize: '20px',
            fill: '#ffff00',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(200, 115, 'ENTER INITIALS:', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        let initials = "";
        const initialsText = this.add.text(200, 150, '___', {
            fontSize: '32px',
            fill: '#00ffff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Handle keyboard input for initials
        this.input.keyboard.on('keydown', (event) => {
            if (initials.length < 3 && event.keyCode >= 65 && event.keyCode <= 90) {
                // A-Z
                initials += event.key.toUpperCase();
            } else if (event.keyCode === 8) {
                // Backspace
                initials = initials.slice(0, -1);
            } else if (event.keyCode === 13 && initials.length === 3) {
                // Enter
                localStorage.setItem('highScore', newScore.toString());
                localStorage.setItem('highScoreInitials', initials);
                this.input.keyboard.removeAllListeners();
                this.scene.restart(data); // Refresh to show stats
                return;
            }
            
            let display = initials;
            while(display.length < 3) display += "_";
            initialsText.setText(display);
        });

        this.add.text(200, 260, 'Press ENTER to Save', {
            fontSize: '12px',
            fill: '#aaaaaa',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }

    showStats(data) {
        const highScore = localStorage.getItem('highScore') || '0';
        const initials = localStorage.getItem('highScoreInitials') || '???';

        const stats = [
            `Final Score: ${data.score}`,
            `High Score: ${highScore} (${initials})`,
            `Level Reached: ${data.level}`,
            `Enemies Zapped: ${data.enemiesKilled}`,
            `Enemies Missed: ${data.enemiesMissed || 0}`
        ];

        stats.forEach((text, i) => {
            this.add.text(200, 100 + (i * 22), text, {
                fontSize: '14px',
                fill: '#ffffff',
                fontFamily: 'monospace'
            }).setOrigin(0.5);
        });

        this.add.text(200, 250, 'Press SPACE or Controller Button\nto return to Menu', {
            fontSize: '12px',
            fill: '#00ff00',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('MainMenuScene');
        });

        if (this.input.gamepad) {
            this.input.gamepad.once('down', (pad, button) => {
                this.scene.start('MainMenuScene');
            });
        }
    }
}