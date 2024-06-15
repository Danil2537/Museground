function createBigTrackCard(trackContainer, trackNumber) 
{
  // Create a new div element
  const newTrackDiv = document.createElement('div');
  newTrackDiv.classList.add('row', 'row-cols-1', 'row-cols-md-2', 'row-cols-lg-3', 'g-4');

  // HTML structure for the track card
  newTrackDiv.innerHTML = `
      <div class="card h-100 w-100 bg-dark" style="color: #c7c7c7; margin-top: 50px;">
          <div class="card-body">
              <h5 class="card-title">Track Title ${trackNumber}</h5>
              <p class="card-text">Artist Name</p>
              <div id="waveform${trackNumber}" class="wave"></div>
              <ul class="controls list-group list-group-horizontal" style="padding: 10px 0px 5px 0px; display: flex">
                  <li class="list-group-item list-group-item-dark text-center"><button id="playPauseBtn${trackNumber}" class="btn btn-secondary">Play</button></li>
                  <li class="list-group-item list-group-item-dark text-center"><input type="range" id="loudness${trackNumber}" value="50" /></li>
                  <li class="list-group-item list-group-item-dark text-center"><button id="pitchDownBtn${trackNumber}" class="btn btn-secondary">Pitch Down</button></li>
                  <li class="list-group-item list-group-item-dark text-center"><button id="pitchUpBtn${trackNumber}" class="btn btn-secondary">Pitch Up</button></li>
              </ul>
              <ul class="list-group list-group-horizontal" style="padding: 10px 0px 5px 0px;">
                  <li class="list-group-item list-group-item-dark text-center"><button id="downloadBtn${trackNumber}" class="btn btn btn-secondary ">Download</button></li>
                  <li class="list-group-item list-group-item-dark text-center"><p id="trackLength${trackNumber}">Track Length:</p></li>
                  <li class="list-group-item list-group-item-dark text-center"><p id="trackKey${trackNumber}">Track Key: </p></li>
                  <li class="list-group-item list-group-item-dark text-center"><p id="trackBPM${trackNumber}">Track BPM: </p></li></ul>
              </div>
          </div>
      </div>
  `;

  trackContainer.appendChild(newTrackDiv);
}

function createSmallTrackCard(trackContainer, trackNumber)
{
  const OrderIndex = trackNumber+3;
  const newTrackDiv = document.createElement('div');
  newTrackDiv.classList.add('row', 'row-cols-1', 'row-cols-md-2', 'row-cols-lg-3', 'g-4');

  newTrackDiv.innerHTML = `
      <div class="card h-100 w-100 bg-dark" style="color: #c7c7c7; margin-top: 50px;">
          <div class="card-body">
              <h5 class="card-title">Track Title ${OrderIndex}</h5>
              <p class="card-text">Artist Name</p>
              <div id="waveform${OrderIndex}" class="wave"></div>
              <ul class="controls list-group list-group-horizontal" style="padding: 10px 0px 5px 0px>
                  <li class="list-group-item list-group-item-dark text-center"><button id="playPauseBtn${OrderIndex}" class="btn btn-secondary">Play</button></li>
                  <li class="list-group-item list-group-item-dark text-center"><input type="range" id="loudness${OrderIndex}" value="50" /></li>
                  <li class="list-group-item list-group-item-dark text-center"><p id="trackLength${OrderIndex}">Track Length:</p></li>
              </ul>
              <ul class="list-group list-group-horizontal" style="padding: 10px 0px 5px 0px;">
                  <li class="list-group-item list-group-item-dark text-center"><button id="downloadBtn${OrderIndex}" class="btn btn btn-secondary ">Download</button></li>
                  <li class="list-group-item list-group-item-dark text-center"><button id="pitchDownBtn${OrderIndex}" class="btn btn-secondary">Pitch Down</button></li>
                  <li class="list-group-item list-group-item-dark text-center"><button id="pitchUpBtn${OrderIndex}" class="btn btn-secondary">Pitch Up</button></li></ul>
                  <ul class="list-group list-group-horizontal" style="padding: 10px 0px 5px 0px;">
                  <li class="list-group-item list-group-item-dark text-center"><p id="trackKey${OrderIndex}">Track Key: </p></li>
                  <li class="list-group-item list-group-item-dark text-center"><p id="trackBPM${OrderIndex}">Track BPM: </p></li></ul>
              </div>
          </div>
      </div>
  `;

  trackContainer.appendChild(newTrackDiv);
}

const trackElements = document.querySelectorAll('.track-big');
trackElements.forEach((trackElement, index) => {
  createBigTrackCard(trackElement, index + 1);
});

const trackElementsSmall = document.querySelectorAll('.track-small');
trackElementsSmall.forEach((trackElement, index) => {
  createSmallTrackCard(trackElement, index + 1);
});


const waveformElements = document.querySelectorAll('[id^="waveform"]');
      const numberOfWaveforms = waveformElements.length;
      const wavesurfers = [];

for (let i = 1; i <= numberOfWaveforms; i++) {
  const wavesurfer = WaveSurfer.create({
      container: `#waveform${i}`,
      responsive: true,
      height: 60,
      dragToSeek: true,
      waveColor: '#00F0FF',
      progressColor: '#0070FF',
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
  trackLength.innerText = 'Length: 2:45';

  const trackKey = document.getElementById(`trackKey${i}`);
  trackKey.innerText = 'Key: C Minor';

  const trackBPM = document.getElementById(`trackBPM${i}`);
  trackBPM.innerText = 'BPM: 120';

  wavesurfers.push(wavesurfer);
  }