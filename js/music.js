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
        this.initializePlayer();
    }

    initializePlayer() {
        // Create audio element
        this.audio = new Audio();
        this.audio.loop = true;
        this.audio.volume = this.volume;
        
        // Handle track end (shouldn't happen with loop, but just in case)
        this.audio.addEventListener('ended', () => {
            this.playNext();
        });

        // Handle errors
        this.audio.addEventListener('error', (e) => {
            console.warn('[MUSIC] Error loading track:', this.tracks[this.currentTrackIndex].name, e);
        });

        // Load first track (but don't play yet - wait for battle start)
        this.loadTrack(0);
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
        const nextIndex = (this.currentTrackIndex + 1) % this.tracks.length;
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

