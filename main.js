let isSliceMode = false;
let vtkImage = null;

// Render Window Globals
let genericRenderWindow = null;
let renderWindow = null;

// Volume View Globals
let renderer = null;
let volumeActor = null;
let loaded_new = false;

// Slice View Globals
let axial_renderer = null;
let sagittal_renderer = null;
let coronal_renderer = null;

let axial_renderWindow = null;
let sagittal_renderWindow = null;
let coronal_renderWindow = null;

let axial_openGLRenderWindow = null;
let sagittal_openGLRenderWindow = null;
let coronal_openGLRenderWindow = null;

let axial_actor = null;
let sagittal_actor = null;
let coronal_actor = null;

let axial_mapper = null;
let sagittal_mapper = null;
let coronal_mapper = null;

let axial_interactor = null;
let sagittal_interactor = null;
let coronal_interactor = null;

let axial_Plane = null;
let sagittal_Plane = null;
let coronal_Plane = null;

window.addEventListener('DOMContentLoaded', () => {

    // RENDERER CONTAINER
    const containerRef = document.getElementById('vtk-vol_container');

    if(!containerRef || !window.vtk || !window.itk){
        console.error('Elements or libraries not loaded.');
        return;
    }

    containerRef.style.display = 'block';
    containerRef.style.visibility = 'visible';

    // RENDER WINDOW
    // Create the Render Window.
    genericRenderWindow = vtk.Rendering.Misc.vtkGenericRenderWindow.newInstance();

    // Ensure that the window is associated with the div.
    genericRenderWindow.setContainer(containerRef);

    // Grab references to the renderer and window.
    renderer = genericRenderWindow.getRenderer();
    renderWindow = genericRenderWindow.getRenderWindow();

    renderer.setBackground(0.031, 0.309, 0.435);
    
    genericRenderWindow.resize();

    requestAnimationFrame(() => {
        renderer.resetCamera();
        // Render the scene.
        renderWindow.render();
    });
    
    // MULTI-DICOM SERIES FILE INPUT LOGIC ------------------------------------------------------
    const dicomInput = document.getElementById('dicomInput');

    if(!dicomInput){
        console.warn('Directory not found');
    }

    dicomInput.addEventListener('change', async (event) => {
        
        // Grab files from directory.
        const files = Array.from(event.target.files);
        const dicomFiles = Array.from(files).filter((file) => file instanceof File && file.name.toLowerCase().endsWith('.dcm'));

        // Send warning if no files.
        if (dicomFiles.length === 0){
            alert('No DICOM files found in the selected folder.');
            return;
        }

        // console.log('Files selected: ', dicomFiles);

        let itkImage = null;

        try{

            // If there is only 1 DICOM then only use readImage instead of the series reader.
            if (dicomFiles.length == 1){
                const file = dicomFiles[0];

                if (!(file instanceof File)){
                    throw new TypeError("Expected a File object");
                }

                // Read in data into image variable, itkImage reference.
                const arrayBuffer = await file.arrayBuffer();
                const { image } = await itk.readImageArrayBuffer(null, arrayBuffer, file.name);
                itkImage = image;
                
            }

            else{
                
                // Check if every file is valid in the series.
                const allFilesAreValid = dicomFiles.every(f => f instanceof File);
                if(!allFilesAreValid){
                    throw new TypeError("All fules must be File objects");
                }

                // Read the whole series into image.
                const { image } = await itk.readImageDICOMFileSeries(dicomFiles);
                itkImage = image;
            }

            // Ensure that image has data.
            if (!itkImage || !itkImage.data){
                throw new Error('Parsed image is null or missing data');
            }
            
            loaded_new = true;

            // console.log(itkImage.getExtent());

            // Render volume.
            renderVolume(itkImage);

        }

        catch (error){
            console.error('Error loading DICOM series:', error);
            alert('Failed to load DICOM folder. Ensure it contains all valid DICOM series.');
        }


    });


    // SINGLE FILE INPUT LOGIC ------------------------------------------------------------------
    const fileInput = document.getElementById('fileInput');
    
    if(!fileInput){
        console.warn('File input not found');
        return;
    }

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];

        // Alert user.
        if(!file || !(file.name.endsWith('.nrrd') || file.name.endsWith('.dcm') || file.name.endsWith('.dicom'))){
            alert(`Please select a valid file: .nrrd, .dcm, or .dicom files.`);
        }

        // Default when loading new volume is that it is displayed and that slices are not displayed.
        document.getElementById('dispVolBox').checked = true;
        document.getElementById('dispSlicesBox').checked = false;

        // NRRD FILE LOGIC ----------------------------------------------------------------------
        if (file.name.endsWith('.nrrd')) {

            // Read NRRD with ITK-Wasm
            const arrayBuffer = await file.arrayBuffer();
            const {image: itkImage} = await itk.readImageArrayBuffer(null, arrayBuffer, file.name);

            // Update boolean
            loaded_new = true;

            // Render volume.
            renderVolume(itkImage);

        }

        // SINGLE DICOM FILE LOGIC --------------------------------------------------------------
        if (file.name.endsWith('.dcm') || file.name.endsWith('.dicom')){
            // Nothing yet, focusing on 3D DICOM Volumes first.

                if (!(file instanceof File)){
                    throw new TypeError("Expected a File object");
                }

                // Read in data into image variable, itkImage reference.
                const arrayBuffer = await file.arrayBuffer();
                const { image } = await itk.readImageArrayBuffer(null, arrayBuffer, file.name);
                itkImage = image;

                // Render the volume.
                renderVolume(itkImage);
        }

        
        const resizeObserver = new ResizeObserver(() => {
            // Reset cameras and rerender.
            genericRenderWindow.resize();
            renderer.resetCamera();
            renderer.getActiveCamera().azimuth(0);
            renderWindow.render();
        });

        resizeObserver.observe(containerRef);
        
        // If slices already exist, update slice data.
        if (axial_renderWindow && loaded_new && isSliceMode){
            updateSliceViews(vtkImage);
        }

    });

    // SLICE TOGGLE LOGIC ----------------------------------------------------------------------
    document.getElementById('toggleSlice').addEventListener('click', () => {
        
        // Get Containers
        const sliders = document.getElementById('slice-sliders');
        const vol_container = document.getElementById('vtk-vol_container');
        const slice_container = document.getElementById('sliceRow');
        const axial_container = document.getElementById('AxialSlice');
        const sagittal_container = document.getElementById('SagittalSlice');
        const coronal_container = document.getElementById('CoronalSlice');

        isSliceMode = !isSliceMode;
        
        if(isSliceMode && vtkImage){
            console.log('Switching to Slice View');

            // Enable sliders.
            sliders.style.display = 'block';

            // Set new constrains to volume window.
            vol_container.style.width = '100vw';
            vol_container.style.height = '50vh';
            vol_container.style.flex = '1';
            axial_container.style.display = 'block';
            sagittal_container.style.display = 'block';
            coronal_container.style.display = 'block';
            slice_container.style.display = 'flex';

            // Render windows dont exist yet so, complete setup.
            if (!axial_renderWindow){
                initializeSliceViews(vtkImage);
            }
            // Render Windows already exist so just update input data for slices.
            else if (axial_renderWindow && loaded_new){
                updateSliceViews(vtkImage);
            }
            
        } else {
            console.log('Switching to Volume View');

            if (axial_renderer) axial_renderer.removeAllViewProps();
            if (sagittal_renderer) sagittal_renderer.removeAllViewProps();
            if (coronal_renderer) coronal_renderer.removeAllViewProps();

            // Disable the sliders.
            sliders.style.display = 'none';
            
            // Reset Volume Window to full view.
            vol_container.style.width = '100vw'
            vol_container.style.height = '100vh'
            vol_container.style.flex = '1';

            slice_container.style.display = 'none';

        }

        // Reset camera position to default
        genericRenderWindow.resize();
        renderer.resetCamera();
        renderWindow.render();

    });

    // CHECKBOX LOGIC --------------------------------------------------------------------------
    
    // Slices Checkbox logic.
    document.getElementById('dispSlicesBox').addEventListener('click', () => {
        // Grab the display checkbox.
        const displayBox = document.getElementById('dispSlicesBox');

        // Display logic.
        if (displayBox.checked){
            if (axial_actor) renderer.addActor(axial_actor);
            if (sagittal_actor) renderer.addActor(sagittal_actor);
            if (coronal_actor) renderer.addActor(coronal_actor);
        }
        else{
            if (axial_actor) renderer.removeActor(axial_actor);
            if (sagittal_actor) renderer.removeActor(sagittal_actor);
            if (coronal_actor) renderer.removeActor(coronal_actor);
        }

        genericRenderWindow.getRenderWindow().render();  
    });

    // Volume Checkbox logic.
    document.getElementById('dispVolBox').addEventListener('click', () => {
        // Grab the volume checkbox.
        const volBox = document.getElementById('dispVolBox');

        // Display Logic
        if (volBox.checked && (volumeActor != null)){
            renderer.addActor(volumeActor);
        }
        else if (!volBox.checked && (volumeActor != null)){
            renderer.removeActor(volumeActor);
        }

        genericRenderWindow.getRenderWindow().render();  
    });
    
    // SLIDER LOGIC -----------------------------------------------------------------------------

    // Axial Slider logic.
    document.getElementById('ax_slider').addEventListener('input', (event) => {
        const spacing = vtkImage.getSpacing();
        const origin = vtkImage.getOrigin();
        const zIndex = Number(event.target.value);
        const zCoord = origin[2] + zIndex * spacing[2];
        axial_Plane.setOrigin(origin[0], origin[1], zCoord);
        
        requestAnimationFrame(() => {
            axial_renderWindow.render();
            genericRenderWindow.getRenderWindow().render();
        });
        
    });

    // Sagittal Slider logic.
    document.getElementById('sa_slider').addEventListener('input', (event) => {
        const spacing = vtkImage.getSpacing();
        const origin = vtkImage.getOrigin();
        const xIndex = Number(event.target.value);
        const xCoord = origin[0] + xIndex * spacing[0];
        sagittal_Plane.setOrigin(xCoord, origin[1], origin[2]);
        
        requestAnimationFrame(() => {
            sagittal_renderWindow.render();
            genericRenderWindow.getRenderWindow().render();
        });

    });

    // Coronal Slider logic.
    document.getElementById('cor_slider').addEventListener('input', (event) => {
        const spacing = vtkImage.getSpacing();
        const origin = vtkImage.getOrigin();
        const yIndex = Number(event.target.value);
        const yCoord = origin[1] + yIndex * spacing[1];
        coronal_Plane.setOrigin(origin[0], yCoord, origin[2]);
        
        requestAnimationFrame(() => {
            coronal_renderWindow.render();
            genericRenderWindow.getRenderWindow().render();
        });

    });


    // SCROLL SLIDER UPDATES LOGIC ----------------------------------------------------------------
    
    // Axial Slice
    document.getElementById('AxialSlice').addEventListener('wheel', (event) => {
        event.preventDefault();

        const spacing = vtkImage.getSpacing();     // [sx, sy, sz]
        const origin = vtkImage.getOrigin();       // [ox, oy, oz]
        const extent = vtkImage.getExtent();       // [xmin, xmax, ymin, ymax, zmin, zmax]
        const planeOrigin = axial_Plane.getOrigin();

        // Current index along Z
        let currentIdx = Math.round((planeOrigin[2] - origin[2]) / spacing[2]);

        const delta = Math.sign(event.deltaY);
        const minIdx = extent[4]; // zmin
        const maxIdx = extent[5]; // zmax

        // Clamp new index
        let newIdx = Math.min(Math.max(currentIdx + delta, minIdx), maxIdx);
        let newZ = origin[2] + newIdx * spacing[2];

        // Set new origin for the axial plane (z-axis moves)
        axial_Plane.setOrigin(planeOrigin[0], planeOrigin[1], newZ);

        // Update slider
        const slider = document.getElementById('ax_slider');
        if (slider) slider.value = newIdx;

        // Render ONLY the axial window
        requestAnimationFrame(() => {
            axial_openGLRenderWindow.modified();   // ensure it notices the update
            axial_renderWindow.render();           // actually render the new slice
            genericRenderWindow.getRenderWindow().render();
        });

    });

    // Sagittal Slice
    document.getElementById('SagittalSlice').addEventListener('wheel', (event) => {
        event.preventDefault();

        const spacing = vtkImage.getSpacing();     // [sx, sy, sz]
        const origin = vtkImage.getOrigin();       // [ox, oy, oz]
        const extent = vtkImage.getExtent();       // [xmin, xmax, ymin, ymax, zmin, zmax]
        const bounds = vtkImage.getBounds();       // [xmin, xmax, ymin, ymax, zmin, zmax]
        const planeOrigin = sagittal_Plane.getOrigin();

        // Current index along X (sagittal)
        let currentIdx = Math.round((planeOrigin[0] - origin[0]) / spacing[0]);

        const delta = Math.sign(event.deltaY);
        const minIdx = extent[0]; // xmin
        const maxIdx = extent[1]; // xmax

        // Compute new index and clamp
        let newIdx = Math.min(Math.max(currentIdx + delta, minIdx), maxIdx);

        // Compute world coordinate X position for the new slice
        let newX = origin[0] + newIdx * spacing[0];

        // Clamp newX to data bounds (world space)
        // Take the max of the new position and the minimum bound.
        // Then take the minimum of the new position and the maximum bound.
        newX = Math.min(Math.max(newX, bounds[0]), bounds[1]);

        // Update plane
        sagittal_Plane.setOrigin(newX, planeOrigin[1], planeOrigin[2]);

        // Update HTML slider (make sure it's an int)
        const slider = document.getElementById('sa_slider');
        if (slider) slider.value = newIdx.toString();

        // Trigger render
        requestAnimationFrame(() => {
            sagittal_renderer.resetCamera();
            sagittal_openGLRenderWindow.modified();
            sagittal_renderWindow.render();
            genericRenderWindow.getRenderWindow().render()
        });

    });

    // Coronal Slice
    document.getElementById('CoronalSlice').addEventListener('wheel', (event) => {
        event.preventDefault();

        const spacing = vtkImage.getSpacing();     // [sx, sy, sz]
        const origin = vtkImage.getOrigin();       // [ox, oy, oz]
        const extent = vtkImage.getExtent();       // [xmin, xmax, ymin, ymax, zmin, zmax]
        const bounds = vtkImage.getBounds();       // [xmin, xmax, ymin, ymax, zmin, zmax]
        const planeOrigin = coronal_Plane.getOrigin();

        // Current index along Y (coronal)
        let currentIdx = Math.round((planeOrigin[1] - origin[1]) / spacing[1]);

        const delta = Math.sign(event.deltaY);
        const minIdx = extent[2]; // ymin
        const maxIdx = extent[3]; // ymax

        // Compute new index and clamp
        let newIdx = Math.min(Math.max(currentIdx + delta, minIdx), maxIdx);

        // Compute world coordinate Y position for the new slice
        let newY = origin[1] + newIdx * spacing[1];

        // Clamp newY to data bounds (world space)
        newY = Math.min(Math.max(newY, bounds[2]), bounds[3]);

        // Update plane
        coronal_Plane.setOrigin(planeOrigin[0], newY, planeOrigin[2]);

        // Update HTML slider (make sure it's an int)
        const slider = document.getElementById('cor_slider');
        if (slider) slider.value = newIdx.toString();

        // Trigger render
        requestAnimationFrame(() => {
            coronal_renderer.resetCamera();
            coronal_openGLRenderWindow.modified();
            coronal_renderWindow.render();
            genericRenderWindow.getRenderWindow().render()
        });

    });

});


