// RENDER GLOBALS
import { globals } from './globals.js'

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

    // console.log(vtkImage.getSpacing());       // Check for 0 or negative spacing
    // console.log(vtkImage.getDirection());     // Should be identity or orthogonal matrix
    // console.log(vtkImage.getOrigin());        // Should be numeric
    // console.log(vtkImage.getBounds());
    // console.log(vtkImage.getDimensions());
    // console.log(vtkImage.getExtent());
    // console.log('Scalars: ', vtkImage.getPointData().getScalars());

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

    // Clear Previous Scene
    globals.renderer.removeAllViewProps();
    globals.renderer.addVolume(volume);
    globals.renderer.resetCamera();
    globals.renderWindow.render();
}

// 3D DISABLE LOGIC ----------------------------------------------------------------------------
export function disableThreeD(){
    document.getElementById('vtk-vol_container').style.display = "none";
    document.getElementById('sliceRow').style.display = "none";
}