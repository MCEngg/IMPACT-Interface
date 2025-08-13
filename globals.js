export const globals = {
    
    // Main Render Window Globals.
    genericRenderWindow: null,
    renderWindow: null,

    // 3D View Globals.
    renderer: null,
    volumeActor: null,
    itkImage: null,
    vtkImage: null,

    // 2D View Globals.
    frameCount: null,
    frameIndex: null,
    isPlaying: false,
    fps: 10,
    animationInterval: null,
    ctx: null,
    canvas: null,
    imageObjects: null,
    is2dMode: false,
    urls: null,

    // Annotation Globals.
    annotation_canvas: null,
    annotation_ctx: null,
    show_annotations: true,

    selected_annotation: false,
    anno_designator: null,
    modifying_annotation: false,
    modif_anno_info: null,

    annotating: false,

    // Box Annotation.
    boxAnnotating: false,
    multiBoxAnnotating: false,
    multiPlaced: false,
    start_frame: 0,
    box_bounds_selected: 0,
    box_id: 0,

    // Polygon Annotation.
    polyAnnotating: false,
    oc_polyAnnotation: false,
    poly_start_selected: false,
    polygon_id: 0,

    mouseX: 0,
    mouseY: 0,
    lastMouseX: 0,
    lastMouseY: 0,

    

    // Slice Rendering Globals.
    loaded_new: false,
    isSliceMode: false,
    
    axial_renderer: null,
    sagittal_renderer: null,
    coronal_renderer: null,

    axial_renderWindow: null,
    sagittal_renderWindow: null,
    coronal_renderWindow: null,

    axial_openGLRenderWindow: null,
    sagittal_openGLRenderWindow: null,
    coronal_openGLRenderWindow: null,

    axial_actor: null,
    sagittal_actor: null,
    coronal_actor: null,

    axial_mapper: null,
    sagittal_mapper: null,
    coronal_mapper: null,

    axial_interactor: null,
    sagittal_interactor: null,
    coronal_interactor: null,

    axial_Plane: null,
    sagittal_Plane: null,
    coronal_Plane: null,

    slice_Animations: null,
}