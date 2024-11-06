let currentSong = new Audio();
let songs;
let currentFolder;

function formatTime(seconds) {
    // Calculate minutes and remaining seconds
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    // Pad with leading zeros if needed
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}


async function getSongs(folder) {
    currentFolder = folder;
    let a = await fetch(`${folder}/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName("a")
    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }
    }

    // Show all the songs in the playlist
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `<li> 
                            <img class="invert" src="img/music.svg" alt="">
                            <div class="info">
                                <div>${decodeURI(song)}</div>
                                <div>Unknown&nbspArtist</div>
                            </div>
                            <div class="playnow">
                                <span>Play&nbspNow</span>
                            <img class="invert" src="img/play.svg" alt="">
                            </div>  </li>`;
    }

    // Attach an event listener to each song
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim())
        })
    })

    return songs
}

const playMusic = (track, pause = false) => {
    // let audio = new Audio("/songs/" + track)
    currentSong.src = `/${currentFolder}/` + track
    if (!pause) {
        currentSong.play()
        play.src = "img/pause.svg"
    }
    document.querySelector(".songInfo").innerHTML = decodeURI(track)
    document.querySelector(".songTime").innerHTML = "00:00 / 00:00"
}

async function displayAlbums() {
    try {
        let response = await fetch(`/songs/`);
        if (!response.ok) throw new Error(`Network response was not ok (${response.status})`);

        let textResponse = await response.text();
        let div = document.createElement("div");
        div.innerHTML = textResponse;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");
        let array = Array.from(anchors);

        for (let index = 0; index < array.length; index++) {
            const e = array[index];
            let href = e.href;


            // Only consider folders (not files) that contain valid folder names
            if (href.includes("/songs/") && !href.endsWith(".txt") && !href.endsWith(".html") && !href.endsWith(".json")) {
                // Extract the folder name correctly
                let urlParts = href.split("/");
                let folder = urlParts[urlParts.length - 1]; // Get the last segment that should be the folder name


                // Check if the folder name is valid before fetching info
                if (folder) {
                    
                    let a = await fetch(`/songs/${folder}/info.json`);
                    if (!a.ok) {
                        const text = await a.text();
                        continue; // Continue to the next album instead of returning
                    }

                    let infoResponse = await a.json();
                    cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50" height="50">
                                <circle cx="25" cy="25" r="22" class="circle" />
                                <g transform="translate(14,12)">
                                    <path d="M6 4L18 12L6 20V4Z" class="play-button" />
                                </g>
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jfif" alt="">
                        <h2>${infoResponse.title}</h2>
                        <p>${infoResponse.description}</p>
                    </div>`;
                }
            }
        }

        // Load a playlist when card is clicked
        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async item => {
                songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
                playMusic(songs[0]);
            });
        });
    } catch (error) {
        console.error("Failed to display albums:", error);
    }
}


async function main() {
    // To get the list of all songs
    await getSongs("songs/ncs")
    playMusic(songs[0], true)

    // Display all the albums on the page
    await displayAlbums()


    // Attach an event listener to play, next and previous button
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play()
            play.src = "img/pause.svg"
        } else {
            currentSong.pause()
            play.src = "img/play.svg"
        }
    })

    // Listen for timeUpdate event
    currentSong.addEventListener("timeupdate", () => {

        const currentTime = Math.floor(currentSong.currentTime);
        const duration = isNaN(currentSong.duration) ? 0 : Math.floor(currentSong.duration);

        document.querySelector(".songTime").innerHTML = `${formatTime(currentTime)} / ${formatTime(duration)}`
        document.querySelector(".seekbarCircle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%"
    })

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".seekbarCircle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100
    })

    // Open the sidebar when the hamburger is clicked
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"; // Bring the sidebar into view
    });

    // Close the sidebar when the close button is clicked
    document.querySelector(".close img").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-110%";
    });

    // Add an event listenser to previous and next button
    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").splice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })


    next.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").splice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
    })


    // Add an event to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100
    })


    // Add event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", e=>{
        if(e.target.src.includes("img/volume.svg")){
            e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg")
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else{
            e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg")
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })

    
}

main()