import { globals } from "./globals.js";
import { determineAnnotationMode, annotations, movement, move_bounds, redrawAnnotations, addAnnotationLog } from "./main_anno.js";
import { pause } from "./twoDRendering.js";


export const boxAnno_coords = {
    box_X: 0,
    box_Y: 0,
    box_width: 0,
    box_height: 0,
}

// DRAW BOUNDING BOX ANNOTATION LOGIC ----------------------------------------------------------
export function drawBoundingBox(){
    const ctx = globals.annotation_ctx;
    ctx.beginPath();
    ctx.rect(boxAnno_coords.box_X, boxAnno_coords.box_Y, boxAnno_coords.box_width, boxAnno_coords.box_height);
    ctx.strokeStyle = "red";
    ctx.stroke();
}

// INTERMITANT BOX ANIMATION LOGIC -------------------------------------------------------------
export function mouseMoveBoxAnnotate(event){
    redrawAnnotations();

    const mouseX = (event.clientX - globals.rect.left) * globals.scaleX;
    const mouseY = (event.clientY - globals.rect.top) * globals.scaleY;

    const ctx = globals.annotation_ctx;

    ctx.beginPath();
    ctx.rect(boxAnno_coords.box_X, boxAnno_coords.box_Y, (mouseX - boxAnno_coords.box_X), (mouseY - boxAnno_coords.box_Y));
    ctx.strokeStyle = "red";
    ctx.stroke();
}

// ANNOTATE BOXES LOGIC ------------------------------------------------------------------------
export function annotateBoxes(event){
    
    const mouseX = (event.clientX - globals.rect.left) * globals.scaleX;
    const mouseY = (event.clientY - globals.rect.top) * globals.scaleY;

    // If bounds selected is 0 (none selected), assign box coordinates.
    if (!globals.box_bounds_selected) {
        // Log the starting coordinates.
        boxAnno_coords.box_X = mouseX;
        boxAnno_coords.box_Y = mouseY;

        // Indicate that they are logged.
        globals.box_bounds_selected++;

        // Add event listener to track the rect when mouse is dragged on screen.
        globals.annotation_canvas.addEventListener('mousemove', mouseMoveBoxAnnotate);

        globals.multiPlaced = false;
    }
    // If one bound is already selected, assign the width and height, reset selected counter.
    else {
        // Stop dynamic drawing and redraw annotations.
        globals.annotation_canvas.removeEventListener('mousemove', mouseMoveBoxAnnotate);

        // Get width and height.
        boxAnno_coords.box_width = mouseX - boxAnno_coords.box_X;
        boxAnno_coords.box_height = mouseY - boxAnno_coords.box_Y;
        globals.box_bounds_selected = 0;

        if(boxAnno_coords.box_height == 0 || boxAnno_coords.box_width == 0) return;

        // If the multiframe is activated jump to a different function to handle.
        if(globals.multiBoxAnnotating){
            globals.multiPlaced = true;
            globals.start_frame = globals.frameIndex;
            console.log(`Starting Frame: ${globals.start_frame+1}`);
            document.addEventListener('keyup', multiFrame);
            
            return;
        }

        // Save record of the box.
        annotations.push({
            type: "box",
            annotation_name: "test_box",
            frame: (globals.frameIndex+1),
            id: `B${globals.box_id}`,
            abnormal: "NL",
            x: boxAnno_coords.box_X,
            y: boxAnno_coords.box_Y,
            width: boxAnno_coords.box_width,
            height: boxAnno_coords.box_height
        });

        console.log(annotations);

        addAnnotationLog("box");
        redrawAnnotations();

    }
}

// MULTIFRAME BOX PLACEMENT LOGIC --------------------------------------------------------------
export function multiFrame(event){
    // Log the current slider frame position. Wait for user to press a certain button, log that position.
    // For the amount of frames in between, calculate the difference and push the appropriate annotations in to the system.
    // Everything should be stored in the box_anno object. Remember to increment the ids correctly.

    if(event.key == "m"){
        let end_frame = globals.frameIndex;
        let start = 0;
        let end = 0;


        if (globals.start_frame > end_frame){
            start = end_frame;
            end = globals.start_frame; 
        }
        else{
            start = globals.start_frame;
            end = end_frame;
        }

        console.log(`Adding ${Math.abs(start - end)} annotations, from ${start} to ${end}`);


        for(let i = start; i < end + 1; i++){
            annotations.push({
                type: "box",
                annotation_name: "multi_test_box",
                frame: (i + 1),
                id: `B${globals.box_id}`,
                abnormal: "NL",
                x: boxAnno_coords.box_X,
                y: boxAnno_coords.box_Y,
                width: boxAnno_coords.box_width,
                height: boxAnno_coords.box_height
            });

            addAnnotationLog("multiBox");

            globals.box_id += 1;

        }

    }

    globals.multiPlaced = false;
    document.removeEventListener('keyup', multiFrame);

    redrawAnnotations();

}



