// Music Player System
class MusicPlayer {
    constructor(mode = 'battle') {
        this.audio = null;
        this.currentTrackIndex = 0;
        this.mode = mode; // 'battle' or 'mainmenu'
        this.tracks = this.getTracksForMode(mode);
        this.isPlaying = false;
        this.volume = 0.5; // Default volume (50%)
        this.shuffleMode = true; // Enable shuffle/random by default
        this.playedTracks = []; // Track recently played songs to avoid immediate repeats
        this.initializePlayer();
    }

    getTracksForMode(mode) {
        if (mode === 'mainmenu') {
            return [
                { name: 'Game Starter Music', file: 'assets/music/mainmenu/Game Starter Music.mp3' },
                { name: 'Starter Music', file: 'assets/music/mainmenu/Starter Music.mp3' },
                { name: 'Starter Music 2', file: 'assets/music/mainmenu/startermusic2.mp3' },
                { name: 'Shop Music', file: 'assets/music/mainmenu/shopmusic.mp3' },
                { name: 'Game Music 1', file: 'assets/music/mainmenu/gamemusic1.mp3' }
            ];
        } else {
            // Battle mode
            return [
                { name: 'Game Music 1', file: 'assets/music/battle/gamemusic1.mp3' },
                { name: 'Battle Music', file: 'assets/music/battle/battlemusic.mp3' },
                { name: 'Boss Battle', file: 'assets/music/battle/bossbattle.mp3' }
            ];
        }
    }

    switchMode(newMode) {
        if (newMode === this.mode) return;
        
        const wasPlaying = this.isPlaying;
        this.pause();
        
        this.mode = newMode;
        this.tracks = this.getTracksForMode(newMode);
        this.currentTrackIndex = 0;
        
        // Load random first track if shuffle is enabled
        if (this.shuffleMode) {
            const randomIndex = Math.floor(Math.random() * this.tracks.length);
            this.loadTrack(randomIndex);
        } else {
            this.loadTrack(0);
        }
        
        // Update UI to reflect new tracks
        this.updateUI();
        
        // Resume playing if it was playing before
        if (wasPlaying) {
            this.play();
        }
    }

    initializePlayer() {
        // Create audio element
        this.audio = new Audio();
        this.audio.loop = false; // Disable loop to allow track switching
        this.audio.volume = this.volume;
        this.switchScheduled = false; // Track if we've scheduled a switch
        
        // Handle track end - when a track finishes, play next random track
        this.audio.addEventListener('ended', () => {
            if (this.shuffleMode) {
                this.playNext(); // Will play random next track
            } else {
                // Sequential mode: loop current track
                this.audio.currentTime = 0;
                if (this.isPlaying) {
                    this.audio.play();
                }
            }
        });
        
        // Auto-advance to next random track periodically when shuffle is enabled
        // This switches tracks every ~90 seconds to keep music varied
        this.audio.addEventListener('timeupdate', () => {
            if (this.shuffleMode && this.isPlaying && this.audio.currentTime > 0) {
                // Switch to random track every ~90 seconds
                const switchInterval = 90; // 90 seconds
                if (this.audio.currentTime >= switchInterval && !this.switchScheduled) {
                    this.switchScheduled = true;
                    setTimeout(() => {
                        if (this.isPlaying) {
                            this.playNext();
                        }
                        this.switchScheduled = false;
                    }, 100);
                }
            }
        });

        // Handle errors
        this.audio.addEventListener('error', (e) => {
            console.warn('[MUSIC] Error loading track:', this.tracks[this.currentTrackIndex].name, e);
        });

        // Load random first track if shuffle is enabled
        if (this.shuffleMode) {
            const randomIndex = Math.floor(Math.random() * this.tracks.length);
            this.loadTrack(randomIndex);
        } else {
            this.loadTrack(0);
        }
        this.isPlaying = false; // Ensure it starts as not playing
    }

