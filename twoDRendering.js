import { globals } from "./globals.js";

// 2D START PLAYBACK LOGIC --------------------------------------------------------------------
export function play() {
    globals.isPlaying = true;
    document.getElementById('twoD-play-pause').textContent = "Pause";

    globals.animationInterval = setInterval(() => {
        // Destructure globals object (redeclares variables). 
        const { ctx, canvas, imageObjects, frameCount } = globals;
        // Clear the canvas.
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw a stored image.
        ctx.drawImage(imageObjects[globals.frameIndex], 0, 0);
        // Increment frameIndex.
        globals.frameIndex = (globals.frameIndex + 1) % frameCount;

        // Adjust slider position.
        document.getElementById('twoD-slider').value = globals.frameIndex;
    }, 1000 / globals.fps);
}

// 2D HALT PLAYBACK LOGIC ----------------------------------------------------------------------
export function pause() {
    globals.isPlaying = false;
    document.getElementById('twoD-play-pause').textContent = "Play";

    if (globals.animationInterval) {
        clearInterval(globals.animationInterval);
        globals.animationInterval = null;
    }
}

// 2D DISABLE LOGIC ----------------------------------------------------------------------------
export function disableTwoD() {
    if (document.getElementById('twoD-canvas') != null) {
        pause();
        globals.isPlaying = false;
        globals.animationInterval = null;
        globals.ctx = null;
        globals.canvas = null;
        globals.imageObjects = null;
        document.getElementById('twoD-canvas').remove();
        document.getElementById('twoD-controls').style.display = "none";
        globals.is2dMode = false;
    }
}