// BOUNDING BOX BUTTON LOGIC -------------------------------------------------------------------
document.getElementById('bounding-box-button').addEventListener('click', async(event) => {
    console.log("BOUNDING BOX ANNOTATION MODE");

    // Dont do anything if already annotating.
    if(globals.annotating) return;

    // Set annotating status.
    globals.boxAnnotating = true;
    determineAnnotationMode();
    pause();

});

// MULTI-BOUNDING BOX BUTTON LOGIC --------------------------------------------------------------
document.getElementById('bounding-multi-frame').addEventListener('click', async(event) => {
    console.log("MULTI BOX FRAME ANNOTATION MODE");

    if(globals.annotating) return;

    globals.multiBoxAnnotating = true;
    determineAnnotationMode();
    pause();

});


// BOUNDING BOX BOUND MOVEMENT LOGIC ------------------------------------------------------------
export function moveBoxBounds(event) {

    let designator = globals.modif_anno_info[5];

    const mouseX = (event.clientX - globals.rect.left) * globals.scaleX;
    const mouseY = (event.clientY - globals.rect.top) * globals.scaleY;

    let deltaX = mouseX - globals.lastMouseX;
    let deltaY = mouseY - globals.lastMouseY;

    globals.lastMouseX = mouseX;
    globals.lastMouseY = mouseY;

    let xcoord = globals.modif_anno_info[0];
    let ycoord = globals.modif_anno_info[1];
    let width = globals.modif_anno_info[2];
    let height = globals.modif_anno_info[3];

    let left_coord = Math.min(xcoord, (xcoord + width));
    let right_coord = Math.max(xcoord, (xcoord + width));
    let top_coord = Math.min(ycoord, (ycoord + height));
    let bottom_coord = Math.max(ycoord, (ycoord + height));

    if (designator.includes('l')) left_coord += deltaX;
    if (designator.includes('r')) right_coord += deltaX;
    if (designator.includes('t')) top_coord += deltaY;
    if (designator.includes('b')) bottom_coord += deltaY;

    // Convert back to origin dependant coordinates.
    xcoord = left_coord;
    ycoord = top_coord;
    width = right_coord - left_coord;
    height = bottom_coord - top_coord;

    globals.modif_anno_info[0] = xcoord;
    globals.modif_anno_info[1] = ycoord;
    globals.modif_anno_info[2] = width;
    globals.modif_anno_info[3] = height;

    // Change Coordinates.
    for (let i = 0; i < annotations.length; i++) {
        if (annotations[i].id == globals.anno_designator) {
            annotations[i].x = xcoord;
            annotations[i].y = ycoord;
            annotations[i].width = width;
            annotations[i].height = height;
        }
    }

    redrawAnnotations();

}

// MOVING BOX BOUNDS RELEASE LOGIC -------------------------------------------------------------
export function setBoundsAnnotation(event) {
    globals.annotation_canvas.removeEventListener('mousemove', move_bounds);
    globals.annotation_canvas.removeEventListener('mouseup', setBoundsAnnotation);
    document.body.style.cursor = "default";
}

// MOVING BOX MANIPULATION LOGIC ---------------------------------------------------------------
export function moveBoxAnnotation(event, originX, originY) {
    
    // Move the box according to the mouse movement.
    const mouseX = (event.clientX - globals.rect.left) * globals.scaleX;
    const mouseY = (event.clientY - globals.rect.top) * globals.scaleY;

    // Compute gap and new coordinates.
    // Note that negative means left or up. Positive means right or down.
    const x_gap = mouseX - originX;
    const y_gap = mouseY - originY;

    // Annotation Details.
    const xcoord = globals.modif_anno_info[0];
    const ycoord = globals.modif_anno_info[1];
    const width = globals.modif_anno_info[2];
    const height = globals.modif_anno_info[3];

    // Canvas Maxs.
    const canvas_xmax = globals.annotation_canvas.width;
    const canvas_ymax = globals.annotation_canvas.height;

    // New Coordinates.
    let new_x = xcoord + x_gap;
    let new_y = ycoord + y_gap;

    // OBR
    if (globals.modif_anno_info[4] == 0) {

        // Right Bound Checks.
        if (new_x > canvas_xmax) new_x = canvas_xmax;

        // Bottom Bound Checks.
        if (new_y > canvas_ymax) new_y = canvas_ymax;

        // Top Bound Checks.
        if ((new_y + height) < 0) new_y = (-1 * height);

        // Left Bound Checks.
        if ((new_x + width) < 0) new_x = (-1 * width);

    }

    // OTR
    if (globals.modif_anno_info[4] == 1) {

        // Right Bound Checks.
        if (new_x > canvas_xmax) new_x = canvas_xmax;

        // Bottom Bound Checks.
        if ((new_y + height) > canvas_ymax) new_y = (canvas_ymax - height);

        // Top Bound Checks.
        if (new_y < 0) new_y = 0;

        // Left Bound Checks.
        if ((new_x + width) < 0) new_x = (-1 * width);

    }

    // OBL
    if (globals.modif_anno_info[4] == 2) {

        // Right Bound Checks.
        if ((new_x + width) > canvas_xmax) new_x = (canvas_xmax - width);

        // Bottom Bound Checks.
        if (new_y > canvas_ymax) new_y = canvas_ymax;

        // Top Bound Checks.
        if ((new_y + height) < 0) new_y = (-1 * height);

        // Left Bound Checks.
        if (new_x < 0) new_x = 0;

    }

    // OTL
    if (globals.modif_anno_info[4] == 3) {

        // Right Bound Checks.
        if ((new_x + width) > canvas_xmax) new_x = (canvas_xmax - width);

        // Bottom Bound Checks.
        if ((new_y + height) > canvas_ymax) new_y = (canvas_ymax - height);

        // Top Bound Checks.
        if (new_y < 0) new_y = 0;

        // Left Bound Checks.
        if (new_x < 0) new_x = 0;

    }

    // Change Coordinates.
    for (let i = 0; i < annotations.length; i++) {
        if (annotations[i].id == globals.anno_designator) {
            annotations[i].x = new_x;
            annotations[i].y = new_y;
        }
    }

    redrawAnnotations();

}

