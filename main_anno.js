import { globals } from "./globals.js";
import { pause, play } from "./twoDRendering.js";
import { mouseMoveBoxAnnotate, annotateBoxes, moveBoxBounds, setBoundsAnnotation, moveBoxAnnotation, setMovedBoxAnnotation, boxBoundsDetection, drawBoundingBox, multiFrame } from "./box_anno.js";
import { mouseMovePolyAnnotate, placeDataPoint } from "./poly_anno.js";

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
//
//
// Polygon Annotation: {type: polygon, 
//                      annotation_name: polygon_name, 
//                      frame: frame, 
//                      id: pid, 
//                      abnormal: "NL", 
//                      dataPoints: []}


export const annotations = [];

export let selected_row = null;
export let movement = null;
export let move_bounds = null;

// DETERMINE ANNOTATION MODE LOGIC -------------------------------------------------------------
export function determineAnnotationMode(){

    // BOX ANNOTATIONS.
    if(!globals.annotating && globals.boxAnnotating){
        globals.annotation_canvas.addEventListener('click', annotateBoxes);
        globals.annotating = true;
        
        document.getElementById('warningLog').textContent = "WARNING: Box Annotation Activated";
        document.body.style.cursor = "crosshair";
    }

    // MULTI FRAME BOX ANNOTATIONS.
    if(!globals.annotating && globals.multiBoxAnnotating){
        globals.annotation_canvas.addEventListener('click', annotateBoxes);
        globals.annotating = true;

        document.getElementById('warningLog').textContent = "WARNING: Multi-frame Box Annotation Activated";
        document.body.style.cursor = "crosshair";

    }

    // POLYGON ANNOTATIONS.
    if(!globals.annotating && globals.polyAnnotating){
        globals.annotation_canvas.addEventListener('click', placeDataPoint);
        globals.annotating = true;
        globals.poly_start_selected = false;

        document.getElementById('warningLog').textContent = "WARNING: Polygon Annotation Activated";
        document.body.style.cursor = "crosshair";
    }

    
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
            
            // Box Annotation.
            if (anno.type == "box") {
                ctx.beginPath();
                ctx.rect(anno.x, anno.y, anno.width, anno.height);
                // ctx.strokeStyle = "red";
                ctx.stroke();
            }

            // Polygon Annotation.
            if (anno.type.includes("polygon")){
                
                ctx.beginPath();

                // Move to first data point.
                ctx.moveTo(anno.dataPoints[0][0], anno.dataPoints[0][1]);

                // Loop through data points array.
                for(let j = 1; j < anno.dataPoints.length; j++){

                    ctx.moveTo(anno.dataPoints[j - 1][0], anno.dataPoints[j - 1][1])
                    ctx.lineTo(anno.dataPoints[j][0], anno.dataPoints[j][1]);

                }

                // If last known designator is found then dont draw the final connection point.
                if(!(anno.id == globals.anno_designator && globals.polyAnnotating) && !(anno.type.includes("oc_"))){
                    // Move to last recorded point.
                    ctx.moveTo(anno.dataPoints[anno.dataPoints.length - 1][0], anno.dataPoints[anno.dataPoints.length - 1][1]);
                    
                    // Draw to origin.
                    ctx.lineTo(anno.dataPoints[0][0], anno.dataPoints[0][1]);
                }
                
                ctx.stroke();

            }
        }

    }

}

// ADD ANNOTATION LOG LOGIC --------------------------------------------------------------------
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

    // Cell formats.
    id_cell.style['text-align'] = "center";
    frame_cell.style['text-align'] = "center";
    abnormal_cell.style['text-align'] = "center";


    if(type == "box"){
        // Alter cell text.
        type_cell.innerHTML = `${type}`;
        name_cell.innerHTML = "test_box";
        id_cell.innerHTML = `B${globals.box_id}`;
        frame_cell.innerHTML = `${globals.frameIndex + 1}`;
        globals.box_id = globals.box_id + 1;

    }
    else if(type == "polygon"){
        type_cell.innerHTML = `${type}`;
        name_cell.innerHTML = "test_polygon";
        id_cell.innerHTML = `P${globals.polygon_id}`;
        frame_cell.innerHTML = `${globals.frameIndex + 1}`;
        globals.polygon_id += 1;
    }
    else if(type == "multiBox"){
        type_cell.innerHTML = `${type}`;
        name_cell.innerHTML = "test_multiBox";
        id_cell.innerHTML = `B${globals.box_id}`;
        frame_cell.innerHTML = `${annotations[annotations.length-1].frame}`;
    }
    else if(type == "oc_polygon"){
        type_cell.innerHTML = `${type}`;
        name_cell.innerHTML = "test_oc_polygon";
        id_cell.innerHTML = `P${globals.polygon_id}`;
        frame_cell.innerHTML = `${globals.frameIndex + 1}`;
        globals.polygon_id += 1;
    }

    
    // Style Changes.
    new_row.style.border = "1px solid white";

    annotation_table.style.border = "1px solid white";
    annotation_table.style["border-collapse"] = "collapse";

}

