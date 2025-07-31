// RENDER GLOBALS
import { globals } from './globals.js';
import { buttonMap } from './sliceRendering.js';

// RENDER VOLUME LOGIC ------------------------------------------------------------------------
export function renderVolume(itkImage){
    
    globals.vtkImage = vtk.Common.DataModel.vtkImageData.newInstance();

    const dataArray = vtk.Common.Core.vtkDataArray.newInstance({
        values: itkImage.data,
        numberOfComponents: 1,
        name: 'Scalars',
    });

    globals.vtkImage.setDimensions(itkImage.size[0], itkImage.size[1], itkImage.size[2]);
    globals.vtkImage.setSpacing(itkImage.spacing[0], itkImage.spacing[1], itkImage.spacing[2]);
    globals.vtkImage.setOrigin(itkImage.origin[0], itkImage.origin[1], itkImage.origin[2]);
    globals.vtkImage.getPointData().setScalars(dataArray);

    const volumeMapper = vtk.Rendering.Core.vtkVolumeMapper.newInstance();
    volumeMapper.setInputData(globals.vtkImage);

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

    globals.volumeActor = volume;

    volumeInteractorSetup();

    // Clear Previous Scene
    globals.renderer.removeAllViewProps();
    globals.renderer.addVolume(volume);
    globals.renderer.resetCamera();
    globals.renderWindow.render();
}

// 3D DISABLE LOGIC ----------------------------------------------------------------------------
export function disableThreeD(){
    document.getElementById('vol-slice-grid').style.display = "none";
}

// INTERACTOR SETUP LOGIC ----------------------------------------------------------------------
export function volumeInteractorSetup(){

    // Set Manipulator styles and remove all pre-existing manipulators.
    const manipulatorStyle = vtk.Interaction.Style.vtkInteractorStyleManipulator.newInstance();

    globals.renderWindow.getInteractor().setInteractorStyle(manipulatorStyle);

    manipulatorStyle.removeAllMouseManipulators();

    // Add Rotate Manipulator on left button click.
    manipulatorStyle.addMouseManipulator(vtk.Interaction.Manipulators.vtkMouseCameraTrackballRotateManipulator.newInstance(buttonMap.leftButton));

    // Add Pan manipulator on scroll wheel click.
    manipulatorStyle.addMouseManipulator(vtk.Interaction.Manipulators.vtkMouseCameraTrackballPanManipulator.newInstance(buttonMap.middleButton));

    // Add Zoom to scroll wheel.
    manipulatorStyle.addMouseManipulator(vtk.Interaction.Manipulators.vtkMouseCameraTrackballZoomManipulator.newInstance(buttonMap.scrollMiddleButton));

    // Add gesture manipulator so we can interact with the volume.
    manipulatorStyle.addGestureManipulator(vtk.Interaction.Manipulators.vtkGestureCameraManipulator.newInstance());

}

// CHECKBOX LOGIC ------------------------------------------------------------------------------

// Slices Checkbox logic
document.getElementById('dispSlicesBox').addEventListener('click', () => {
    // Grab the display checkbox.
    const displayBox = document.getElementById('dispSlicesBox');

    // Display logic.
    if (displayBox.checked) {
        if (globals.axial_actor) globals.renderer.addActor(globals.axial_actor);
        if (globals.sagittal_actor) globals.renderer.addActor(globals.sagittal_actor);
        if (globals.coronal_actor) globals.renderer.addActor(globals.coronal_actor);
    }
    else {
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
    if (volBox.checked && (globals.volumeActor != null)) {
        globals.renderer.addActor(globals.volumeActor);
    }
    else if (!volBox.checked && (globals.volumeActor != null)) {
        globals.renderer.removeActor(globals.volumeActor);
    }

    globals.genericRenderWindow.getRenderWindow().render();
});