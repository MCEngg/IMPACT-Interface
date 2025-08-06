import { globals } from "./globals.js";
import { pause, play } from "./twoDRendering.js";

export const boxAnno_coords = {
    box_X: 0,
    box_Y: 0,
    box_width: 0,
    box_height: 0,
}

// Main annotation list will contain objects consisting of annotation data.
// Scheme: [annotate_type, annotation_name, frame, data]
// Box Annotation: {type: box, 
//                  annotation_name: box_name, 
//                  frame: frame,
//                  id: Bid 
//                  abnormal: "NL",
//                  x: xcoord, 
//                  y: ycoord, 
//                  width: width, 
//                  height: height}

export const annotations = [];
let selected_row = null;

// DETERMINE ANNOTATION MODE LOGIC -------------------------------------------------------------
export function determineAnnotationMode(){

    // If not already annotating and the box annotation is active.
    if(!globals.annotating && globals.boxAnnotating){
        globals.annotation_canvas.addEventListener('click', annotateBoxes);
        globals.annotating = true;
        document.getElementById('warningLog').textContent = "WARNING: Box Annotation Activated"
    }
    
}

// DRAW BOUNDING BOX ANNOTATION LOGIC ----------------------------------------------------------
export function drawBoundingBox(){
    const ctx = globals.annotation_ctx;
    ctx.beginPath();
    ctx.rect(boxAnno_coords.box_X, boxAnno_coords.box_Y, boxAnno_coords.box_width, boxAnno_coords.box_height);
    ctx.strokeStyle = "red";
    ctx.stroke();
}

// REDRAW ANNOTATION LOGIC ---------------------------------------------------------------------
export function redrawAnnotations(){
    const ctx = globals.annotation_ctx;

    // Clear old canvas.
    ctx.clearRect(0, 0, globals.annotation_canvas.width, globals.annotation_canvas.height);

    // If annotations shouldnt be shown, exit early to prevent drawing.
    if (!globals.show_annotations) return;

    // Go through all annotations.
    for(let i = 0; i < annotations.length; i++){
        
        const anno = annotations[i];
        const annotated_frame = anno.frame;
        const cur_frame = globals.frameIndex + 1;

        // If the current frame being displayed matches with the annotation, display the annotation.
        if(annotated_frame == cur_frame){

            // If an annotation is selected and is found.
            if (globals.selected_annotation && (globals.anno_designator == annotations[i].id)) ctx.strokeStyle = "blue";
            else ctx.strokeStyle = "red";
            
            // Box Annotation
            if (anno.type == "box") {
                ctx.beginPath();
                ctx.rect(anno.x, anno.y, anno.width, anno.height);
                // ctx.strokeStyle = "red";
                ctx.stroke();
            }
        }


        

    }

}

// INTERMITANT BOX ANIMATION LOGIC -------------------------------------------------------------
export function mouseMoveBoxAnnotate(event){
    redrawAnnotations();

    const rect = globals.annotation_canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const ctx = globals.annotation_ctx;

    ctx.beginPath();
    ctx.rect(boxAnno_coords.box_X, boxAnno_coords.box_Y, (mouseX - boxAnno_coords.box_X), (mouseY - boxAnno_coords.box_Y));
    ctx.strokeStyle = "red";
    ctx.stroke();
}

// ANNOTATE BOXES LOGIC -----------------------------------------------------------------------
export function annotateBoxes(event){
    const rect = globals.annotation_canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // If bounds selected is 0 (none selected), assign box coordinates.
    if (!globals.bounds_selected) {
        // Log the starting coordinates.
        boxAnno_coords.box_X = mouseX;
        boxAnno_coords.box_Y = mouseY;

        // Indicate that they are logged.
        globals.bounds_selected++;

        // Add event listener to track the rect when mouse is dragged on screen.
        globals.annotation_canvas.addEventListener('mousemove', mouseMoveBoxAnnotate);

    }
    // If one bound is already selected, assign the width and height, reset selected counter.
    else {
        // Stop dynamic drawing and redraw annotations.
        globals.annotation_canvas.removeEventListener('mousemove', mouseMoveBoxAnnotate);

        // Get width and height.
        boxAnno_coords.box_width = mouseX - boxAnno_coords.box_X;
        boxAnno_coords.box_height = mouseY - boxAnno_coords.box_Y;
        globals.bounds_selected = 0;

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

        // Draw Box.
        drawBoundingBox();
    }
}

// ADD ANNOTATION LOG LOGIC -------------------------------------------------------------------
export function addAnnotationLog(type){
    
    // Table Operations.
    const annotation_table = document.getElementById('annotation-table');
    const new_row = annotation_table.insertRow(annotation_table.length);

    // Insert new Cells.
    const type_cell = new_row.insertCell(0);
    const name_cell = new_row.insertCell(1);
    const id_cell = new_row.insertCell(2);
    const frame_cell = new_row.insertCell(3);
    const abnormal_cell = new_row.insertCell(4);

    // ABN Selectors.
    const abn_options = [
        "ABN",
        "NL",
    ];

    const abn_selector = document.createElement("select");

    abn_options.forEach((option) => {
        const selectOptions = document.createElement("option");
        selectOptions.value = option.toLowerCase();
        selectOptions.textContent = option;
        
        if(option == "NL") selectOptions.selected = true;
        
        abn_selector.appendChild(selectOptions);

    });

    abnormal_cell.appendChild(abn_selector);

    // Make Cells editible.
    name_cell.contentEditable = "plaintext-only";
    abnormal_cell.contentEditable = "plaintext-only";

    // Cell formats.
    id_cell.style['text-align'] = "center";
    frame_cell.style['text-align'] = "center";
    abnormal_cell.style['text-align'] = "center";

    // Alter cell text.
    type_cell.innerHTML = `${type}`;
    name_cell.innerHTML = "test_box";
    id_cell.innerHTML = `B${globals.box_id}`;
    frame_cell.innerHTML = `${globals.frameIndex + 1}`;

    new_row.style.border = "1px solid white";

    annotation_table.style.border = "1px solid white";
    annotation_table.style["border-collapse"] = "collapse";

    globals.box_id = globals.box_id + 1;
}

