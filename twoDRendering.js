import { redrawAnnotations } from "./main_anno.js";
import { globals } from "./globals.js";
import { closeSliceViews } from "./sliceRendering.js";
import { drawBoundingBox } from "./box_anno.js";

// 2D DICOM VIDEO SLIDER LOGIC ----------------------------------------------------------------
document.getElementById('twoD-slider').addEventListener('input', (event) => {
    pause();

    // Assign new frameIndex.
    globals.frameIndex = parseInt(event.target.value);

    // Clear canvas and draw new image.
    globals.ctx.clearRect(0, 0, globals.canvas.width, globals.canvas.height);
    globals.ctx.drawImage(globals.imageObjects[globals.frameIndex], 0, 0);

    // Update frame label.
    document.getElementById('frameCounter').textContent = `Frame: ${globals.frameIndex+1}/${globals.frameCount}`;

    if(globals.show_annotations){
        // Draw all frame level annotations.
        redrawAnnotations();

        if(globals.multiBoxAnnotating && globals.multiPlaced){
            drawBoundingBox();
        }

    }

});

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

        // Adjust frame Counter.
        document.getElementById('frameCounter').textContent = `Frame: ${globals.frameIndex+1}/${frameCount}`;

        // Adjust slider position.
        document.getElementById('twoD-slider').value = globals.frameIndex;

        if (globals.show_annotations) {
            // Draw all frame level annotations.
            redrawAnnotations();
        }
    }, 1000 / globals.fps);
}

// 2D HALT PLAYBACK LOGIC ----------------------------------------------------------------------
export function pause() {
    globals.isPlaying = false;
    document.getElementById('twoD-play-pause').textContent = "Play ";

    if (globals.animationInterval) {
        clearInterval(globals.animationInterval);
        globals.animationInterval = null;
    }
}

// 2D DISABLE LOGIC ----------------------------------------------------------------------------
export function disableTwoD() {
    if (document.getElementById('twoD-canvas') != null) {
        
        // Pause video.
        pause();

        // Reset constants.
        globals.isPlaying = false;
        globals.animationInterval = null;
        globals.ctx = null;
        globals.canvas = null;
        globals.imageObjects = null;
        
        // Remove canvas, controls, and annotations.
        document.getElementById('twoD-canvas').remove();
        document.getElementById('annotation-canvas').remove();
        document.getElementById('twoD-controls').style.display = "none";
        document.getElementById('twoD-main-container').style.display = "none";
        document.getElementById('annotation-details').style.display = "none";
        document.getElementById('vol-slice-grid').style.display = "grid";
        globals.is2dMode = false;

        closeSliceViews(document.getElementById('vtk-vol_container'),document.getElementById('slice-sliders'));
        
    }
}

// 2D FPS SELECTOR LOGIC -----------------------------------------------------------------------
document.getElementById('fps-Selector').addEventListener('change', () => {
    // Set new FPS.
    globals.fps = document.getElementById('fps-Selector').value;

    if(globals.isPlaying){
        // Pause then play to reset looping interval.
        pause();
        play();
    }

});

// 2D DICOM PLAY/PAUSE BUTTON LOGIC ----------------------------------------------------------
document.getElementById('twoD-play-pause').addEventListener("click", () => {
    if (globals.isPlaying) pause();
    else if (!globals.isPlaying && !globals.annotating) play();
});

// RECOVER FRAME MEMORY LOGIC ----------------------------------------------------------------
export function clearFrameMemory(){
    
    // Dereference all imageObjects.
    if (globals.imageObjects) {
        globals.imageObjects.forEach((img, i) => {
            globals.imageObjects[i] = null;
        });
        globals.imageObjects = null;
    }

    // Revoke all URLs for images.
    if (globals.urls) {
        globals.urls.forEach(url => {
            URL.revokeObjectURL(url); 
        });
        globals.urls.length = 0;
        globals.urls = null;
    }
}