import { globals } from "./globals.js";

// const manipulatorList = {
//     Pan: vtk.Interaction.Manipulators.vtkMouseCameraTrackballPanManipulator,
//     Zoom: vtk.Interaction.Manipulators.vtkMouseCameraTrackballZoomManipulator,

// }

const buttonMap = {
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

    console.log('New image slices!');

    // Create Renderers 
    // Axial
    globals.axial_openGLRenderWindow = vtk.Rendering.OpenGL.vtkRenderWindow.newInstance();
    globals.axial_renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
    globals.axial_renderWindow.addView(globals.axial_openGLRenderWindow);
    globals.axial_renderer = vtk.Rendering.Core.vtkRenderer.newInstance();
    globals.axial_renderWindow.addRenderer(globals.axial_renderer);

    // Sagittal
    globals.sagittal_openGLRenderWindow = vtk.Rendering.OpenGL.vtkRenderWindow.newInstance();
    globals.sagittal_renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
    globals.sagittal_renderWindow.addView(globals.sagittal_openGLRenderWindow);
    globals.sagittal_renderer = vtk.Rendering.Core.vtkRenderer.newInstance();
    globals.sagittal_renderWindow.addRenderer(globals.sagittal_renderer);

    // Coronal
    globals.coronal_openGLRenderWindow = vtk.Rendering.OpenGL.vtkRenderWindow.newInstance();
    globals.coronal_renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
    globals.coronal_renderWindow.addView(globals.coronal_openGLRenderWindow);
    globals.coronal_renderer = vtk.Rendering.Core.vtkRenderer.newInstance();
    globals.coronal_renderWindow.addRenderer(globals.coronal_renderer);

    // Attach GL Windows to Containers and size.
    globals.axial_openGLRenderWindow.setContainer(axial_container);
    globals.sagittal_openGLRenderWindow.setContainer(sagittal_container);
    globals.coronal_openGLRenderWindow.setContainer(coronal_container);

    // Slice Mappers
    globals.axial_mapper = vtk.Rendering.Core.vtkImageResliceMapper.newInstance();
    globals.sagittal_mapper = vtk.Rendering.Core.vtkImageResliceMapper.newInstance();
    globals.coronal_mapper = vtk.Rendering.Core.vtkImageResliceMapper.newInstance();

    // Normal Plane Orientations (For CT adjustments);
    // const direction = vtkImage.getDirection();
    // const axialNormal = [direction[6], direction[7], direction[8]];
    // const sagittalNormal = [direction[3], direction[4], direction[5]];
    // const coronalNormal = [direction[0], direction[1], direction[2]];

    // Slice Planes
    globals.axial_Plane = vtk.Common.DataModel.vtkPlane.newInstance();
    globals.axial_Plane.setNormal(0, 0, 1);
    globals.axial_Plane.setOrigin(vtkImage.getCenter());

    globals.sagittal_Plane = vtk.Common.DataModel.vtkPlane.newInstance();
    globals.sagittal_Plane.setNormal(1, 0, 0);
    globals.sagittal_Plane.setOrigin(vtkImage.getCenter());

    globals.coronal_Plane = vtk.Common.DataModel.vtkPlane.newInstance();
    globals.coronal_Plane.setNormal(0, 1, 0);
    globals.coronal_Plane.setOrigin(vtkImage.getCenter());

    // Create Slice Actors
    globals.axial_actor = vtk.Rendering.Core.vtkImageSlice.newInstance();
    globals.sagittal_actor = vtk.Rendering.Core.vtkImageSlice.newInstance();
    globals.coronal_actor = vtk.Rendering.Core.vtkImageSlice.newInstance();

    // Set Actor Mappers
    globals.axial_actor.setMapper(globals.axial_mapper);
    globals.sagittal_actor.setMapper(globals.sagittal_mapper);
    globals.coronal_actor.setMapper(globals.coronal_mapper);

    // Pass Data from VTK Image to Mappers
    globals.axial_mapper.setInputData(vtkImage);
    globals.sagittal_mapper.setInputData(vtkImage);
    globals.coronal_mapper.setInputData(vtkImage);

    globals.axial_mapper.setSlicePlane(globals.axial_Plane);
    globals.sagittal_mapper.setSlicePlane(globals.sagittal_Plane);
    globals.coronal_mapper.setSlicePlane(globals.coronal_Plane);

    // Set Slab Mode
    // globals.axial_mapper.setSlabType(0);
    // globals.sagittal_mapper.setSlabType(0);
    // globals.coronal_mapper.setSlabType(0);

    // Add Actors to renderers
    globals.axial_renderer.addActor(globals.axial_actor);
    globals.sagittal_renderer.addActor(globals.sagittal_actor);
    globals.coronal_renderer.addActor(globals.coronal_actor);

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
    globals.axial_interactor.setView(globals.axial_openGLRenderWindow);
    globals.axial_interactor.setInteractorStyle(vtk.Interaction.Style.vtkInteractorStyleImage.newInstance());
    globals.axial_interactor.initialize();
    globals.axial_interactor.bindEvents(axial_container);

    globals.sagittal_interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
    globals.sagittal_interactor.setView(globals.sagittal_openGLRenderWindow);
    globals.sagittal_interactor.setInteractorStyle(vtk.Interaction.Style.vtkInteractorStyleImage.newInstance());
    globals.sagittal_interactor.initialize();
    globals.sagittal_interactor.bindEvents(sagittal_container);

    globals.coronal_interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
    globals.coronal_interactor.setView(globals.coronal_openGLRenderWindow);
    globals.coronal_interactor.setInteractorStyle(vtk.Interaction.Style.vtkInteractorStyleImage.newInstance());
    globals.coronal_interactor.initialize();
    globals.coronal_interactor.bindEvents(coronal_container);

    // Set Colour levels.
    const [min, max] = vtkImage.getPointData().getScalars().getRange();

    globals.axial_actor.getProperty().setColorWindow(max - min + 1);
    globals.axial_actor.getProperty().setColorLevel((max + min) / 2);

    globals.sagittal_actor.getProperty().setColorWindow(max - min + 1);
    globals.sagittal_actor.getProperty().setColorLevel((max + min) / 2);

    globals.coronal_actor.getProperty().setColorWindow(max - min + 1);
    globals.coronal_actor.getProperty().setColorLevel((max + min) / 2);

    // Renderer backgrounds.
    globals.axial_renderer.setBackground(0, 0, 0);
    globals.sagittal_renderer.setBackground(0, 0, 0);
    globals.coronal_renderer.setBackground(0, 0, 0);

    // Reset Camera positions.
    globals.axial_renderer.resetCamera();
    globals.sagittal_renderer.resetCamera();
    globals.coronal_renderer.resetCamera();

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
    globals.axial_interactor.setView(globals.axial_openGLRenderWindow);
    globals.axial_interactor.setInteractorStyle(vtk.Interaction.Style.vtkInteractorStyleImage.newInstance());
    globals.axial_interactor.initialize();
    globals.axial_interactor.bindEvents(axial_container);

    globals.sagittal_interactor.setView(globals.sagittal_openGLRenderWindow);
    globals.sagittal_interactor.setInteractorStyle(vtk.Interaction.Style.vtkInteractorStyleImage.newInstance());
    globals.sagittal_interactor.initialize();
    globals.sagittal_interactor.bindEvents(sagittal_container);

    globals.coronal_interactor.setView(globals.coronal_openGLRenderWindow);
    globals.coronal_interactor.setInteractorStyle(vtk.Interaction.Style.vtkInteractorStyleImage.newInstance());
    globals.coronal_interactor.initialize();
    globals.coronal_interactor.bindEvents(coronal_container);

    [globals.axial_interactor, globals.sagittal_interactor, globals.coronal_interactor].forEach(element => {
        addManipulators(element);
    });

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
export function closeSliceViews(vol_container, slice_container, sliders){
    globals.isSliceMode = false;
    
    console.log("Removed all Slice Props");
    if (globals.axial_renderer) globals.axial_renderer.removeAllViewProps();
    if (globals.sagittal_renderer) globals.sagittal_renderer.removeAllViewProps();
    if (globals.coronal_renderer) globals.coronal_renderer.removeAllViewProps();

    // Disable the sliders.
    sliders.style.display = 'none';

    // Reset Volume Window to full view.
    vol_container.style.width = '100vw'
    vol_container.style.height = '100vh'
    vol_container.style.flex = '1';

    slice_container.style.display = 'none';

    console.log("isSliceMode: ", globals.isSliceMode)
}

export function addManipulators(spec_interactor){
    const manipulatorStyle = vtk.Interaction.Style.vtkInteractorStyleManipulator.newInstance();

    // Add Pan manipulator on scroll wheel click.
    manipulatorStyle.addMouseManipulator(vtk.Interaction.Manipulators.MouseCameraTrackballPanManipulator.newInstance({ middleButton }));
    
    // Add Zoom to scroll wheel.
    manipulatorStyle.addMouseManipulator(vtk.Interaction.Manipulators.MouseCameraTrackballZoomManipulator.newInstance({ shiftScrollMiddleButton }));

    // Attach to interactor
    spec_interactor.setInteractorStyle(manipulatorStyle);

}