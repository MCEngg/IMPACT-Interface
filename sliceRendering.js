import { globals } from "./globals.js";

export const buttonMap = {
    leftButton: { button: 1 },
    middleButton: { button: 2 },
    rightButton: { button: 3 },
    shiftLeftButton: { button: 1, shift: true },
    shiftMiddleButton: { button: 2, shift: true },
    shiftRightButton: { button: 3, shift: true },
    controlLeftButton: { button: 1, control: true },
    controlMiddleButton: { button: 2, control: true },
    controlRightButton: { button: 3, control: true },
    altLeftButton: { button: 1, alt: true },
    altMiddleButton: { button: 2, alt: true },
    altRightButton: { button: 3, alt: true },
    scrollMiddleButton: { scrollEnabled: true, dragEnabled: false },
    shiftScrollMiddleButton: {
        scrollEnabled: true,
        dragEnabled: false,
        shift: true,
    },
    controlScrollMiddleButton: {
        scrollEnabled: true,
        dragEnabled: false,
        control: true,
    },
    altScrollMiddleButton: {
        scrollEnabled: true,
        dragEnabled: false,
        alt: true,
    }

};

// SLICE VIEW INITIALIZATION LOGIC ------------------------------------------------------------
export function initializeSliceViews(vtkImage) {

    const axial_container = document.getElementById('AxialSlice');
    const sagittal_container = document.getElementById('SagittalSlice');
    const coronal_container = document.getElementById('CoronalSlice');

    console.log('Initializing New image slices!');

    // Create Renderers 
    // Axial
    globals.axial_openGLRenderWindow = vtk.Rendering.OpenGL.vtkRenderWindow.newInstance();
    globals.axial_renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
    globals.axial_renderer = vtk.Rendering.Core.vtkRenderer.newInstance();

    // Sagittal
    globals.sagittal_openGLRenderWindow = vtk.Rendering.OpenGL.vtkRenderWindow.newInstance();
    globals.sagittal_renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
    globals.sagittal_renderer = vtk.Rendering.Core.vtkRenderer.newInstance();

    // Coronal
    globals.coronal_openGLRenderWindow = vtk.Rendering.OpenGL.vtkRenderWindow.newInstance();
    globals.coronal_renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
    globals.coronal_renderer = vtk.Rendering.Core.vtkRenderer.newInstance();

    // Create Slice Mappers
    globals.axial_mapper = vtk.Rendering.Core.vtkImageResliceMapper.newInstance();
    globals.sagittal_mapper = vtk.Rendering.Core.vtkImageResliceMapper.newInstance();
    globals.coronal_mapper = vtk.Rendering.Core.vtkImageResliceMapper.newInstance();

    // Normal Plane Orientations (For CT adjustments);
    // const direction = vtkImage.getDirection();
    // const axialNormal = [direction[6], direction[7], direction[8]];
    // const sagittalNormal = [direction[3], direction[4], direction[5]];
    // const coronalNormal = [direction[0], direction[1], direction[2]];

    // Create Slice Planes
    globals.axial_Plane = vtk.Common.DataModel.vtkPlane.newInstance();
    globals.sagittal_Plane = vtk.Common.DataModel.vtkPlane.newInstance();
    globals.coronal_Plane = vtk.Common.DataModel.vtkPlane.newInstance();

    // Create Slice Actors
    globals.axial_actor = vtk.Rendering.Core.vtkImageSlice.newInstance();
    globals.sagittal_actor = vtk.Rendering.Core.vtkImageSlice.newInstance();
    globals.coronal_actor = vtk.Rendering.Core.vtkImageSlice.newInstance();

    sliceSetup(globals.axial_renderWindow, globals.axial_openGLRenderWindow, globals.axial_renderer, 
               axial_container, globals.axial_Plane, globals.axial_actor, globals.axial_mapper, 0, 0, 1);

    sliceSetup(globals.sagittal_renderWindow, globals.sagittal_openGLRenderWindow, globals.sagittal_renderer, 
               sagittal_container, globals.sagittal_Plane, globals.sagittal_actor, globals.sagittal_mapper, 1, 0, 0);

    sliceSetup(globals.coronal_renderWindow, globals.coronal_openGLRenderWindow, globals.coronal_renderer, 
               coronal_container, globals.coronal_Plane, globals.coronal_actor, globals.coronal_mapper, 0, 1, 0);

    // Set up cameras
    let axial_cam = globals.axial_renderer.getActiveCamera();
    axial_cam.setParallelProjection(true);

    let sagittal_cam = globals.sagittal_renderer.getActiveCamera();
    sagittal_cam.setParallelProjection(true);
    sagittal_cam.setPosition(1, 0, 0);
    sagittal_cam.setFocalPoint(0, 0, 0);
    sagittal_cam.setViewUp(0, 0, 1);

    let coronal_cam = globals.coronal_renderer.getActiveCamera();
    coronal_cam.setParallelProjection(true);
    coronal_cam.setPosition(0, 1, 0);
    coronal_cam.setFocalPoint(0, 0, 0);
    coronal_cam.setViewUp(0, 0, 1);

    // Set up interactors.
    globals.axial_interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
    interactorSetup(globals.axial_interactor, globals.axial_openGLRenderWindow, axial_container);

    globals.sagittal_interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
    interactorSetup(globals.sagittal_interactor, globals.sagittal_openGLRenderWindow, sagittal_container);

    globals.coronal_interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
    interactorSetup(globals.coronal_interactor, globals.coronal_openGLRenderWindow, coronal_container);

    // Set Colour levels.
    const [min, max] = vtkImage.getPointData().getScalars().getRange();

    renderSetup(min, max, globals.axial_actor, globals.axial_renderer);
    renderSetup(min, max, globals.sagittal_actor, globals.sagittal_renderer);
    renderSetup(min, max, globals.coronal_actor, globals.coronal_renderer);

    // Reset sizes and update windows, then render.
    requestAnimationFrame(() => {
        globals.axial_openGLRenderWindow.setSize(axial_container.clientWidth, axial_container.clientHeight);
        globals.sagittal_openGLRenderWindow.setSize(sagittal_container.clientWidth, sagittal_container.clientHeight);
        globals.coronal_openGLRenderWindow.setSize(coronal_container.clientWidth, coronal_container.clientHeight);

        globals.axial_openGLRenderWindow.modified();
        globals.sagittal_openGLRenderWindow.modified();
        globals.coronal_openGLRenderWindow.modified();

        globals.axial_renderWindow.render();
        globals.sagittal_renderWindow.render();
        globals.coronal_renderWindow.render();
    });

    globals.loaded_new = false;
    console.log("Rendered the slice windows!");
    updateSliderRanges(vtkImage);

}

