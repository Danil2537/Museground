// Function to create a track card
function createTrackCard(trackContainer, trackNumber) {
    // Create a new div element
    const newTrackDiv = document.createElement('div');
    newTrackDiv.classList.add('row', 'row-cols-1', 'row-cols-md-2', 'row-cols-lg-3', 'g-4');

    // HTML structure for the track card
    newTrackDiv.innerHTML = `
        <div class="card h-100 w-100">
            <div class="card-body">
                <h5 class="card-title">Track Title ${trackNumber}</h5>
                <p class="card-text">Artist Name</p>
                <div id="waveform${trackNumber}" class="wave"></div>
                <ul class="controls list-group list-group-horizontal">
                    <li class="list-group-item"><button id="playPauseBtn${trackNumber}" class="btn btn-primary">Play</button></li>
                    <li class="list-group-item"><input type="range" id="loudness${trackNumber}" value="50" /></li>
                    <li class="list-group-item"><button id="pitchDownBtn${trackNumber}" class="btn btn-secondary">Pitch Down</button></li>
                    <li class="list-group-item"><button id="pitchUpBtn${trackNumber}" class="btn btn-secondary">Pitch Up</button></li>
                </ul>
                <ul class="list-group list-group-horizontal">
                    <li class="list-group-item"><button id="downloadBtn${trackNumber}" class="btn btn-success">Download</button></li>
                    <li class="list-group-item"><p id="trackLength${trackNumber}">Track Length:</p></li>
                    <li class="list-group-item"><p id="trackKey${trackNumber}">Track Key: </p></li>
                    <li class="list-group-item"><p id="trackBPM${trackNumber}">Track BPM: </p></li>
                </div>
            </div>
        </div>
    `;

    trackContainer.appendChild(newTrackDiv);
}

const trackElements = document.querySelectorAll('.track');
trackElements.forEach((trackElement, index) => {
    createTrackCard(trackElement, index + 1);
});


const waveformElements = document.querySelectorAll('[id^="waveform"]');
        const numberOfWaveforms = waveformElements.length;
        const wavesurfers = [];

for (let i = 1; i <= numberOfWaveforms; i++) {
    const wavesurfer = WaveSurfer.create({
        container: `#waveform${i}`,
        responsive: true,
        height: 60,
        waveColor: 'violet',
        progressColor: 'purple',
    });

    wavesurfer.load(`./tracks/track${i}.mp3`);

    const playPauseBtn = document.getElementById(`playPauseBtn${i}`);
    playPauseBtn.addEventListener('click', () => {
        wavesurfer.playPause();
        playPauseBtn.innerText = wavesurfer.isPlaying() ? 'Pause' : 'Play';
    });

    const loudnessInput = document.getElementById(`loudness${i}`);
    loudnessInput.addEventListener('input', () => {
        wavesurfer.setVolume(loudnessInput.value / 100);
    });

    const pitchDownBtn = document.getElementById(`pitchDownBtn${i}`);
    pitchDownBtn.addEventListener('click', () => {
        wavesurfer.setPlaybackRate(wavesurfer.getPlaybackRate() - 0.1);
    });

    const pitchUpBtn = document.getElementById(`pitchUpBtn${i}`);
    pitchUpBtn.addEventListener('click', () => {
        wavesurfer.setPlaybackRate(wavesurfer.getPlaybackRate() + 0.1);
    });

    const downloadBtn = document.getElementById(`downloadBtn${i}`);
    downloadBtn.addEventListener('click', () => {    });


    // Track information (replace with actual data)
    const trackLength = document.getElementById(`trackLength${i}`);
    trackLength.innerText = 'Track Length: 3:45';

    const trackKey = document.getElementById(`trackKey${i}`);
    trackKey.innerText = 'Track Key: C Major';

    const trackBPM = document.getElementById(`trackBPM${i}`);
    trackBPM.innerText = 'Track BPM: 120';

    wavesurfers.push(wavesurfer);
    }