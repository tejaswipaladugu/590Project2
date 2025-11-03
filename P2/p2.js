console.clear();

let canvases = ['xz', 'yz', 'xy', 'xyz']
let contexts = [];

let at = vec3(0.0, 0.0, 0.0);

let xz_up = vec3(0.0, 0.0, -1.0);
let yz_up = vec3(0.0, 1.0, 0.0);
let xy_up = vec3(0.0, 1.0, 0.0);
let xyz_up = vec3(0.0, 0.5, 0.0);

let xz_eye = vec3(0.0, 0.5, 0.0);
let yz_eye = vec3(0.5, 0.0, 0.0);
let xy_eye = vec3(0.0, 0.0, 0.5);
let xyz_eye = vec3(-0.15, -0.15, 0.35);

let viewMatrices = [lookAt(xz_eye, at, xz_up), lookAt(yz_eye, at, yz_up), lookAt(xy_eye, at, xy_up), lookAt(xyz_eye, at, xyz_up)]

let uniform_props = null;
let uniform_color = null;
let uniform_z_translation = null;
let uniform_view = null;

let attr_vertex = null;
let vertex_data = [];
const scale = 1.75;
const size = 3;
let plane_end_index = 0;
let propeller_end_index = 0;

// ----------------------------------------------
// Axis data (do not modify)
// ----------------------------------------------

let A = [
    [0.0, 0.0, 0.0],
    [1.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 1.0]
];

// ----------------------------------------------
// end axis data
// ----------------------------------------------

// ----------------------------------------------
// Simuation control (do not modify)
// ----------------------------------------------

let xang = 0;
let yang = 0;
let zang = 0;
let rot = 0;
let axisRotation = null;
let rot_inc = 10;

function startRotation(rotationFunc) {
    if (axisRotation !== null) clearInterval(axisRotation);
    axisRotation = setInterval(rotationFunc, 100);
}

function stopRotation() {
    clearInterval(axisRotation);
    axisRotation = null;
}

document.addEventListener('mouseup', stopRotation);

document.addEventListener('mousedown', function (event) {
    switch ( event.target.id ) {
        case "pitch-up":
            startRotation(() => { xang = ( xang + rot_inc ) % 360; });
            break;
        case "pitch-down":
            startRotation(() => { xang = ( xang - rot_inc ) % 360; });
            break;
        case "roll-left":
            startRotation(() => { zang = ( zang + rot_inc ) % 360; });
            break;
        case "roll-right":
            startRotation(() => { zang = ( zang - rot_inc ) % 360; });
            break;
        case "yaw-left":
            startRotation(() => { yang = ( yang + rot_inc ) % 360; });
            break;
        case "yaw-right":
            startRotation(() => { yang = ( yang - rot_inc ) % 360; });
            break;
        case "reset":
            xang = yang = zang = 0; 
            break;
        default:
            stopRotation();
    }
});

// ----------------------------------------------
// End simuation control
// ----------------------------------------------

function createVertexData() {

    let row = 0;
    
    for ( let i=0; i<Fpl.length; i++ ) {
        
        vertex_data[row++] = Vpl[ Fpl[i][0] ];
        vertex_data[row++] = Vpl[ Fpl[i][1] ];
        vertex_data[row++] = Vpl[ Fpl[i][2] ];
        
    }
    
    plane_end_index = vertex_data.length;

    for ( let i=0; i<Fpp.length; i++ ) {
        
        vertex_data[row++] = Vpp[ Fpp[i][0] ];
        vertex_data[row++] = Vpp[ Fpp[i][1] ];
        vertex_data[row++] = Vpp[ Fpp[i][2] ];
        
    }

    propeller_end_index = vertex_data.length;
    
    for ( let i=0; i<A.length; i++ ) {
         vertex_data[row++] = A[i];
    }
    
}

function configure() {
    for (let i = 0; i < canvases.length; i++) {
        canvas = document.getElementById(canvases[i]);
    
        webgl_context = canvas.getContext( "webgl" );
        program = initShaders( webgl_context, "vertex-shader", "fragment-shader" );
        webgl_context.useProgram( program );
    
        webgl_context.viewport( 0, 0, canvas.width, canvas.height );
        webgl_context.enable( webgl_context.DEPTH_TEST );
       
        attr_vertex = webgl_context.getAttribLocation( program, "vertex" );

        uniform_props = webgl_context.getUniformLocation( program, "props" );
        uniform_color = webgl_context.getUniformLocation( program, "color" );
        uniform_view = webgl_context.getUniformLocation( program, "View");
        uniform_z_translation = webgl_context.getUniformLocation( program, "z_translation");

        webgl_context.uniformMatrix4fv(uniform_view, false, flatten(viewMatrices[i]));

        contexts.push(webgl_context);
    }
}

function allocateMemory() {
    for (let i = 0; i < contexts.length; i++) {
        let buffer_id = contexts[i].createBuffer();
        contexts[i].bindBuffer( contexts[i].ARRAY_BUFFER, buffer_id );
        contexts[i].vertexAttribPointer( attr_vertex, size, contexts[i].FLOAT, false, 0, 0 );
        contexts[i].enableVertexAttribArray( attr_vertex );
        contexts[i].bufferData( contexts[i].ARRAY_BUFFER, flatten(vertex_data), contexts[i].STATIC_DRAW );
    }   
}

function draw() {
    for (let i = 0; i < contexts.length; i++) { 
        
        webgl_context.uniform4f( uniform_props, 
            radians( parseFloat( xang ) ),  
            radians( parseFloat( yang ) ),  
            radians(rot),  
            parseFloat( document.getElementById("scale").value ) );
        
        webgl_context.uniform1f( uniform_z_translation, parseFloat( document.getElementById("ztrans").value ));
        
        let i = 0;
        let j = 0;   
        
        webgl_context.uniform4f( uniform_color, 0.60, 0.60, 0.60, 1.0 );

        for ( j=0; j<axis_index; j+=size) { 
            webgl_context.drawArrays( webgl_context.LINE_STRIP, j, size );    
        }
    
        webgl_context.uniform4f( uniform_color, 0.81, 0.81, 0.81, 1.0 ); 
        webgl_context.drawArrays( webgl_context.TRIANGLES, 0, i+=axis_index );
      
       
        webgl_context.uniform4f( uniform_color, 1.0, 0.0, 0.0, 1.0 );
        webgl_context.drawArrays( webgl_context.LINES, i, count);
        i+=count;
        
        
        webgl_context.uniform4f( uniform_color, 0.0, 1.0, 0.0, 1.0 );
        webgl_context.drawArrays( webgl_context.LINES, i, count);
        i+=count;
        
      
        webgl_context.uniform4f( uniform_color, 0.0, 0.0, 1.0, 1.0 );
        webgl_context.drawArrays( webgl_context.LINES, i, count);
        
    }
}

createVertexData();
configure();
allocateMemory();
setInterval( draw, 100 );