export function renderSetup(min, max, actor, renderer){
    
    // Set Colour Levels.
    actor.getProperty().setColorWindow(max - min + 1);
    actor.getProperty().setColorLevel((max + min) / 2);

    renderer.setBackground(0, 0, 0);
    renderer.resetCamera();
}

// SLICE SETUP LOGIC ---------------------------------------------------------------------------
export function sliceSetup(renderWindow, gl_Window, renderer, container, plane, actor, mapper, x, y,z){
    
    // Attach GL Window to Containers and Size.
    renderWindow.addView(gl_Window);
    
    // Attach renderer to window.
    renderWindow.addRenderer(renderer);
    gl_Window.setContainer(container);
    
    // Set plane normal and starting position.
    plane.setNormal(x, y, z);
    plane.setOrigin(globals.vtkImage.getCenter());

    // Set actor mapper and input data.
    actor.setMapper(mapper);
    mapper.setInputData(globals.vtkImage);
    mapper.setSlicePlane(plane);

    // Add actor to renderer.
    renderer.addActor(actor);
}


// UPDATE SLIDER RANGES LOGIC -----------------------------------------------------------------
export function updateSliderRanges(vtkImage) {
    const extent = vtkImage.getExtent();

    // Get Max Ranges and assign
    document.getElementById('ax_slider').max = extent[5] - extent[4];
    document.getElementById('sa_slider').max = extent[1] - extent[0];
    document.getElementById('cor_slider').max = extent[3] - extent[2];

    // Assign sliders to the middle to start.
    document.getElementById('ax_slider').value = Math.floor((extent[5] - extent[4]) / 2);
    document.getElementById('sa_slider').value = Math.floor((extent[1] - extent[0]) / 2);
    document.getElementById('cor_slider').value = Math.floor((extent[3] - extent[2]) / 2);

}

