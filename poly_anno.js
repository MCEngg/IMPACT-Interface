import { globals } from "./globals.js";
import { determineAnnotationMode, annotations, redrawAnnotations, addAnnotationLog } from "./main_anno.js";
import { pause } from "./twoDRendering.js";

export let poly_dataPoints = [];

// POLYGON BUTTON LOGIC ------------------------------------------------------------------------
document.getElementById('polygon-button').addEventListener('click', async(event) => {
    console.log("POLYGON ANNOTATION MODE");

    // Dont do anything if already annotating.
    if(globals.annotating) return;

    // Set annotating status.
    globals.polyAnnotating = true;
    
    determineAnnotationMode();
    pause();

});

// OPEN-CONTOUR POLYGON BUTTON LOGIC ------------------------------------------------------------
document.getElementById('open-contour-button').addEventListener('click', async(event) => {
    console.log("OPEN CONTOUR ANNOTATION MODE");

    // Dont do anthing if already annotating.
    if(globals.annotating) return;

    globals.polyAnnotating = true;
    globals.oc_polyAnnotation = true;
    determineAnnotationMode();
    pause();

});

export function placeDataPoint(event){

    const rect = globals.annotation_canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if(!globals.poly_start_selected){
        
        globals.poly_start_selected = true;
        globals.anno_designator = `P${globals.polygon_id}`;

        // Reset Polygon Data Point list and add in the first point.
        poly_dataPoints = [[mouseX, mouseY]];

        globals.annotation_canvas.addEventListener('mousemove', mouseMovePolyAnnotate);
        
    }
    else{
        console.log(annotations);

        poly_dataPoints.push([mouseX, mouseY]);

        redrawAnnotations();
        redrawPolygon();

    }

}

export function mouseMovePolyAnnotate(event){

    redrawAnnotations();
    redrawPolygon();

    const rect = globals.annotation_canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const ctx = globals.annotation_ctx;

    const pl = poly_dataPoints.length;

    ctx.beginPath();
    // Move the cursor to start at the last known data point, x and y.
    ctx.moveTo(poly_dataPoints[pl-1][0], poly_dataPoints[pl-1][1]);
    ctx.lineTo(mouseX, mouseY);

    // If not a open contour polygon.
    if(!globals.oc_polyAnnotation){
        ctx.moveTo(mouseX, mouseY);
        ctx.lineTo(poly_dataPoints[0][0], poly_dataPoints[0][1]);
    }
    
    ctx.strokeStyle = "red";
    ctx.stroke();

}

export function redrawPolygon(){

    const ctx = globals.annotation_ctx;

    ctx.beginPath();

    for(let i = 1; i < poly_dataPoints.length; i++){
        ctx.moveTo(poly_dataPoints[i - 1][0], poly_dataPoints[i - 1][1]);
        ctx.lineTo(poly_dataPoints[i][0], poly_dataPoints[i][1]);
    }

    ctx.strokeStyle = "red";
    ctx.stroke();


}