// MOVING BOX RELEASE LOGIC --------------------------------------------------------------------
export function setMovedBoxAnnotation(event) {
    globals.annotation_canvas.removeEventListener('mousemove', movement);
    globals.annotation_canvas.removeEventListener('mouseup', setMovedBoxAnnotation);
    document.body.style.cursor = "default";

}

// MOUSE IN BORDER BOUNDS DETECTION LOGIC ------------------------------------------------------
export function boxBoundsDetection(mouseX, mouseY) {

    let xcoord = 0;
    let ycoord = 0;
    let width = 0;
    let height = 0;
    let tol = 10;

    for (let i = 0; i < annotations.length; i++) {
        if (annotations[i].id == globals.anno_designator) {
            xcoord = annotations[i].x;
            ycoord = annotations[i].y;
            width = annotations[i].width;
            height = annotations[i].height;
        }
    }

    globals.modif_anno_info = [xcoord, ycoord, width, height, null, null];

    // OBR: 0
    // OTR: 1
    // OBL: 2
    // OTL: 3

    if (width < 0 && height < 0) globals.modif_anno_info[4] = 0;
    if (width < 0 && height > 0) globals.modif_anno_info[4] = 1;
    if (width > 0 && height < 0) globals.modif_anno_info[4] = 2;
    if (width > 0 && height > 0) globals.modif_anno_info[4] = 3;

    const left = Math.min(xcoord, (xcoord + width));
    const right = Math.max(xcoord, (xcoord + width));
    const top = Math.min(ycoord, (ycoord + height));
    const bottom = Math.max(ycoord, (ycoord + height));

    const insideX = ((mouseX >= left + 5) && (mouseX <= right - 5));
    const insideY = ((mouseY >= top + 5) && (mouseY <= bottom - 5));

    const nearLeft = (Math.abs(mouseX - left) <= tol);
    const nearRight = (Math.abs(mouseX - right) <= tol);
    const nearTop = (Math.abs(mouseY - top) <= tol);
    const nearBottom = (Math.abs(mouseY - bottom) <= tol);

    globals.modif_anno_info[5] = "out";

    if (nearLeft && nearTop) {
        globals.modif_anno_info[5] = "tlc";
        document.body.style.cursor = "nw-resize";
        // console.log("tlc");// Top Left Corner.
    }

    if (nearRight && nearTop) {
        globals.modif_anno_info[5] = "trc";
        document.body.style.cursor = "ne-resize";
        // console.log("trc");// Top Right Corner.
    }

    if (nearLeft && nearBottom) {
        globals.modif_anno_info[5] = "blc";
        document.body.style.cursor = "ne-resize";
        // console.log("blc");// Bottom Left Corner.
    }

    if (nearRight && nearBottom) {
        globals.modif_anno_info[5] = "brc";
        document.body.style.cursor = "nw-resize";
        // console.log("brc");// Bottom Right Corner.
    }

    if (nearTop && insideX) {
        globals.modif_anno_info[5] = "t";
        document.body.style.cursor = "n-resize";
        // console.log("tb");// Top Bound.
    }

    if (nearBottom && insideX) {
        globals.modif_anno_info[5] = "b";
        document.body.style.cursor = "n-resize";
        // console.log("bb");// Bottom Bound.
    }

    if (nearLeft && insideY) {
        globals.modif_anno_info[5] = "l";
        document.body.style.cursor = "w-resize";
        // console.log("lb");// Left Bound.
    }

    if (nearRight && insideY) {
        globals.modif_anno_info[5] = "r";
        document.body.style.cursor = "w-resize";
        // console.log("rb");// Right Bound.
    }

    if (insideX && insideY) {
        globals.modif_anno_info[5] = "inside"; // Inside Box.
    }

    return;
}