// UPDATE SLICE VIEWS LOGIC -------------------------------------------------------------------
export function updateSliceViews(vtkImage) {

    console.log("NEW VOLUME, UPDATING SLICE VIEWS");

    const axial_container = document.getElementById('AxialSlice');
    const sagittal_container = document.getElementById('SagittalSlice');
    const coronal_container = document.getElementById('CoronalSlice');

    // Remove Old Slice Actors.
    if (globals.axial_actor) globals.axial_renderer.removeActor(globals.axial_actor);
    if (globals.sagittal_actor) globals.sagittal_renderer.removeActor(globals.sagittal_actor);
    if (globals.coronal_actor) globals.coronal_renderer.removeActor(globals.coronal_actor);

    globals.axial_Plane.setOrigin(vtkImage.getCenter());
    globals.sagittal_Plane.setOrigin(vtkImage.getCenter());
    globals.coronal_Plane.setOrigin(vtkImage.getCenter());

    // Set Actor Mappers
    globals.axial_actor.setMapper(globals.axial_mapper);
    globals.sagittal_actor.setMapper(globals.sagittal_mapper);
    globals.coronal_actor.setMapper(globals.coronal_mapper);

    // Allocate new mappers to the planes.
    globals.axial_mapper.setSlicePlane(globals.axial_Plane);
    globals.sagittal_mapper.setSlicePlane(globals.sagittal_Plane);
    globals.coronal_mapper.setSlicePlane(globals.coronal_Plane);

    // Pass Data from new VTK Image to Mappers
    globals.axial_mapper.setInputData(vtkImage);
    globals.sagittal_mapper.setInputData(vtkImage);
    globals.coronal_mapper.setInputData(vtkImage);

    // Update window/ colour level.
    const [min, max] = vtkImage.getPointData().getScalars().getRange();
    const colorWindow = max - min + 1;
    const colorLevel = (max + min) / 2;

    globals.axial_actor.getProperty().setColorWindow(colorWindow);
    globals.axial_actor.getProperty().setColorLevel(colorLevel);
    globals.sagittal_actor.getProperty().setColorWindow(colorWindow);
    globals.sagittal_actor.getProperty().setColorLevel(colorLevel);
    globals.coronal_actor.getProperty().setColorWindow(colorWindow);
    globals.coronal_actor.getProperty().setColorLevel(colorLevel);

    globals.axial_mapper.modified();
    globals.sagittal_actor.modified();
    globals.coronal_actor.modified();

    // Set up cameras
    let axial_cam = globals.axial_renderer.getActiveCamera();
    axial_cam.setParallelProjection(true);

    let sagittal_cam = globals.sagittal_renderer.getActiveCamera();
    sagittal_cam.setParallelProjection(true);
    sagittal_cam.setPosition(1, 0, 0);
    sagittal_cam.setFocalPoint(0, 0, 0);
    sagittal_cam.setViewUp(0, 0, 1);

    let coronal_cam = globals.coronal_renderer.getActiveCamera();
    coronal_cam.setParallelProjection(true);
    coronal_cam.setPosition(0, 1, 0);
    coronal_cam.setFocalPoint(0, 0, 0);
    coronal_cam.setViewUp(0, 0, 1);

    // Readd the new modified actors.
    globals.axial_renderer.addActor(globals.axial_actor);
    globals.sagittal_renderer.addActor(globals.sagittal_actor);
    globals.coronal_renderer.addActor(globals.coronal_actor);

    // Set up interactors.
    globals.axial_interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
    interactorSetup(globals.axial_interactor, globals.axial_openGLRenderWindow, axial_container);

    globals.sagittal_interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
    interactorSetup(globals.sagittal_interactor, globals.sagittal_openGLRenderWindow, sagittal_container);

    globals.coronal_interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
    interactorSetup(globals.coronal_interactor, globals.coronal_openGLRenderWindow, coronal_container);


    // Reset Camera positions.
    globals.axial_renderer.resetCamera();
    globals.sagittal_renderer.resetCamera();
    globals.coronal_renderer.resetCamera();

    // Rerender the windows to show new data.
    globals.axial_renderWindow.render();
    globals.sagittal_renderWindow.render();
    globals.coronal_renderWindow.render();

    globals.loaded_new = false

    // Reset sizes and update windows, then render.
    requestAnimationFrame(() => {
        globals.axial_openGLRenderWindow.setSize(axial_container.clientWidth, axial_container.clientHeight);
        globals.sagittal_openGLRenderWindow.setSize(sagittal_container.clientWidth, sagittal_container.clientHeight);
        globals.coronal_openGLRenderWindow.setSize(coronal_container.clientWidth, coronal_container.clientHeight);

        globals.axial_renderer.resetCameraClippingRange();
        globals.sagittal_renderer.resetCameraClippingRange();
        globals.coronal_renderer.resetCameraClippingRange();

        globals.axial_openGLRenderWindow.modified();
        globals.sagittal_openGLRenderWindow.modified();
        globals.coronal_openGLRenderWindow.modified();

        globals.axial_renderWindow.render();
        globals.sagittal_renderWindow.render();
        globals.coronal_renderWindow.render();

    })

    updateSliderRanges(vtkImage);

    return;
}

