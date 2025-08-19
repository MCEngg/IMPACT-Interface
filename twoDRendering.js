import { redrawAnnotations } from "./main_anno.js";
import { globals } from "./globals.js";
import { closeSliceViews } from "./sliceRendering.js";
import { drawBoundingBox } from "./box_anno.js";

// 2D DICOM VIDEO SLIDER LOGIC ----------------------------------------------------------------
document.getElementById('twoD-slider').addEventListener('input', async (event) => {
    pause();

    // Assign new frameIndex.
    globals.frameIndex = parseInt(event.target.value);

    await loadFrame(globals.frameIndex);
    preloadFrames(globals.frameIndex);
    evictCache();

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


// ARROW NAVIGATION LOGIC ----------------------------------------------------------------------
document.addEventListener('keydown', (event) => {

    if (!globals.selected_annotation) {

        if (event.key.includes("Arrow")) {
            pause();

            if (event.key == "ArrowRight" || event.key == "ArrowUp") globals.frameIndex += 1;

            else if (event.key == "ArrowLeft" || event.key == "ArrowDown") globals.frameIndex -= 1;

            if (globals.frameIndex < 0) globals.frameIndex = 0;
            if (globals.frameIndex > globals.frameCount - 1) globals.frameIndex = globals.frameCount - 1;

            document.getElementById('twoD-slider').value = globals.frameIndex;

            loadFrame(globals.frameIndex);
            preloadFrames(globals.frameIndex);
            evictCache();

            // Clear canvas and draw new image.
            globals.ctx.clearRect(0, 0, globals.canvas.width, globals.canvas.height);
            globals.ctx.drawImage(globals.imageObjects[globals.frameIndex], 0, 0);

            // Update frame label.
            document.getElementById('frameCounter').textContent = `Frame: ${globals.frameIndex + 1}/${globals.frameCount}`;

            if (globals.show_annotations) {
                // Draw all frame level annotations.
                redrawAnnotations();

                if (globals.multiBoxAnnotating && globals.multiPlaced) {
                    drawBoundingBox();
                }

            }
        }
    }

});


// SCOLL NAVIGATION LOGIC ----------------------------------------------------------------------
export function scroll_2d(event){
    pause();
    const delta = Math.sign(event.deltaY) * -1;

    globals.frameIndex += delta;

    if (globals.frameIndex < 0) globals.frameIndex = 0;
    if (globals.frameIndex > globals.frameCount - 1) globals.frameIndex = globals.frameCount - 1;

    document.getElementById('twoD-slider').value = globals.frameIndex;

    loadFrame(globals.frameIndex);
    preloadFrames(globals.frameIndex);
    evictCache();
    
    // Clear canvas and draw new image.
    globals.ctx.clearRect(0, 0, globals.canvas.width, globals.canvas.height);
    globals.ctx.drawImage(globals.imageObjects[globals.frameIndex], 0, 0);

    // Update frame label.
    document.getElementById('frameCounter').textContent = `Frame: ${globals.frameIndex + 1}/${globals.frameCount}`;

    if (globals.show_annotations) {
        // Draw all frame level annotations.
        redrawAnnotations();

        if (globals.multiBoxAnnotating && globals.multiPlaced) {
            drawBoundingBox();
        }

    }   

}

// 2D START PLAYBACK LOGIC --------------------------------------------------------------------
export function play() {
    globals.isPlaying = true;
    document.getElementById('twoD-play-pause').textContent = "Pause";

    globals.animationInterval = setInterval(async() => {
        
        // Destructure globals object (redeclares variables). 
        const { ctx, canvas, imageObjects, frameCount } = globals;

        // Ensure frames are loaded.
        await loadFrame(globals.frameIndex);

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

        // Preload frame buffer
        preloadFrames(globals.frameIndex, 5);
        evictCache();


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

// LOAD FRAME LOGIC --------------------------------------------------------------------------
export async function loadFrame(index){

    // Check to see if frame is already loaded.
    if(globals.imageObjects[index] != null){
        console.log("Returning");
        return;
    }
    
    // If we already have a url, reassign.
    if(globals.urls[index] != null){
        console.log("We already have a URL for this");
        // Create image and store.
        const img = new Image();
        globals.imageObjects[index] = img;

        return new Promise(resolve => {
            img.onload = resolve;
            img.src = globals.urls[index];
        });
    }

    // Grtab pixel array and create Blob.
    const frameBuffer = globals.pixelDataArrayBuffers[index];
    const blob = new Blob([frameBuffer], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);

    globals.urls[index] = url;

    // Create image and store.
    const img = new Image();
    globals.imageObjects[index] = img;

    return new Promise(resolve => {
        img.onload = resolve;
        img.src = url;
    });

}

// PRELOAD FRAME LOGIC ------------------------------------------------------------------------
export function preloadFrames(index, bufferSize = 5){
    
    // Load an area of 5 frames before and after current frame index.
    for(let i = -bufferSize; i <= bufferSize; i++){
        const preloadIndex = (index + i + globals.frameCount) % globals.frameCount;
        loadFrame(preloadIndex);
    }
}

// EVICT FRAME LOGIC --------------------------------------------------------------------------
export function evictCache(){

    // Loop through all frames.
    for (let i = 0; i < globals.frameCount; i++) {

        // If the frame is outside of a 5 perimeter cache revoke and set to null.
        if (i < globals.frameIndex - 5 || i > globals.frameIndex + 5) {

            if (globals.imageObjects[i]) {
                URL.revokeObjectURL(globals.urls[i]);
                globals.imageObjects[i].src = "";
                globals.imageObjects[i] = null;
                globals.urls[i] = null;
            }
        }
    }

}