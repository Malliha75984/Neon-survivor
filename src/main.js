import { Game, GAME_STATES } from './js/game.js';
import { soundEngine } from './js/audio.js';

function initGame() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  const game = new Game(canvas);

  // Bind Main Menu Buttons
  const btnPlay = document.getElementById('btn-play');
  if (btnPlay) {
    btnPlay.addEventListener('click', () => game.startNewRun());
  }

  const btnHowToPlay = document.getElementById('btn-how-to-play');
  if (btnHowToPlay) {
    btnHowToPlay.addEventListener('click', () => {
      soundEngine.playClick();
      game.changeState(GAME_STATES.HOW_TO_PLAY);
    });
  }

  const btnSettings = document.getElementById('btn-settings');
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      soundEngine.playClick();
      game.changeState(GAME_STATES.SETTINGS);
    });
  }

  // How to Play Back Button
  const btnHowToBack = document.getElementById('btn-how-to-back');
  if (btnHowToBack) {
    btnHowToBack.addEventListener('click', () => {
      soundEngine.playClick();
      game.changeState(GAME_STATES.MAIN_MENU);
    });
  }

  // Settings Back & Toggles
  const btnSettingsBack = document.getElementById('btn-settings-back');
  if (btnSettingsBack) {
    btnSettingsBack.addEventListener('click', () => {
      soundEngine.playClick();
      game.changeState(GAME_STATES.MAIN_MENU);
    });
  }

  const btnToggleSfx = document.getElementById('btn-toggle-sfx');
  if (btnToggleSfx) {
    btnToggleSfx.addEventListener('click', () => game.toggleSFX());
  }

  const btnToggleShake = document.getElementById('btn-toggle-shake');
  if (btnToggleShake) {
    btnToggleShake.addEventListener('click', () => game.toggleShake());
  }

  // HUD Pause Button
  const btnPause = document.getElementById('btn-pause');
  if (btnPause) {
    btnPause.addEventListener('click', () => game.pauseGame());
  }

  // Pause Overlay Buttons
  const btnResume = document.getElementById('btn-resume');
  if (btnResume) {
    btnResume.addEventListener('click', () => game.resumeGame());
  }

  const btnRestartPause = document.getElementById('btn-restart-pause');
  if (btnRestartPause) {
    btnRestartPause.addEventListener('click', () => game.startNewRun());
  }

  const btnMenuPause = document.getElementById('btn-menu-pause');
  if (btnMenuPause) {
    btnMenuPause.addEventListener('click', () => {
      soundEngine.playClick();
      game.changeState(GAME_STATES.MAIN_MENU);
    });
  }

  // Game Over Buttons
  const btnPlayAgainGo = document.getElementById('btn-play-again-go');
  if (btnPlayAgainGo) {
    btnPlayAgainGo.addEventListener('click', () => game.startNewRun());
  }

  const btnMenuGo = document.getElementById('btn-menu-go');
  if (btnMenuGo) {
    btnMenuGo.addEventListener('click', () => {
      soundEngine.playClick();
      game.changeState(GAME_STATES.MAIN_MENU);
    });
  }

  // Victory Buttons
  const btnPlayAgainVic = document.getElementById('btn-play-again-vic');
  if (btnPlayAgainVic) {
    btnPlayAgainVic.addEventListener('click', () => game.startNewRun());
  }

  const btnMenuVic = document.getElementById('btn-menu-vic');
  if (btnMenuVic) {
    btnMenuVic.addEventListener('click', () => {
      soundEngine.playClick();
      game.changeState(GAME_STATES.MAIN_MENU);
    });
  }

  // Kickoff game loop
  requestAnimationFrame((t) => game.loop(t));
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