// CLOSE SLICE CONTROLS AND VIEWS LOGIC -------------------------------------------------------
export function closeSliceViews(vol_container, sliders){
    globals.isSliceMode = false;
    
    console.log("Removed all Slice Props");
    if (globals.axial_renderer) globals.axial_renderer.removeAllViewProps();
    if (globals.sagittal_renderer) globals.sagittal_renderer.removeAllViewProps();
    if (globals.coronal_renderer) globals.coronal_renderer.removeAllViewProps();

    // Disable the sliders.
    sliders.style.display = 'none';

    // Reset Volume Window to full view.
    vol_container.style.width = 'auto'
    vol_container.style.height = 'auto'
    vol_container.style.flex = '1';

    // Set grid to 1x1.
    document.getElementById('vol-slice-grid').style.gridTemplateColumns = "1fr";
    document.getElementById('vol-slice-grid').style.gridTemplateRows = "1fr";

    // Disable slice containers.
    // Set Slice Columns to none.
    for (const column of document.getElementsByClassName('sliceColumn')) {
        column.style.display = 'none';
    }

    console.log("isSliceMode: ", globals.isSliceMode);
}

// INTERACTOR SETUP LOGIC ---------------------------------------------------------------------
export function interactorSetup(spec_interactor, gl_Window, container){
    
    // Set view and interactor style.
    spec_interactor.setView(gl_Window);
    spec_interactor.setInteractorStyle(vtk.Interaction.Style.vtkInteractorStyleImage.newInstance());

    // Set Manipulator styles and remove all pre-existing manipulators.
    const manipulatorStyle = vtk.Interaction.Style.vtkInteractorStyleManipulator.newInstance();
    manipulatorStyle.removeAllMouseManipulators();

    // Add Pan manipulator on scroll wheel click.
    manipulatorStyle.addMouseManipulator(vtk.Interaction.Manipulators.vtkMouseCameraTrackballPanManipulator.newInstance(buttonMap.middleButton));
    
    // Add Zoom to scroll wheel.
    manipulatorStyle.addMouseManipulator(vtk.Interaction.Manipulators.vtkMouseCameraTrackballZoomManipulator.newInstance(buttonMap.shiftScrollMiddleButton));

    // Attach to interactor
    spec_interactor.setInteractorStyle(manipulatorStyle);

    // Initialize and bind events.
    spec_interactor.initialize();
    spec_interactor.bindEvents(container);

}

// SCROLL SLIDER UPDATES LOGIC ----------------------------------------------------------------