// ARROW NAVIGATION LOGIC ----------------------------------------------------------------------
document.addEventListener('keydown', (event) => {

    pause();

    if(event.key.includes("Arrow")){

        if (event.key == "ArrowRight" || event.key == "ArrowUp") globals.frameIndex += 1;

        else if (event.key == "ArrowLeft" || event.key == "ArrowDown") globals.frameIndex -= 1;

        if(globals.frameIndex < 0) globals.frameIndex = 0;
        if(globals.frameIndex > globals.frameCount - 1) globals.frameIndex = globals.frameCount - 1; 
        
        document.getElementById('twoD-slider').value = globals.frameIndex;

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





// APP KEY PRESS LOGIC -------------------------------------------------------------------------
document.addEventListener('keyup', (event) => {
    
    // Pause/Play Space Bar Shortcut.
    if(event.key == " " && globals.is2dMode && !globals.annotating){
        if(globals.isPlaying) pause();
        else play();
    }

    // Box Annotation Abort.
    if(event.key == "Escape" && globals.boxAnnotating){

        document.body.style.cursor = "default";

        // Reset indicators.
        globals.annotating = false;
        globals.boxAnnotating = false;
        globals.box_bounds_selected = 0;
        
        // Reset Warning Log.
        document.getElementById('warningLog').textContent = "";

        // Remove event listeners.
        globals.annotation_canvas.removeEventListener('mousemove', mouseMoveBoxAnnotate);
        globals.annotation_canvas.removeEventListener('click', annotateBoxes);
        
        // Redraw pre-existing annotations.
        redrawAnnotations();
        
    }

    // Multi-Box Annotation Abort.
    if(event.key == "Escape" && globals.multiBoxAnnotating){

        document.body.style.cursor = "default";

        // Reset Indicators.
        globals.annotating = false;
        globals.multiBoxAnnotating = false;
        globals.multiPlaced = false;

        document.getElementById('warningLog').textContent = "";

        globals.annotation_canvas.removeEventListener('mousemove', mouseMoveBoxAnnotate);
        globals.annotation_canvas.removeEventListener('click', annotateBoxes);
        document.removeEventListener('keyup', multiFrame);
        redrawAnnotations();
    }

    // Polygon Annotation Abort.
    if(event.key == "Escape" && globals.polyAnnotating){

        document.body.style.cursor = "default";

        // Reset indicators.
        globals.annotating = false;
        globals.polyAnnotating = false;
        
        document.getElementById('warningLog').textContent = "";
        
        // Remove event listeners.
        globals.annotation_canvas.removeEventListener('mousemove', mouseMovePolyAnnotate);
        globals.annotation_canvas.removeEventListener('click', placeDataPoint);

        if(globals.oc_polyAnnotation) !globals.oc_polyAnnotation;


        // Redraw pre-existing annotations.
        redrawAnnotations();

    }

    // Box Annotation Shortcut.
    if (event.key == "b" && !globals.boxAnnotating && !globals.selected_annotation){
        globals.boxAnnotating = true;
        determineAnnotationMode();
        pause();
    }

    if(event.key == "p" && !globals.polyAnnotating && !globals.selected_annotation){
        globals.polyAnnotating = true;
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

    // Annotation Table Selection Abort.
    if (globals.selected_annotation) {
        globals.selected_annotation = false;
        redrawAnnotations();
        console.log("Not Focused on table");
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
document.getElementById('annotation-table').addEventListener('mousedown', (event) => {
    
    // Grab the closest row with the event.
    selected_row = event.target.closest('tr');

    document.body.style.cursor = "default"
    
    // Reset indicators if aborting annotation.
    globals.annotating = false;
    globals.boxAnnotating = false;
    globals.box_bounds_selected = 0;

    // Reset Warning Log.
    document.getElementById('warningLog').textContent = "WARNING: Annotation Modification Active";

    // Remove event listeners if we defocus.
    globals.annotation_canvas.removeEventListener('mousemove', mouseMoveBoxAnnotate);
    globals.annotation_canvas.removeEventListener('click', annotateBoxes);
    globals.annotation_canvas.removeEventListener('mousemove', mouseMovePolyAnnotate);
    globals.annotation_canvas.removeEventListener('click', placeDataPoint);


    // Redraw pre-existing annotations.
    redrawAnnotations();
    
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

        // Add modification listener.
        globals.modifying_annotation = true;

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

// ANNOTATION DEFOCUS LOGIC --------------------------------------------------------------------
document.addEventListener('mousedown', (event) => {
    
    // If a table element is no longer selected and canvas isnt selected, then set flag.
    if(globals.selected_annotation && (event.target.nodeName != "TD") && (event.target.id != "annotation-canvas")){
        globals.selected_annotation = false;
        redrawAnnotations();
        console.log("Not Focused on table");
        document.getElementById('warningLog').textContent = "";
    }

    // Canvas is clicked and annotation is selected.
    if(globals.selected_annotation && (event.target.id == "annotation-canvas")){
        
        // console.log("CHECKING POSITION");
        // console.log(globals.anno_designator);

        const rect = globals.annotation_canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        boxBoundsDetection(mouseX, mouseY);

        if(globals.modif_anno_info[5] == "inside"){
            
            //  The user is now dragging the box.
            movement = (event) => moveBoxAnnotation(event, mouseX, mouseY);
            globals.annotation_canvas.addEventListener('mousemove', movement);
            globals.annotation_canvas.addEventListener('mouseup', (event) => { setMovedBoxAnnotation(event) });
            
            // Aesthetic Changes.
            document.body.style.cursor = "move";
            
        }
        else if(globals.modif_anno_info[5] != "out"){
            
            // The user is now modifying the bounds of the box.
            move_bounds = (event) => moveBoxBounds(event, rect);
            globals.annotation_canvas.addEventListener('mousemove', move_bounds);
            globals.annotation_canvas.addEventListener('mouseup', (event) => { setBoundsAnnotation(event) });
            globals.lastMouseX = mouseX;
            globals.lastMouseY = mouseY;
        }



    }

});