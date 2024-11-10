// true if click to play, false if hover to play
var clickToPlay = false;
// play button has some bugs, so we are disabling it for now
var playButtonEnabled = false;

const replacedSrc = "https://instagram-caption-tool.s3.us-east-1.amazonaws.com/GifDisablerLogo512.png";
const playButtonSrc = "https://instagram-caption-tool.s3.us-east-1.amazonaws.com/chat-01.png";
const pauseButtonSrc = "https://instagram-caption-tool.s3.us-east-1.amazonaws.com/chat-02.png";


function findAllGifsOnPage() {
    var allGifs = document.querySelectorAll('img[src*=".gif"]');
    return allGifs;
}

function createPlayButton(parentNode, gifWidth, gifHeight, src) {
    var playButton = document.createElement('img');
    parentNode.appendChild(playButton);

    playButton.src = src;
    playButton.width = gifWidth * 0.2;
    playButton.height = gifHeight * 0.2;
    
    playButton.style.position = "absolute";
    playButton.style.top = "50%";
    playButton.style.left = "50%";
    playButton.style.transform = "translate(-50%, -50%)";
    playButton.style.zIndex = "2";
    playButton.style.cursor = "pointer";
    playButton.style.opacity = "1.0";
    playButton.style.transition = "opacity 0.3s";
    playButton.classList.add("play-button-disable-auto-play");

    parentNode.addEventListener("mouseover", function() {
        playButton.style.opacity = "0.5";
    });

    parentNode.addEventListener("mouseout", function() {
        if (isPlaying(parentNode)) {
            playButton.style.opacity = "0";
        } else {
            playButton.style.opacity = "1.0";
        }
    });

    return playButton;
}

function createGifParent(gifWidth, gifHeight, replacedSrc) {
    var parent = document.createElement('div');
    var img = document.createElement('img');
    img.src = replacedSrc;
    img.width = gifWidth;
    img.height = gifHeight;
    img.style.position = "relative";
    img.style.zIndex = "1";
    img.style.cursor = "pointer";
    img.style.opacity = "1.0";
    img.style.transition = "opacity 0.3s";
    // add class to child img so we can find it later
    img.classList.add("image-disable-auto-play");

    parent.appendChild(img);

    return parent;
}

function isPlaying(parentNode) {
    return !parentNode.classList.contains("not-playing-gif");
}

function startPlaying(parentNode, originalSrc) {
    // find child img through the class it has
    var img = parentNode.querySelector(".image-disable-auto-play");
    img.src = originalSrc;
    parentNode.classList.remove("not-playing-gif");
    parentNode.classList.add("playing-gif");

    if (clickToPlay && playButtonEnabled) {
        var playButton = parentNode.querySelector(".play-button-disable-auto-play");
        playButton.src = pauseButtonSrc;
        playButton.style.opacity = "0.5";
    }
}

function stopPlaying(parentNode, replacedSrc) {
    // find child img through the class it has
    var img = parentNode.querySelector(".image-disable-auto-play");
    img.src = replacedSrc;
    parentNode.classList.add("not-playing-gif");
    parentNode.classList.remove("playing-gif");

    if (clickToPlay && playButtonEnabled) {
        var playButton = parentNode.querySelector(".play-button-disable-auto-play");
        playButton.src = playButtonSrc;
    }
}

function onImageLoad(gif) {
    const originalSrc = gif.src;
    const gifWidth = gif.width;
    const gifHeight = gif.height;

    // create new image element with a play button over it that plays the gif on click
    var gifParent = gif.parentNode;
    var newParent = createGifParent(gifWidth, gifHeight, replacedSrc);
    var imgChild = newParent.querySelector("img");

    // replace the gif with the new container div that will hold the gif and the play button
    if (gifParent) {
        // because we are observing the body for mutations, we need to check if the gif is already replaced
        // otherwise, we risk entering an infinite loop where the gif just keeps getting replaced
        if (gifParent.classList.contains("not-playing-gif") || gifParent.classList.contains("playing-gif")) {
            return;
        }
        gifParent.replaceChild(newParent, gif);
    } else {
        console.log("no parent found");
    }
    
    // if the user can click on a gif to start/stop playint it
    if (clickToPlay) {
        if (playButtonEnabled) {
            createPlayButton(newParent, gifWidth, gifHeight, playButtonSrc);
        }

        newParent.addEventListener("click", function(event) {
            event.stopImmediatePropagation();

            if (isPlaying(newParent)) {
                stopPlaying(newParent, replacedSrc);
            } else {
                startPlaying(newParent, originalSrc);
            }
        });
    } else {
        // otherwise play on hover
        imgChild.addEventListener("mouseover", function() {
            startPlaying(newParent, originalSrc);
        });

        imgChild.addEventListener("mouseout", function() {
            stopPlaying(newParent, replacedSrc);
        });
    }

    stopPlaying(newParent, replacedSrc);
}

// update variables when the extension is first loaded
function getInitialVariables() {
    chrome.storage.sync.get(["playOnHoverToggle"], function(data){
        if (data.playOnHoverToggle === false) {
            clickToPlay = true;
        }
    });
}

function replaceGifsWithImages(gifs) {
    gifs.forEach(function(gif) {
        if (gif.complete) {
            onImageLoad(gif);
            return;
        } else {
            gif.onload = function() {
                onImageLoad(gif);
            }
        }
    });
}

// listen for page mutations so we can replace gifs that are added after the page has loaded
function startListeningForPageMutations(callback) {
    var targetNode = document.body;

    // Options for the observer (which mutations to observe)
    var config = { attributes: false, childList: true, subtree: true };

    // Create an observer instance linked to the callback function
    var observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
}

function findAndRemoveGifs() {
  gifs = findAllGifsOnPage();
  replaceGifsWithImages(gifs);
}

function main() {
    getInitialVariables();
    
    // check if the extension is disabled before running
    chrome.storage.sync.get(["gifExtensionDisabled"]).then(async (items) => {
        if (!items || !items.gifExtensionDisabled || items.gifExtensionDisabled === false) {
            findAndRemoveGifs();
            startListeningForPageMutations(function(mutationsList, observer) {
                findAndRemoveGifs();
            });
        }
    });
}

console.log("running gif replacer");
main();