// Axial Slice
document.getElementById('AxialSlice').addEventListener('wheel', (event) => {

    // If the shift key is being used, then zoom mode is enabled, not scroll.
    if (event.shiftKey) return;

    event.preventDefault();

    const spacing = globals.vtkImage.getSpacing();     // Spacing Values: [sx, sy, sz].
    const origin = globals.vtkImage.getOrigin();       // Origin Coordinates: [ox, oy, oz].
    const extent = globals.vtkImage.getExtent();       // Min/Max Values: [xmin, xmax, ymin, ymax, zmin, zmax].
    const planeOrigin = globals.axial_Plane.getOrigin();

    // Current index along Z
    let currentIdx = Math.round((planeOrigin[2] - origin[2]) / spacing[2]);

    const delta = Math.sign(event.deltaY);
    const minIdx = extent[4]; // zmin value.
    const maxIdx = extent[5]; // zmax value.

    // Clamp new index
    let newIdx = Math.min(Math.max(currentIdx + delta, minIdx), maxIdx);
    let newZ = origin[2] + newIdx * spacing[2];

    // Set new origin for the axial plane (z-axis moves)
    globals.axial_Plane.setOrigin(planeOrigin[0], planeOrigin[1], newZ);
    globals.axial_Plane.modified();
    globals.axial_mapper.modified();

    // Update slider
    const slider = document.getElementById('ax_slider');
    if (slider) slider.value = newIdx;

    const container = document.getElementById('AxialSlice');


    // Render ONLY the axial window
    requestAnimationFrame(() => {
        globals.axial_openGLRenderWindow.setSize(container.clientWidth, container.clientHeight);
        globals.axial_renderer.resetCameraClippingRange();
        
        globals.axial_openGLRenderWindow.modified();   // ensure the render window notices the update.
        globals.axial_renderWindow.render();
        globals.genericRenderWindow.getRenderWindow().render();
    });

});

// Sagittal Slice
document.getElementById('SagittalSlice').addEventListener('wheel', (event) => {

    // If the shift key is being used, then zoom mode is enabled, not scroll.
    if (event.shiftKey) return;

    event.preventDefault();

    const spacing = globals.vtkImage.getSpacing();     // Spacing Values: [sx, sy, sz].
    const origin = globals.vtkImage.getOrigin();       // Origin Coordinates: [ox, oy, oz].
    const extent = globals.vtkImage.getExtent();       // Index Min/Max: [xmin, xmax, ymin, ymax, zmin, zmax].
    const bounds = globals.vtkImage.getBounds();       // Image Min/Max: [xmin, xmax, ymin, ymax, zmin, zmax].
    const planeOrigin = globals.sagittal_Plane.getOrigin();

    // Current index along X (sagittal).
    let currentIdx = Math.round((planeOrigin[0] - origin[0]) / spacing[0]);

    const delta = Math.sign(event.deltaY);
    const minIdx = extent[0]; // xmin
    const maxIdx = extent[1]; // xmax

    // Compute new index and clamp.
    let newIdx = Math.min(Math.max(currentIdx + delta, minIdx), maxIdx);

    // Compute world coordinate X position for the new slice.
    let newX = origin[0] + newIdx * spacing[0];

    // Clamp newX to data bounds (world space)
    // Take the max of the new position and the minimum bound.
    // Then take the minimum of the new position and the maximum bound.
    newX = Math.min(Math.max(newX, bounds[0]), bounds[1]);

    // Update plane.
    globals.sagittal_Plane.setOrigin(newX, planeOrigin[1], planeOrigin[2]);
    globals.sagittal_Plane.modified();
    globals.sagittal_mapper.modified();

    // Update HTML slider (make sure it's an int).
    const slider = document.getElementById('sa_slider');
    if (slider) slider.value = newIdx.toString();

    const container = document.getElementById('SagittalSlice');

    // Trigger render.
    requestAnimationFrame(() => {
        globals.sagittal_openGLRenderWindow.setSize(container.clientWidth, container.clientHeight);
        globals.sagittal_renderer.resetCameraClippingRange();
        
        globals.sagittal_openGLRenderWindow.modified();
        globals.sagittal_renderWindow.render();
        globals.genericRenderWindow.getRenderWindow().render()
    });

});

