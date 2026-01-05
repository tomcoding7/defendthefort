// Music Player System
class MusicPlayer {
    constructor() {
        this.audio = null;
        this.currentTrackIndex = 0;
        this.tracks = [
            { name: 'Game Music 1', file: 'assets/music/gamemusic1.mp3' },
            { name: 'Battle Music', file: 'assets/music/battlemusic.mp3' },
            { name: 'Boss Battle', file: 'assets/music/bossbattle.mp3' }
        ];
        this.isPlaying = false;
        this.volume = 0.5; // Default volume (50%)
        this.shuffleMode = true; // Enable shuffle/random by default
        this.playedTracks = []; // Track recently played songs to avoid immediate repeats
        this.initializePlayer();
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

        if (trackSelect) {
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

function initializeMusicPlayer() {
    musicPlayer = new MusicPlayer();
    
    // Try to start playing (may require user interaction)
    // We'll let the user start it manually via the UI
    return musicPlayer;
}

