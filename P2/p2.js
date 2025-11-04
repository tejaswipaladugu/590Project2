console.clear();

// ----------------------------------------------
// Defining variables
// ----------------------------------------------

// Arrays for canvases + contexts

let canvases = ['xz', 'yz', 'xy', 'xyz']
let contexts = [];

// Virtual cameras

let at = vec3(0.0, 0.0, 0.0);

let xz_up = vec3(0.0, 0.0, 1.0);
let yz_up = vec3(0.0, 1.0, 0.0);
let xy_up = vec3(0.0, 1.0, 0.0);
let xyz_up = vec3(0.0, 1.0, 0.0);

let xz_eye = vec3(0.0, -0.5, 0.0);
let yz_eye = vec3(0.0, 0.0, 0.5);
let xy_eye = vec3(0.5, 0.0, 0.0);
let xyz_eye = vec3(0.0, 0.0, 0.5);

let viewMatrices = [lookAt(xz_eye, at, xz_up), lookAt(yz_eye, at, yz_up), lookAt(xy_eye, at, xy_up), lookAt(xyz_eye, at, xyz_up)]

// Misc

let vertex_data = [];
let size = 3;
let count = 2;
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

    // Adding from plane model
    
    for ( let i=0; i<Fpl.length; i++ ) {
        
        vertex_data[row++] = Vpl[ Fpl[i][0] ];
        vertex_data[row++] = Vpl[ Fpl[i][1] ];
        vertex_data[row++] = Vpl[ Fpl[i][2] ];
        
    }
    
    plane_end_index = vertex_data.length;

    // Adding from propeller model

    for ( let i=0; i<Fpp.length; i++ ) {
        
        vertex_data[row++] = Vpp[ Fpp[i][0] ];
        vertex_data[row++] = Vpp[ Fpp[i][1] ];
        vertex_data[row++] = Vpp[ Fpp[i][2] ];
        
    }


    propeller_end_index = vertex_data.length;
    
    // Adding axis data
    
    for ( let i=0; i<A.length; i++ ) {
         vertex_data[row++] = A[i];
    }
    
}

function configure() {

    // For loop to iterate through all four canvas

    for (let i = 0; i < canvases.length; i++) {
        let canvas = document.getElementById(canvases[i]);
    
        let gl = canvas.getContext( "webgl" );
        let program = initShaders( gl, "vertex-shader", "fragment-shader" );
        gl.useProgram( program );
    
        gl.viewport( 0, 0, canvas.width, canvas.height );
        gl.enable( gl.DEPTH_TEST );

        // Object to store all info necessary for each context

        let context = {
            gl: gl,
            program: program,
            attr_vertex: gl.getAttribLocation( program, "vertex" ),
            uniform_props: gl.getUniformLocation( program, "props" ),
            uniform_color: gl.getUniformLocation( program, "color" ),
            uniform_view: gl.getUniformLocation( program, "View"),
            uniform_z_translation: gl.getUniformLocation( program, "z_translation")
        };

        gl.uniformMatrix4fv(context.uniform_view, false, flatten(viewMatrices[i]));

        // Adding context to contexts array

        contexts.push(context);
    }
}

function allocateMemory() {

    // For loop to allocate memory for each context

    for (let i = 0; i < contexts.length; i++) {
        let buffer_id = contexts[i].gl.createBuffer();
        contexts[i].gl.bindBuffer( contexts[i].gl.ARRAY_BUFFER, buffer_id );
        contexts[i].gl.vertexAttribPointer( contexts[i].gl.attr_vertex, size, contexts[i].gl.FLOAT, false, 0, 0 );
        contexts[i].gl.enableVertexAttribArray( contexts[i].gl.attr_vertex );
        contexts[i].gl.bufferData( contexts[i].gl.ARRAY_BUFFER, flatten(vertex_data), contexts[i].gl.STATIC_DRAW );
    }   
}

function draw() {

    // For each context...

    for (let i = 0; i < contexts.length; i++) {
        
        // Deciding which rotations are applied based on the canvas context
        // Creating copies to not override 

        let xang_apl = xang;
        let yang_apl = yang;
        let zang_apl = zang;
        
        switch (i) {
            case 0:
                xang_apl = 0;
                zang_apl = 0;
                break;
            case 1:
                yang_apl = 0;
                zang_apl = 0;
                break;
            case 2:
                xang_apl = 0;
                yang_apl = 0;
                break;
        }

        //Drawing plane model

        contexts[i].gl.uniform1f( contexts[i].uniform_z_translation, 0);
        contexts[i].gl.uniform4f( contexts[i].uniform_props, 
            radians(xang_apl), 
            radians(yang_apl), 
            radians(zang_apl), 
            1.75);
        contexts[i].gl.uniform4f( contexts[i].uniform_color, 0.60, 0.60, 0.60, 1.0 );

        //Wireframe

        for (let j = 0; j < plane_end_index; j+=size) { 
            contexts[i].gl.drawArrays( contexts[i].gl.LINE_STRIP, j, size );    
        }

        //Faces

        let k = 0;
    
        contexts[i].gl.uniform4f( contexts[i].uniform_color, 0.81, 0.81, 0.81, 1.0 ); 
        contexts[i].gl.drawArrays( contexts[i].gl.TRIANGLES, 0, plane_end_index );

        //Drawing propeller model (with rotation for propeller)

        contexts[i].gl.uniform1f( contexts[i].uniform_z_translation, -0.37);
        contexts[i].gl.uniform4f( contexts[i].uniform_props, 
            radians(xang_apl), 
            radians(yang_apl), 
            radians(rot), 
            1.75);
        contexts[i].gl.uniform4f( contexts[i].uniform_color, 0.60, 0.60, 0.60, 1.0 );

        //Wireframe

        for (let j = plane_end_index; j < propeller_end_index; j+=size) { 
            contexts[i].gl.drawArrays( contexts[i].gl.LINE_STRIP, j, size );    
        }

        //Faces

        k = plane_end_index;

        contexts[i].gl.uniform4f( contexts[i].uniform_color, 0.81, 0.81, 0.81, 1.0 ); 
        contexts[i].gl.drawArrays( contexts[i].gl.TRIANGLES, plane_end_index, propeller_end_index - plane_end_index );

        //Drawing axes

        contexts[i].gl.uniform1f( contexts[i].uniform_z_translation, 0);
        contexts[i].gl.uniform4f( contexts[i].uniform_props, 
            radians(xang_apl), 
            radians(yang_apl), 
            0, 
            1.75);
       
        contexts[i].gl.uniform4f( contexts[i].uniform_color, 1.0, 0.0, 0.0, 1.0 );
        contexts[i].gl.drawArrays( contexts[i].gl.LINES, propeller_end_index, count);
        
        
        contexts[i].gl.uniform4f( contexts[i].uniform_color, 0.0, 1.0, 0.0, 1.0 );
        contexts[i].gl.drawArrays( contexts[i].gl.LINES, propeller_end_index + count, count);
        
      
        contexts[i].gl.uniform4f( contexts[i].uniform_color, 0.0, 0.0, 1.0, 1.0 );
        contexts[i].gl.drawArrays( contexts[i].gl.LINES, propeller_end_index + (count * 2), count);

        //Incrementing rotation on every draw

        rot = (rot + rot_inc) % 360;
        
    }
}

createVertexData();
configure();
allocateMemory();
setInterval( draw, 100 );