    loadTrack(index) {
        if (index < 0 || index >= this.tracks.length) return;
        
        this.currentTrackIndex = index;
        const track = this.tracks[index];
        
        if (this.audio) {
            this.audio.pause();
            this.audio.src = track.file;
            this.audio.load();
            
            // Reset switch scheduling when loading new track
            this.switchScheduled = false;
            
            // Try to play if it was playing before
            if (this.isPlaying) {
                const playPromise = this.audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn('[MUSIC] Autoplay prevented:', error);
                        // User interaction required for autoplay
                    });
                }
            }
        }
    }

    play() {
        if (!this.audio) return;
        
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                this.updateUI();
            }).catch(error => {
                console.warn('[MUSIC] Play failed:', error);
                // User interaction might be required
            });
        }
    }

    pause() {
        if (this.audio) {
            this.audio.pause();
            this.isPlaying = false;
            this.updateUI();
        }
    }

    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    playNext() {
        let nextIndex;
        
        if (this.shuffleMode) {
            // Random mode: pick a random track, avoiding the current one
            do {
                nextIndex = Math.floor(Math.random() * this.tracks.length);
            } while (nextIndex === this.currentTrackIndex && this.tracks.length > 1);
        } else {
            // Sequential mode: play next track in order
            nextIndex = (this.currentTrackIndex + 1) % this.tracks.length;
        }
        
        this.loadTrack(nextIndex);
        if (this.isPlaying) {
            this.play();
        }
    }

    playPrevious() {
        const prevIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
        this.loadTrack(prevIndex);
        if (this.isPlaying) {
            this.play();
        }
    }

    selectTrack(index) {
        this.loadTrack(index);
        if (this.isPlaying) {
            this.play();
        }
        this.updateUI();
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.audio) {
            this.audio.volume = this.volume;
        }
        this.updateUI();
    }

    getCurrentTrack() {
        return this.tracks[this.currentTrackIndex];
    }

    updateUI() {
        // Update music player UI if it exists
        const musicControls = document.getElementById('musicControls');
        if (!musicControls) return;

        const playPauseBtn = document.getElementById('musicPlayPause');
        const trackSelect = document.getElementById('musicTrackSelect');
        const volumeSlider = document.getElementById('musicVolume');
        const currentTrackName = document.getElementById('currentTrackName');

        if (playPauseBtn) {
            playPauseBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
        }

        // Update track select dropdown with current tracks
        if (trackSelect) {
            trackSelect.innerHTML = '';
            this.tracks.forEach((track, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = track.name;
                trackSelect.appendChild(option);
            });
            trackSelect.value = this.currentTrackIndex;
        }

        if (volumeSlider) {
            volumeSlider.value = this.volume * 100;
        }

        if (currentTrackName) {
            currentTrackName.textContent = this.getCurrentTrack().name;
        }
    }
}

// Initialize global music player
let musicPlayer = null;
let mainMenuMusicPlayer = null;

function initializeMusicPlayer(mode = 'battle') {
    if (mode === 'mainmenu') {
        if (!mainMenuMusicPlayer) {
            mainMenuMusicPlayer = new MusicPlayer('mainmenu');
        }
        return mainMenuMusicPlayer;
    } else {
        if (!musicPlayer) {
            musicPlayer = new MusicPlayer('battle');
        } else if (musicPlayer.mode !== 'battle') {
            // Switch existing player to battle mode
            musicPlayer.switchMode('battle');
        }
        return musicPlayer;
    }
}

function switchToBattleMusic() {
    // Stop main menu music if playing
    if (mainMenuMusicPlayer && mainMenuMusicPlayer.isPlaying) {
        mainMenuMusicPlayer.pause();
    }
    
    // Initialize or switch to battle music
    if (!musicPlayer) {
        musicPlayer = initializeMusicPlayer('battle');
    } else {
        musicPlayer.switchMode('battle');
    }
    
    // Start playing battle music
    if (musicPlayer) {
        musicPlayer.play();
    }
}

function switchToMainMenuMusic() {
    // Stop battle music if playing
    if (musicPlayer && musicPlayer.isPlaying) {
        musicPlayer.pause();
    }
    
    // Initialize or switch to main menu music
    if (!mainMenuMusicPlayer) {
        mainMenuMusicPlayer = initializeMusicPlayer('mainmenu');
    } else {
        mainMenuMusicPlayer.switchMode('mainmenu');
    }
    
    // Select "Game Starter Music" (first track, index 0)
    if (mainMenuMusicPlayer) {
        mainMenuMusicPlayer.selectTrack(0); // Game Starter Music is the first track
        mainMenuMusicPlayer.play();
    }
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.switchToMainMenuMusic = switchToMainMenuMusic;
    window.switchToBattleMusic = switchToBattleMusic;
    window.initializeMusicPlayer = initializeMusicPlayer;
}