// Coronal Slice
document.getElementById('CoronalSlice').addEventListener('wheel', (event) => {

    // If the shift key is being used, then zoom mode is enabled, not scroll.
    if (event.shiftKey) return;

    event.preventDefault();

    const spacing = globals.vtkImage.getSpacing();     // Spacing Values: [sx, sy, sz].
    const origin = globals.vtkImage.getOrigin();       // Origin Coordinates: [ox, oy, oz].
    const extent = globals.vtkImage.getExtent();       // Index Min/Max: [xmin, xmax, ymin, ymax, zmin, zmax].
    const bounds = globals.vtkImage.getBounds();       // Image Min/Max: [xmin, xmax, ymin, ymax, zmin, zmax].
    const planeOrigin = globals.coronal_Plane.getOrigin();

    // Current index along Y (coronal).
    let currentIdx = Math.round((planeOrigin[1] - origin[1]) / spacing[1]);

    const delta = Math.sign(event.deltaY);
    const minIdx = extent[2]; // ymin
    const maxIdx = extent[3]; // ymax

    // Compute new index and clamp.
    let newIdx = Math.min(Math.max(currentIdx + delta, minIdx), maxIdx);

    // Compute world coordinate Y position for the new slice.
    let newY = origin[1] + newIdx * spacing[1];

    // Clamp newY to data bounds (world space)
    // Take the max of the new position and the minimum bound.
    // Then take the minimum of the new position and the maximum bound.
    newY = Math.min(Math.max(newY, bounds[2]), bounds[3]);

    // Update plane.
    globals.coronal_Plane.setOrigin(planeOrigin[0], newY, planeOrigin[2]);
    globals.coronal_Plane.modified();
    globals.coronal_mapper.modified();

    // Update HTML slider (make sure it's an int).
    const slider = document.getElementById('cor_slider');
    if (slider) slider.value = newIdx.toString();

    const container = document.getElementById('CoronalSlice');

    // Trigger render.
    requestAnimationFrame(() => {
        globals.coronal_openGLRenderWindow.setSize(container.clientWidth, container.clientHeight);
        globals.coronal_renderer.resetCameraClippingRange();

        globals.coronal_openGLRenderWindow.modified();
        globals.coronal_renderWindow.render();
        globals.genericRenderWindow.getRenderWindow().render()
    });


});

// SLICE SLIDER LOGIC ----------------------------------------------------------------------

// Axial Slider logic
document.getElementById('ax_slider').addEventListener('input', (event) => {
    const spacing = globals.vtkImage.getSpacing();
    const origin = globals.vtkImage.getOrigin();
    const zIndex = Number(event.target.value);
    const zCoord = origin[2] + zIndex * spacing[2];
    globals.axial_Plane.setOrigin(origin[0], origin[1], zCoord);
    globals.axial_Plane.modified();
    globals.axial_mapper.modified();

    const container = document.getElementById('AxialSlice');

    requestAnimationFrame(() => {
        globals.axial_openGLRenderWindow.setSize(container.clientWidth, container.clientHeight);
        globals.axial_renderer.resetCameraClippingRange();

        globals.axial_openGLRenderWindow.modified();
        globals.axial_renderWindow.render();
        globals.genericRenderWindow.getRenderWindow().render();
    });

});

// Sagittal Slider logic
document.getElementById('sa_slider').addEventListener('input', (event) => {
    const spacing = globals.vtkImage.getSpacing();
    const origin = globals.vtkImage.getOrigin();
    const xIndex = Number(event.target.value);
    const xCoord = origin[0] + xIndex * spacing[0];
    globals.sagittal_Plane.setOrigin(xCoord, origin[1], origin[2]);
    globals.sagittal_Plane.modified();
    globals.sagittal_mapper.modified();

    const container = document.getElementById('SagittalSlice');

    requestAnimationFrame(() => {
        globals.sagittal_openGLRenderWindow.setSize(container.clientWidth, container.clientHeight);
        globals.sagittal_renderer.resetCameraClippingRange();

        globals.sagittal_openGLRenderWindow.modified();
        globals.sagittal_renderWindow.render();
        globals.genericRenderWindow.getRenderWindow().render();
    });

});

// Coronal Slider logic
document.getElementById('cor_slider').addEventListener('input', (event) => {
    const spacing = globals.vtkImage.getSpacing();
    const origin = globals.vtkImage.getOrigin();
    const yIndex = Number(event.target.value);
    const yCoord = origin[1] + yIndex * spacing[1];
    globals.coronal_Plane.setOrigin(origin[0], yCoord, origin[2]);

    globals.coronal_Plane.modified();
    globals.coronal_mapper.modified();

    const container = document.getElementById('CoronalSlice');

    requestAnimationFrame(() => {
        globals.coronal_openGLRenderWindow.setSize(container.clientWidth, container.clientHeight);
        globals.coronal_renderer.resetCameraClippingRange();

        globals.coronal_openGLRenderWindow.modified();
        globals.coronal_renderWindow.render();
        globals.genericRenderWindow.getRenderWindow().render();
    });

});