// UPDATE SLIDER RANGES LOGIC -----------------------------------------------------------------
function updateSliderRanges(vtkImage){
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
function updateSliceViews(vtkImage){

    const axial_container = document.getElementById('AxialSlice');
    const sagittal_container = document.getElementById('SagittalSlice');
    const coronal_container = document.getElementById('CoronalSlice');

    // Remove Old Slice Actors.
    if (axial_actor) axial_renderer.removeActor(axial_actor);
    if (sagittal_actor) sagittal_renderer.removeActor(sagittal_actor);
    if (coronal_actor) coronal_renderer.removeActor(coronal_actor);

    axial_Plane.setOrigin(vtkImage.getCenter());
    sagittal_Plane.setOrigin(vtkImage.getCenter());
    coronal_Plane.setOrigin(vtkImage.getCenter());

    // Set Actor Mappers
    axial_actor.setMapper(axial_mapper);
    sagittal_actor.setMapper(sagittal_mapper);
    coronal_actor.setMapper(coronal_mapper);

    // Allocate new mappers to the planes.
    axial_mapper.setSlicePlane(axial_Plane);
    sagittal_mapper.setSlicePlane(sagittal_Plane);
    coronal_mapper.setSlicePlane(coronal_Plane);

    axial_actor.modified();
    sagittal_mapper.modified();
    coronal_mapper.modified();

    // Pass Data from new VTK Image to Mappers
    axial_mapper.setInputData(vtkImage);
    sagittal_mapper.setInputData(vtkImage);
    coronal_mapper.setInputData(vtkImage);

    // Update window/ colour level.
    const [min, max] = vtkImage.getPointData().getScalars().getRange();
    const colorWindow = max - min + 1;
    const colorLevel = (max + min) / 2;

    axial_actor.getProperty().setColorWindow(colorWindow);
    axial_actor.getProperty().setColorLevel(colorLevel);
    sagittal_actor.getProperty().setColorWindow(colorWindow);
    sagittal_actor.getProperty().setColorLevel(colorLevel);
    coronal_actor.getProperty().setColorWindow(colorWindow);
    coronal_actor.getProperty().setColorLevel(colorLevel);

    axial_mapper.modified();
    sagittal_actor.modified();
    coronal_actor.modified();

    // Set up cameras
    let axial_cam = axial_renderer.getActiveCamera();
    axial_cam.setParallelProjection(true);

    let sagittal_cam = sagittal_renderer.getActiveCamera();
    sagittal_cam.setParallelProjection(true);
    sagittal_cam.setPosition(1, 0, 0);
    sagittal_cam.setFocalPoint(0, 0, 0);
    sagittal_cam.setViewUp(0, 0, 1);

    let coronal_cam = coronal_renderer.getActiveCamera();
    coronal_cam.setParallelProjection(true);
    coronal_cam.setPosition(0, 1, 0);
    coronal_cam.setFocalPoint(0, 0, 0);
    coronal_cam.setViewUp(0, 0, 1);

    // Readd the new modified actors.
    axial_renderer.addActor(axial_actor);
    sagittal_renderer.addActor(sagittal_actor);
    coronal_renderer.addActor(coronal_actor);

    // Set up interactors.
    axial_interactor.setView(axial_openGLRenderWindow);
    axial_interactor.setInteractorStyle(vtk.Interaction.Style.vtkInteractorStyleImage.newInstance());
    axial_interactor.initialize();
    axial_interactor.bindEvents(axial_container);

    sagittal_interactor.setView(sagittal_openGLRenderWindow);
    sagittal_interactor.setInteractorStyle(vtk.Interaction.Style.vtkInteractorStyleImage.newInstance());
    sagittal_interactor.initialize();
    sagittal_interactor.bindEvents(sagittal_container);

    coronal_interactor.setView(coronal_openGLRenderWindow);
    coronal_interactor.setInteractorStyle(vtk.Interaction.Style.vtkInteractorStyleImage.newInstance());
    coronal_interactor.initialize();
    coronal_interactor.bindEvents(coronal_container);

    // Reset Camera positions.
    axial_renderer.resetCamera();
    sagittal_renderer.resetCamera();
    coronal_renderer.resetCamera();

    // Rerender the windows to show new data.
    axial_renderWindow.render();
    sagittal_renderWindow.render();
    coronal_renderWindow.render();

    loaded_new = false;

    // Reset sizes and update windows, then render.
    requestAnimationFrame(() => {
        axial_openGLRenderWindow.setSize(axial_container.clientWidth, axial_container.clientHeight);
        sagittal_openGLRenderWindow.setSize(sagittal_container.clientWidth, sagittal_container.clientHeight);
        coronal_openGLRenderWindow.setSize(coronal_container.clientWidth, coronal_container.clientHeight);

        axial_openGLRenderWindow.modified();
        sagittal_openGLRenderWindow.modified();
        coronal_openGLRenderWindow.modified();

        axial_renderWindow.render();
        sagittal_renderWindow.render();
        coronal_renderWindow.render();
    });

    updateSliderRanges(vtkImage);

    return;

}

// SLICE VIEW INITIALIZATION LOGIC ------------------------------------------------------------
function initializeSliceViews(vtkImage){
    
    const axial_container = document.getElementById('AxialSlice');
    const sagittal_container = document.getElementById('SagittalSlice');
    const coronal_container = document.getElementById('CoronalSlice');

    console.log('New image slices!');

    // Create Renderers 
    // Axial
    axial_openGLRenderWindow = vtk.Rendering.OpenGL.vtkRenderWindow.newInstance();
    axial_renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
    axial_renderWindow.addView(axial_openGLRenderWindow);
    axial_renderer = vtk.Rendering.Core.vtkRenderer.newInstance();
    axial_renderWindow.addRenderer(axial_renderer);

    // Sagittal
    sagittal_openGLRenderWindow = vtk.Rendering.OpenGL.vtkRenderWindow.newInstance();
    sagittal_renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
    sagittal_renderWindow.addView(sagittal_openGLRenderWindow);
    sagittal_renderer = vtk.Rendering.Core.vtkRenderer.newInstance();
    sagittal_renderWindow.addRenderer(sagittal_renderer);

    // Coronal
    coronal_openGLRenderWindow = vtk.Rendering.OpenGL.vtkRenderWindow.newInstance();
    coronal_renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
    coronal_renderWindow.addView(coronal_openGLRenderWindow);
    coronal_renderer = vtk.Rendering.Core.vtkRenderer.newInstance();
    coronal_renderWindow.addRenderer(coronal_renderer);

    // Attach GL Windows to Containers and size.
    axial_openGLRenderWindow.setContainer(axial_container);
    sagittal_openGLRenderWindow.setContainer(sagittal_container);
    coronal_openGLRenderWindow.setContainer(coronal_container);

    // Slice Mappers
    axial_mapper = vtk.Rendering.Core.vtkImageResliceMapper.newInstance();
    sagittal_mapper = vtk.Rendering.Core.vtkImageResliceMapper.newInstance();
    coronal_mapper = vtk.Rendering.Core.vtkImageResliceMapper.newInstance();

    // Slice Planes
    axial_Plane = vtk.Common.DataModel.vtkPlane.newInstance();
    axial_Plane.setNormal(0, 0, 1);
    axial_Plane.setOrigin(vtkImage.getCenter());

    sagittal_Plane = vtk.Common.DataModel.vtkPlane.newInstance();
    sagittal_Plane.setNormal(1, 0, 0);
    sagittal_Plane.setOrigin(vtkImage.getCenter());

    coronal_Plane = vtk.Common.DataModel.vtkPlane.newInstance();
    coronal_Plane.setNormal(0, 1, 0);
    coronal_Plane.setOrigin(vtkImage.getCenter());

    // Create Slice Actors
    axial_actor = vtk.Rendering.Core.vtkImageSlice.newInstance();
    sagittal_actor = vtk.Rendering.Core.vtkImageSlice.newInstance();
    coronal_actor = vtk.Rendering.Core.vtkImageSlice.newInstance();

    // Set Actor Mappers
    axial_actor.setMapper(axial_mapper);
    sagittal_actor.setMapper(sagittal_mapper);
    coronal_actor.setMapper(coronal_mapper);

    // Pass Data from VTK Image to Mappers
    axial_mapper.setInputData(vtkImage);
    sagittal_mapper.setInputData(vtkImage);
    coronal_mapper.setInputData(vtkImage);

    axial_mapper.setSlicePlane(axial_Plane);
    sagittal_mapper.setSlicePlane(sagittal_Plane);
    coronal_mapper.setSlicePlane(coronal_Plane);

    // Add Actors to renderers
    axial_renderer.addActor(axial_actor);
    sagittal_renderer.addActor(sagittal_actor);
    coronal_renderer.addActor(coronal_actor);

    // Set up cameras
    let axial_cam = axial_renderer.getActiveCamera();
    axial_cam.setParallelProjection(true);

    let sagittal_cam = sagittal_renderer.getActiveCamera();
    sagittal_cam.setParallelProjection(true);
    sagittal_cam.setPosition(1, 0, 0);
    sagittal_cam.setFocalPoint(0, 0, 0);
    sagittal_cam.setViewUp(0, 0, 1);

    let coronal_cam = coronal_renderer.getActiveCamera();
    coronal_cam.setParallelProjection(true);
    coronal_cam.setPosition(0, 1, 0);
    coronal_cam.setFocalPoint(0, 0, 0);
    coronal_cam.setViewUp(0, 0, 1);

    // Set up interactors.
    axial_interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
    axial_interactor.setView(axial_openGLRenderWindow);
    axial_interactor.setInteractorStyle(vtk.Interaction.Style.vtkInteractorStyleImage.newInstance());
    axial_interactor.initialize();
    axial_interactor.bindEvents(axial_container);

    sagittal_interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
    sagittal_interactor.setView(sagittal_openGLRenderWindow);
    sagittal_interactor.setInteractorStyle(vtk.Interaction.Style.vtkInteractorStyleImage.newInstance());
    sagittal_interactor.initialize();
    sagittal_interactor.bindEvents(sagittal_container);

    coronal_interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
    coronal_interactor.setView(coronal_openGLRenderWindow);
    coronal_interactor.setInteractorStyle(vtk.Interaction.Style.vtkInteractorStyleImage.newInstance());
    coronal_interactor.initialize();
    coronal_interactor.bindEvents(coronal_container);

    // Set Colour levels.
    const [min, max] = vtkImage.getPointData().getScalars().getRange();

    axial_actor.getProperty().setColorWindow(max - min + 1);
    axial_actor.getProperty().setColorLevel((max + min) / 2);

    sagittal_actor.getProperty().setColorWindow(max - min + 1);
    sagittal_actor.getProperty().setColorLevel((max + min) / 2);

    coronal_actor.getProperty().setColorWindow(max - min + 1);
    coronal_actor.getProperty().setColorLevel((max + min) / 2);

    // Renderer backgrounds.
    axial_renderer.setBackground(0, 0, 0);
    sagittal_renderer.setBackground(0, 0, 0);
    coronal_renderer.setBackground(0, 0, 0);

    // Reset Camera positions.
    axial_renderer.resetCamera();
    sagittal_renderer.resetCamera();
    coronal_renderer.resetCamera();

    // Reset sizes and update windows, then render.
    requestAnimationFrame(() => {
        axial_openGLRenderWindow.setSize(axial_container.clientWidth, axial_container.clientHeight);
        sagittal_openGLRenderWindow.setSize(sagittal_container.clientWidth, sagittal_container.clientHeight);
        coronal_openGLRenderWindow.setSize(coronal_container.clientWidth, coronal_container.clientHeight);

        axial_openGLRenderWindow.modified();
        sagittal_openGLRenderWindow.modified();
        coronal_openGLRenderWindow.modified();

        axial_renderWindow.render();
        sagittal_renderWindow.render();
        coronal_renderWindow.render();
    });

    loaded_new = false;
    console.log("Rendered the slice windows!");
    updateSliceViews(vtkImage);

}

function renderVolume(itkImage){
    
    vtkImage = vtk.Common.DataModel.vtkImageData.newInstance();

    const dataArray = vtk.Common.Core.vtkDataArray.newInstance({
        values: itkImage.data,
        numberOfComponents: 1,
        name: 'Scalars',
    });

    vtkImage.setDimensions(itkImage.size[0], itkImage.size[1], itkImage.size[2]);
    vtkImage.setSpacing(itkImage.spacing[0], itkImage.spacing[1], itkImage.spacing[2]);
    vtkImage.setOrigin(itkImage.origin[0], itkImage.origin[1], itkImage.origin[2]);
    vtkImage.getPointData().setScalars(dataArray);

    console.log(vtkImage.getSpacing());       // Check for 0 or negative spacing
    console.log(vtkImage.getDirection());     // Should be identity or orthogonal matrix
    console.log(vtkImage.getOrigin());        // Should be numeric
    console.log(vtkImage.getBounds());
    console.log(vtkImage.getDimensions());
    console.log(vtkImage.getExtent());
    console.log('Scalars: ', vtkImage.getPointData().getScalars());


    const volumeMapper = vtk.Rendering.Core.vtkVolumeMapper.newInstance();
    volumeMapper.setInputData(vtkImage);

    const dataRange = dataArray.getRange();

    // Volume Actor.
    const volume = vtk.Rendering.Core.vtkVolume.newInstance();
    const volumeProperty = vtk.Rendering.Core.vtkVolumeProperty.newInstance();

    const colorTransferFunction = vtk.Rendering.Core.vtkColorTransferFunction.newInstance();
    colorTransferFunction.addRGBPoint(dataRange[0], 0.0, 0.0, 0.0);
    colorTransferFunction.addRGBPoint(dataRange[1], 1.0, 1.0, 1.0);

    volumeProperty.setIndependentComponents(true);
    volumeProperty.setRGBTransferFunction(0, colorTransferFunction);

    const scalarOpacityFunction = vtk.Common.DataModel.vtkPiecewiseFunction.newInstance();
    scalarOpacityFunction.addPoint(dataRange[0], 0.0);
    scalarOpacityFunction.addPoint(dataRange[1], 1.0);
    volumeProperty.setScalarOpacity(0, scalarOpacityFunction);

    volumeProperty.setInterpolationTypeToLinear();
    volume.setMapper(volumeMapper);
    volume.setProperty(volumeProperty);

    volumeActor = volume;

    // Clear Previous Scene
    renderer.removeAllViewProps();
    renderer.addVolume(volume);
    renderer.resetCamera();
    renderWindow.render();
}

