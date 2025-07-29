// Global Variable Imports.
import { globals } from './globals.js';

// 2D View Globals.
import { pause, play, disableTwoD } from './twoDRendering.js';

// 3D View Globals.
import { renderVolume, disableThreeD } from './volumeRendering.js';

// Slice View Globals.
import { closeSliceViews, initializeSliceViews, updateSliceViews } from './sliceRendering.js';

// ITK Import
import { readImageDicomFileSeries } from 'https://cdn.jsdelivr.net/npm/@itk-wasm/dicom@latest/dist/bundle/index-worker-embedded.min.js';
// import { readImage } from 'https://cdn.jsdelivr.net/npm/@itk-wasm/image-io@latest/dist/bundle/index-worker-embedded.min.js';

// DOM Load confirmation and website initialization.
window.addEventListener('DOMContentLoaded', () => {

    // RENDERER CONTAINER
    const containerRef = document.getElementById('vtk-vol_container');

    if(!containerRef || !window.vtk || !window.dcmjs){
        console.error('Elements or libraries not loaded.');
        return;
    }

    containerRef.style.display = 'block';
    containerRef.style.visibility = 'visible';

    // Create the Render Window.
    globals.genericRenderWindow = vtk.Rendering.Misc.vtkGenericRenderWindow.newInstance();

    // Ensure that the window is associated with the div.
    globals.genericRenderWindow.setContainer(containerRef);

    // Grab references to the renderer and window.
    globals.renderer = globals.genericRenderWindow.getRenderer();
    globals.renderWindow = globals.genericRenderWindow.getRenderWindow();
    globals.renderer.setBackground(0.031, 0.309, 0.435);    
    globals.genericRenderWindow.resize();

    requestAnimationFrame(() => {
        globals.renderer.resetCamera();
        // Render the scene.
        globals.renderWindow.render();
    });
    
    
    // SINGLE FILE INPUT LOGIC (2D DICOM) -------------------------------------------------------
    const singleFileInput = document.getElementById('twodInput');

    if(!singleFileInput){
        console.warn('File input not found');
        return;
    }

    singleFileInput.addEventListener('change', async (event) => {
        
        // Close Slice Views if open.
        if(globals.isSliceMode){
            const sliders = document.getElementById('slice-sliders');
            const vol_container = document.getElementById('vtk-vol_container');
            const slice_container = document.getElementById('sliceRow');
            closeSliceViews(vol_container, slice_container, sliders);
        }

        // Initialize 2D environment.
        disableThreeD();
        pause();
        document.getElementById('twoD-controls').style.display = "flex";
        
        // If there is already a canvas, delete it before adding a new one.
        if (document.getElementById('twoD-canvas') != null) document.getElementById('twoD-canvas').remove();
        
        const file = event.target.files[0];

        if(!(file.name.endsWith('.dicom') || file.name.endsWith('.dcm'))){
            alert(`Please select a valid file: .dcm or .dicom file.`);
            return;
        }

        globals.is2dMode = true;
        const arrayBuffer = await file.arrayBuffer();
        
        // Start loading DICOM.
        const dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
        const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);

        // Start at frame 0.
        globals.frameIndex = 0;
        const pixelDataArrayBuffers = dataset.PixelData;

        if(!pixelDataArrayBuffers || pixelDataArrayBuffers.length === 0){
            console.error('No PixelData found.');
            return;
        }
        
        // Set canvas and DICOM info.
        globals.frameCount = pixelDataArrayBuffers.length;
        globals.canvas = document.createElement('canvas');
        globals.canvas.id = "twoD-canvas";
        
        // Add in canvas and hide 3D renderer.
        document.getElementById('twoD-render-area').insertBefore(globals.canvas, document.getElementById('twoD-controls'));
        document.getElementById('render-area').style.display = "none";
        document.getElementById('twoD-render-area').style.display = "flex";
        globals.ctx = globals.canvas.getContext('2d');

        globals.imageObjects = new Array(globals.frameCount);
        
        // Load image data into a URL JPEG blob.
        for (let i = 0; i < globals.frameCount; i++){
            const frameBuffer = pixelDataArrayBuffers[i];
            const blob = new Blob([frameBuffer], { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);

            // Add images into array for storage.
            const img = new Image();
            img.src = url;
            globals.imageObjects[i] = img;
        }

        // Ensure all images are loaded correctly.
        let allLoaded = Promise.all(globals.imageObjects.map(img => {
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        }));

        // Once all loaded.
        allLoaded.then(() => {
            // Assign canvas dimentsions and max slider value.
            globals.canvas.width = globals.imageObjects[0].width;
            globals.canvas.height = globals.imageObjects[0].height;
            document.getElementById('twoD-slider').max = globals.frameCount - 1;            
            // Set Slider width to video width.
            document.getElementById('twoD-slider').style.width = (document.getElementById('twoD-canvas').clientWidth - 60) + 'px';

            // Start playback.
            play();

        });

    });

    // 2D DICOM PLAY/PAUSE BUTTON LOGIC ----------------------------------------------------------
    document.getElementById('twoD-play-pause').addEventListener("click", () => {
        if (globals.isPlaying) pause();
        else play();
    });

    // MULTI-DICOM SERIES FILE INPUT LOGIC (3D DICOM) --------------------------------------------
    const dicomInput = document.getElementById('dicomInput');

    if (!dicomInput) {
        console.warn('Directory not found');
        return;
    }

    dicomInput.addEventListener('change', async (event) => {
        // Grab files from directory.
        const files = Array.from(event.target.files);
        const dicomFiles = Array.from(files).filter((file) => file instanceof File && file.name.toLowerCase().endsWith('.dcm'));
        
        // Send warning if no files.
        if (dicomFiles.length === 0) {
            alert('No DICOM files found in the selected folder.');
            return;
        }
        
        // Set Disp Volume Checkbox to checked and slices box to not checked
        document.getElementById('dispVolBox').checked = true;
        document.getElementById('dispSlicesBox').checked = false;
        document.getElementById('vtk-vol_container').style.display = "block";
        disableTwoD();
        console.log("Disabled 2D");
        document.getElementById('render-area').style.display = "flex";
        
        try {

            // If there is only 1 DICOM then only use readImage instead of the series reader.
            if (dicomFiles.length == 1) {
                const file = dicomFiles[0];

                if (!(file instanceof File)) {
                    throw new TypeError("Expected a File object");
                }

                // Read in data into image variable, itkImage reference.
                const { outputImage, webWorkerPool } = await readImageDicomFileSeries({ inputImages: [file], numberOfWorkers: 1 });
                webWorkerPool.terminateWorkers();
                globals.itkImage = outputImage;

            }

            else {

                // Check if every file is valid in the series.
                const allFilesAreValid = dicomFiles.every(f => f instanceof File);
                if (!allFilesAreValid) {
                    throw new TypeError("All files must be File objects");
                }

                // Read the whole series into image.        
                try {
                    console.log('Starting to load DICOM series...');
                    const { outputImage, webWorkerPool } = await readImageDicomFileSeries({ inputImages: dicomFiles, numberOfWorkers: 1, });
                    webWorkerPool.terminateWorkers();
                    globals.itkImage = outputImage;
                } catch (err) {
                    console.error('Error inside readImageDicomFileSeries:', err);
                    throw err; // rethrow if needed
                }
                
                console.log("FINISHED LOADING")
            }

            // Ensure that image has data.
            if (!globals.itkImage || !globals.itkImage.data) {
                throw new Error('Parsed image is null or missing data');
            }

            globals.loaded_new = true;

            // Render volume.
            renderVolume(globals.itkImage);

        }

        catch (error) {
            console.error('Error loading DICOM series:', error);
            alert('Failed to load DICOM folder. Ensure it contains all valid DICOM series.');
        }

        const resizeObserver = new ResizeObserver(() => {
            // Reset cameras and rerender.
            globals.genericRenderWindow.resize();
            globals.renderer.resetCamera();
            globals.renderer.getActiveCamera().azimuth(0);
            globals.renderWindow.render();
        });

        resizeObserver.observe(containerRef);

        // If slices already exist, update slice data.
        if (globals.axial_renderWindow && globals.loaded_new && globals.isSliceMode) {
            updateSliceViews(globals.vtkImage);
        }

    });

    // SINGLE FILE INPUT LOGIC (NRRD/3D DICOM) --------------------------------------------------
    const fileInput = document.getElementById('fileInput');
    
    if(!fileInput){
        console.warn('File input not found');
        return;
    }

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if(!file){
            alert('No File selected');
            return;
        }
        
        // Set Disp Volume Checkbox to checked and slices box to not checked
        document.getElementById('dispVolBox').checked = true;
        document.getElementById('dispSlicesBox').checked = false;
        document.getElementById('vtk-vol_container').style.display = "block";
        disableTwoD();
        document.getElementById('render-area').style.display = "flex";

        // Alert user.
        if(!file || !(file.name.endsWith('.nrrd') || file.name.endsWith('.dcm') || file.name.endsWith('.dicom'))){
            alert(`Please select a valid file: .nrrd, .dcm, or .dicom files.`);
        }

        // Default when loading new volume is that it is displayed and that slices are not displayed.
        document.getElementById('dispVolBox').checked = true;
        document.getElementById('dispSlicesBox').checked = false;

        // NRRD FILE LOGIC ----------------------------------------------------------------------
        if (file.name.endsWith('.nrrd')) {
            console.log("NRRD Functionality Disabled, Please use DICOM Series");
            // console.log("Starting to load NRRD File...")

            // // // Read NRRD with ITK-Wasm
            // const { outputImage, webWorkerPool } = await readImage({ serializedFile: [file], numberOfWorkers: 1 });
            
            // webWorkerPool.terminateWorkers();
            // globals.itkImage = outputImage;

            // // Update boolean
            // globals.loaded_new = true;

            // // Render volume.
            // renderVolume(globals.itkImage);

        }

        // SINGLE DICOM FILE LOGIC --------------------------------------------------------------
        if (file.name.endsWith('.dcm') || file.name.endsWith('.dicom')){

            console.log("HERE");

            if (!(file instanceof File)){
                throw new TypeError("Expected a File object");
            }

            // 3D Volume
            // Read in data into image variable, itkImage reference.
            const { outputImage, webWorkerPool } = await readImageDicomFileSeries({ inputImages: [file], numberOfWorkers: 1 });
            webWorkerPool.terminateWorkers();
            globals.itkImage = outputImage;

            globals.loaded_new = true;

            // Render the volume.
            renderVolume(globals.itkImage);
        }

        const resizeObserver = new ResizeObserver(() => {
            // Reset cameras and rerender.
            globals.genericRenderWindow.resize();
            globals.renderer.resetCamera();
            globals.renderer.getActiveCamera().azimuth(0);
            globals.renderWindow.render();
        });

        resizeObserver.observe(containerRef);

        // If slices already exist, update slice data.
        if (globals.axial_renderWindow && globals.loaded_new && globals.isSliceMode){
            updateSliceViews(globals.vtkImage);
        }

    });

    // SLICE TOGGLE LOGIC ----------------------------------------------------------------------
    document.getElementById('toggleSlice').addEventListener('click', () => {

        // If 2D Views are enabled, dont do anything if toggle slice is clicked, present an alert to the user.
        if(globals.is2dMode){
            alert("2D Mode is enabled, switch to 3D Mode before slices can be created.");
            return;
        }

        // Get Containers
        const sliders = document.getElementById('slice-sliders');
        const vol_container = document.getElementById('vtk-vol_container');
        const slice_container = document.getElementById('sliceRow');
        const axial_container = document.getElementById('AxialSlice');
        const sagittal_container = document.getElementById('SagittalSlice');
        const coronal_container = document.getElementById('CoronalSlice');

        globals.isSliceMode = !globals.isSliceMode;
        
        if (globals.isSliceMode && globals.vtkImage){
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
            slice_container.style.display = 'grid';

            // Render windows dont exist yet so, complete setup.
            if (!globals.axial_renderWindow){
                initializeSliceViews(globals.vtkImage);
            }
            // Render Windows already exist so just update input data for slices.
            else if (globals.axial_renderWindow && globals.loaded_new){
                updateSliceViews(globals.vtkImage);
            }
            
        } else {
            console.log('Closing Slice Views');

            closeSliceViews(vol_container, slice_container, sliders);
        }

        // Reset camera position to default
        globals.genericRenderWindow.resize();
        globals.renderer.resetCamera();
        globals.renderWindow.render();

    });

    // CHECKBOX LOGIC --------------------------------------------------------------------------
    
    // Slices Checkbox logic
    document.getElementById('dispSlicesBox').addEventListener('click', () => {
        // Grab the display checkbox.
        const displayBox = document.getElementById('dispSlicesBox');

        // Display logic.
        if (displayBox.checked){
            if (globals.axial_actor) globals.renderer.addActor(globals.axial_actor);
            if (globals.sagittal_actor) globals.renderer.addActor(globals.sagittal_actor);
            if (globals.coronal_actor) globals.renderer.addActor(globals.coronal_actor);
        }
        else{
            if (globals.axial_actor) globals.renderer.removeActor(globals.axial_actor);
            if (globals.sagittal_actor) globals.renderer.removeActor(globals.sagittal_actor);
            if (globals.coronal_actor) globals.renderer.removeActor(globals.coronal_actor);
        }

        globals.genericRenderWindow.getRenderWindow().render();  
    });

    // Volume Checkbox logic
    document.getElementById('dispVolBox').addEventListener('click', () => {
        // Grab the volume checkbox.
        const volBox = document.getElementById('dispVolBox');

        // Display Logic
        if (volBox.checked && (globals.volumeActor != null)){
            globals.renderer.addActor(globals.volumeActor);
        }
        else if (!volBox.checked && (globals.volumeActor != null)){
            globals.renderer.removeActor(globals.volumeActor);
        }

        globals.genericRenderWindow.getRenderWindow().render();  
    });
    
    // SLIDER LOGIC -----------------------------------------------------------------------------

    // Axial Slider logic
    document.getElementById('ax_slider').addEventListener('input', (event) => {
        const spacing = globals.vtkImage.getSpacing();
        const origin = globals.vtkImage.getOrigin();
        const zIndex = Number(event.target.value);
        const zCoord = origin[2] + zIndex * spacing[2];
        globals.axial_Plane.setOrigin(origin[0], origin[1], zCoord);
        
        requestAnimationFrame(() => {
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
        
        requestAnimationFrame(() => {
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
        
        requestAnimationFrame(() => {
            globals.coronal_renderWindow.render();
            globals.genericRenderWindow.getRenderWindow().render();
        });

    });

    // 2D DICOM Video Slider Logic
    document.getElementById('twoD-slider').addEventListener('input', (event) => {
        pause();
        globals.frameIndex = parseInt(event.target.value);
        globals.ctx.clearRect(0, 0, globals.canvas.width, globals.canvas.height);
        globals.ctx.drawImage(globals.imageObjects[globals.frameIndex], 0, 0);
    });


    // SCROLL SLIDER UPDATES LOGIC ----------------------------------------------------------------
    
    // Axial Slice
    document.getElementById('AxialSlice').addEventListener('wheel', (event) => {
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

        // Update slider
        const slider = document.getElementById('ax_slider');
        if (slider) slider.value = newIdx;

        // Render ONLY the axial window
        requestAnimationFrame(() => {
            globals.axial_openGLRenderWindow.modified();   // ensure the render window notices the update.
            globals.axial_renderWindow.render();           
            globals.genericRenderWindow.getRenderWindow().render();
        });

    });

    // Sagittal Slice
    document.getElementById('SagittalSlice').addEventListener('wheel', (event) => {
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

        // Update HTML slider (make sure it's an int).
        const slider = document.getElementById('sa_slider');
        if (slider) slider.value = newIdx.toString();

        // Trigger render.
        requestAnimationFrame(() => {
            globals.sagittal_renderer.resetCamera();
            globals.sagittal_openGLRenderWindow.modified();
            globals.sagittal_renderWindow.render();
            globals.genericRenderWindow.getRenderWindow().render()
        });

    });

    // Coronal Slice
    document.getElementById('CoronalSlice').addEventListener('wheel', (event) => {
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
        globals.coronal_Plane.setOrigin(planeOrigin[0], newY , planeOrigin[2]);

        // Update HTML slider (make sure it's an int).
        const slider = document.getElementById('cor_slider');
        if (slider) slider.value = newIdx.toString();

        // Trigger render.
        requestAnimationFrame(() => {
            globals.coronal_renderer.resetCamera();
            globals.coronal_openGLRenderWindow.modified();
            globals.coronal_renderWindow.render();
            globals.genericRenderWindow.getRenderWindow().render()
        });


    });

});