// BOUNDING BOX BUTTON LOGIC ------------------------------------------------------------------ 
document.getElementById('bounding-box-button').addEventListener('click', async(event) => {
    console.log("BOUNDING BOX ANNOTATION MODE");

    // Dont do anything if already annotating.
    if(globals.annotating) return;

    // Set annotating status.
    globals.boxAnnotating = true;
    determineAnnotationMode();
    pause();

});


// APP KEY PRESS LOGIC ------------------------------------------------------------------------
document.addEventListener('keyup', (event) => {
    
    // console.log(event.key);

    // Pause/Play Space Bar Shortcut.
    if(event.key == " " && globals.is2dMode && !globals.annotating){
        if(globals.isPlaying) pause();
        else play();
    }

    // Box Annotation Abort.
    if(event.key == "Escape" && globals.boxAnnotating){

        console.log('Abort Box Annotation');
        // Reset indicators.
        globals.annotating = false;
        globals.boxAnnotating = false;
        globals.bounds_selected = 0;
        
        // Reset Warning Log.
        document.getElementById('warningLog').textContent = "";

        // Remove event listeners.
        globals.annotation_canvas.removeEventListener('mousemove', mouseMoveBoxAnnotate);
        globals.annotation_canvas.removeEventListener('click', annotateBoxes);
        
        // Redraw pre-existing annotations.
        redrawAnnotations();
    }

    // Box Annotation Shortcut.
    if(event.key == "b" && !globals.boxAnnotating){
        globals.boxAnnotating = true;
        determineAnnotationMode();
        pause();
    }

    // Annotation Table Delete.
    if(event.key == "Delete" && globals.selected_annotation){

        // Need to rework later so that there is a list of objects to be deleted if the user wants to delete
        // multiple annotations at the same time.

        // Delete the annotation from the object list and redraw annotations again

        // Loop through all annotations.
        for(let i = 0; i < annotations.length; i++){
            const designator = annotations[i].id;

            // Found the annotation.
            if(designator == globals.anno_designator){
                annotations.splice(i,1);
                break;
            }
        }
        
        // Redraw Annotations.
        redrawAnnotations();

        // Remove the annotation row.
        selected_row.remove();

    }

});


// ANNOTATION CHECKBOX LOGIC -------------------------------------------------------------------
document.getElementById('dispAnno').addEventListener('click', () => {
    const annoBox = document.getElementById('dispAnno');

    if(annoBox.checked){
        console.log('Displaying Annotations');
        globals.show_annotations = true;
        redrawAnnotations();
    }else{
        console.log('Hiding Annotations');
        globals.show_annotations = false;
        redrawAnnotations();
    }
});


// TABLE INTERACTION LOGIC ---------------------------------------------------------------------
document.getElementById('annotation-table').addEventListener('click', (event) => {
    
    // Grab the closest row with the event.
    selected_row = event.target.closest('tr');

    // selected_row.style["background-color"] = "#bac2c2ff";
    // selected_row.style.color = "black"; 
    
    try{
        // Grab the annotation designator using innerHTML.
        globals.anno_designator = selected_row.cells[2].innerHTML;
        const anno_frame = parseInt(selected_row.cells[3].innerHTML);

        // Return if the header is selected.
        if (globals.anno_designator == "ID") return;

        globals.selected_annotation = true;

        const { ctx, canvas, imageObjects, frameCount } = globals;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imageObjects[anno_frame-1], 0, 0);

        globals.frameIndex = (anno_frame-1);

        document.getElementById('frameCounter').textContent = `Frame: ${globals.frameIndex + 1}/${frameCount}`;
        document.getElementById('twoD-slider').value = globals.frameIndex;

        if (globals.show_annotations) {
            // Draw all frame level annotations.
            redrawAnnotations();
        }

    }
    catch{
        // Empty catch block. If there are multiple elements highlighted by cursor we dont want to
        // anything, not a valid selection. Add in ability to hold SHIFT to select mutiple entries.
    }    



});

// TABLE CHANGE LOGIC --------------------------------------------------------------------------

// Selector Changes.
document.getElementById('annotation-table').addEventListener('change', (event) => {

    if(event.target.tagName == 'SELECT'){
        const changed_row = event.target.closest('tr');
        const id = changed_row.cells[2].innerHTML;
        
        // Expandable to Other Select Elements.
        const new_abn = changed_row.cells[4].querySelector('select').value.toUpperCase();

        for(let i = 0; i < annotations.length; i++){
            if(annotations[i].id == id){
                annotations[i].abnormal = new_abn;
            }
        }

        // console.log(annotations);

    }
});

// Field Changes.
document.getElementById('annotation-table').addEventListener('input', (event) => {

    const changed_row = event.target.closest('tr');
    const id = changed_row.cells[2].innerHTML;
    const new_name = changed_row.cells[1].innerHTML;

    for(let i = 0; i < annotations.length; i++){
        if(annotations[i].id == id){
            annotations[i].annotation_name = new_name;
        }
    }

    // console.log(annotations);
});


// GENERAL DOCUMENT EVENT LISTENER -------------------------------------------------------------
document.addEventListener('click', (event) => {
    
    // If a table element is no longer selected, then set flag.
    if(globals.selected_annotation && (event.target.nodeName != "TD")){
        globals.selected_annotation = false;
        redrawAnnotations();
        console.log("Not Focused on table");
    }
});