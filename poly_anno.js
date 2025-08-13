import { globals } from "./globals.js";
import { determineAnnotationMode, annotations, redrawAnnotations, addAnnotationLog } from "./main_anno.js";
import { pause } from "./twoDRendering.js";

let poly_dataPoints = [];

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
        
        let p_type = "";
        
        if(globals.oc_polyAnnotation) p_type = "oc_polygon";
        else p_type = "polygon";

        annotations.push({
            type: p_type,
            annotation_name: "test_polygon",
            frame: (globals.frameIndex + 1),
            id: `P${globals.polygon_id}`,
            abnormal: "NL",
            dataPoints: poly_dataPoints.slice(),
            openCountour: globals.oc_polyAnnotation
        });

        addAnnotationLog(p_type);
        

    }
    else{
        console.log(annotations);
        
        // Find the polygon annotation.

        let index = 0;

        for(let i = 0; i < annotations.length; i++){
            if(annotations[i].id == `P${globals.polygon_id - 1}`){
                index = i;
            }
        }

        // Push the mouseX and mouseY location as the last known datapoint to draw from.
        annotations[index].dataPoints.push([mouseX, mouseY]);
        poly_dataPoints.push([mouseX, mouseY]);

        redrawAnnotations();

    }

}

export function mouseMovePolyAnnotate(event){

    redrawAnnotations();

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