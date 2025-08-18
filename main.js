// Global Variable Imports.
import { globals } from './globals.js';

// 2D View Globals.
import { pause, play, disableTwoD, scroll_2d, clearFrameMemory, loadFrame, preloadFrames } from './twoDRendering.js';

// 3D View Globals.
import { renderVolume, disableThreeD } from './volumeRendering.js';

// Slice View Globals.
import { closeSliceViews, initializeSliceViews, updateSliceViews } from './sliceRendering.js';

// ITK Import
import { readImageDicomFileSeries } from 'https://cdn.jsdelivr.net/npm/@itk-wasm/dicom@latest/dist/bundle/index-worker-embedded.min.js';

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
            closeSliceViews(vol_container, sliders);
        }

        // Clear old pre-existing 2D frame memory.
        clearFrameMemory();

        // Initialize 2D environment.
        disableThreeD();
        pause();
        document.getElementById('twoD-controls').style.display = "flex";
        
        // If there is already a canvas, delete it before adding a new one.
        if (document.getElementById('twoD-canvas') != null){
            document.getElementById('twoD-canvas').remove();
            document.getElementById('annotation-canvas').remove();
        } 
        
        const file = event.target.files[0];

        if (!(file.name.toLowerCase().endsWith('.dicom') || file.name.toLowerCase().endsWith('.dcm') || file.name.endsWith('.mp4'))){
            alert(`Please select a valid DICOM or MP4 file.`);
            return;
        }

        if (file.name.toLowerCase().endsWith('.dicom') || file.name.toLowerCase().endsWith('.dcm')){
            globals.is2dMode = true;
            const arrayBuffer = await file.arrayBuffer();

            // Start loading DICOM.
            const dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
            const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);

            // Start at frame 0.
            globals.frameIndex = 0;
            globals.pixelDataArrayBuffers = dataset.PixelData;
            

            if (!globals.pixelDataArrayBuffers || globals.pixelDataArrayBuffers.length === 0) {
                console.error('No PixelData found.');
                return;
            }

            // Set canvas and DICOM info.
            globals.frameCount = globals.pixelDataArrayBuffers.length;
            globals.canvas = document.createElement('canvas');
            globals.canvas.id = "twoD-canvas";

            // Create Annotation Canvas
            globals.annotation_canvas = document.createElement('canvas');
            globals.annotation_canvas.id = "annotation-canvas";

            // Add in canvas and hide 3D renderer. Insert rendering canvas before controls and annotation canvas after rendering canvas.
            document.getElementById('canvas-wrapper').appendChild(globals.canvas);
            document.getElementById('canvas-wrapper').insertBefore(globals.annotation_canvas, globals.canvas);

            // Display and hide elements.
            document.getElementById('render-area').style.display = "none";
            document.getElementById('twoD-main-container').style.display = "flex";
            document.getElementById('twoD-render-area').style.display = "flex";

            // Get contexts for canvas'.
            globals.ctx = globals.canvas.getContext('2d');
            globals.annotation_ctx = globals.annotation_canvas.getContext('2d');

            // Fill the frame objects with null values.
            globals.imageObjects = new Array(globals.frameCount).fill(null);
            globals.urls = new Array(globals.frameCount).fill(null);

            // Assign canvas dimentsions and max slider value.

            globals.canvas.width = dataset.Columns;
            globals.canvas.height = dataset.Rows;

            globals.annotation_canvas.width = globals.canvas.width;
            globals.annotation_canvas.height = globals.canvas.height;

            globals.canvas.style.width = "1024px";
            globals.canvas.style.height = "768px";
            globals.annotation_canvas.style.width = "1024px";
            globals.annotation_canvas.style.height = "768px";

            globals.rect = globals.annotation_canvas.getBoundingClientRect();

            globals.scaleX = globals.canvas.width / globals.rect.width;
            globals.scaleY = globals.canvas.height / globals.rect.height;

            document.getElementById('canvas-wrapper').style.width = globals.canvas.style.width;
            document.getElementById('canvas-wrapper').style.height = globals.canvas.style.height;

            document.getElementById('twoD-render-area').style.width = `${document.getElementById('twoD-canvas').clientWidth}px`;

            // Setup slider.
            document.getElementById('twoD-slider').max = globals.frameCount - 1;
            document.getElementById('twoD-slider').style.width = (document.getElementById('twoD-render-area').clientWidth - 300) + 'px';

            await loadFrame(0);
            preloadFrames(0);


            // Start playback.
            play();

            document.getElementById('annotation-canvas').addEventListener('wheel', scroll_2d);

        }

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
                    const { outputImage, webWorkerPool } = await readImageDicomFileSeries({ inputImages: dicomFiles, numberOfWorkers: 1, });
                    webWorkerPool.terminateWorkers();
                    globals.itkImage = outputImage;
                } catch (err) {
                    console.error('Error inside readImageDicomFileSeries:', err);
                    throw err; // rethrow if needed
                }
                
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

    // SINGLE FILE INPUT LOGIC (3D DICOM) --------------------------------------------------
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
        if(!file || !(file.name.endsWith('.dcm') || file.name.endsWith('.dicom'))){
            alert(`Please select a valid DICOM file`);
        }

        // Default when loading new volume is that it is displayed and that slices are not displayed.
        document.getElementById('dispVolBox').checked = true;
        document.getElementById('dispSlicesBox').checked = false;

        // SINGLE DICOM FILE LOGIC --------------------------------------------------------------

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
        const axial_container = document.getElementById('AxialSlice');
        const sagittal_container = document.getElementById('SagittalSlice');
        const coronal_container = document.getElementById('CoronalSlice');
        const view_grid = document.getElementById('vol-slice-grid');

        globals.isSliceMode = !globals.isSliceMode;
        
        if (globals.isSliceMode && globals.vtkImage){
            console.log('Switching to Slice View');

            // Enable sliders.
            sliders.style.display = 'block';

            // Set grid to 2x2
            view_grid.style.gridTemplateColumns = "1fr 1fr";
            view_grid.style.gridTemplateRows = "1fr 1fr";

            // Set new constrains to volume window.
            vol_container.style.flex = '1';

            // Set Slice Columns to grids.
            for (const column of document.getElementsByClassName('sliceColumn')) {
                column.style.display = 'grid';
            }

            // Set containers to blocks.
            axial_container.style.display = 'block';
            sagittal_container.style.display = 'block';
            coronal_container.style.display = 'block';

            // Render windows dont exist yet so, complete setup.
            if (!globals.axial_renderWindow){
                initializeSliceViews(globals.vtkImage);
            }
            // Render Windows already exist so just update input data for slices.
            else if (globals.axial_renderWindow && globals.loaded_new){
                updateSliceViews(globals.vtkImage);
            }

            // If the axial actor already exists then we need to re-display them.
            if (globals.axial_actor){
                globals.axial_renderer.addActor(globals.axial_actor);
                globals.sagittal_renderer.addActor(globals.sagittal_actor);
                globals.coronal_renderer.addActor(globals.coronal_actor);
            }

            // Enable slice interactors.
            globals.axial_interactor.enable();
            globals.sagittal_interactor.enable();
            globals.coronal_interactor.enable();
            
        } else {
            console.log('Closing Slice Views');
            closeSliceViews(vol_container, sliders);

            // Disable slice interactors.
            globals.axial_interactor.disable();
            globals.sagittal_interactor.disable();
            globals.coronal_interactor.disable();
        }
        
        // Reset camera position to default
        globals.genericRenderWindow.resize();
        globals.renderer.resetCamera();
        globals.renderWindow.render();

    });

});