//=============================================================================
//
//    
//     Naomi Gutstein
//     EECS351
//     Project C
//
//
//
//=============================================================================
//=============================================================================
// Vertex shader program
//=============================================================================
var VSHADER_SOURCE =
	//-------------Set precision.
	// GLSL-ES 2.0 defaults (from spec; '4.5.3 Default Precision Qualifiers'):
	// DEFAULT for Vertex Shaders: 	precision highp float; precision highp int;
	//									precision lowp sampler2D; precision lowp samplerCube;
	// DEFAULT for Fragment Shaders:  UNDEFINED for float; precision mediump int;
	//									precision lowp sampler2D;	precision lowp samplerCube;
	//--------------- GLSL Struct Definitions:
	'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
	'		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
	'		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
	'		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
	'		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
	'		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
  '		};\n' +
  //																
	//-------------ATTRIBUTES of each vertex, read from our Vertex Buffer Object
  'attribute vec4 a_Position; \n' +		// vertex position (model coord sys)
  'attribute vec4 a_Normal; \n' +			// vertex normal vector (model coord sys)

										
	//-------------UNIFORMS: values set from JavaScript before a drawing command.
// 	'uniform vec3 u_Kd; \n' +						// Phong diffuse reflectance for the 
 																			// entire shape. Later: as vertex attrib.
  'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
  'uniform mat4 u_MvpMatrix; \n' +
  'uniform mat4 u_ModelMatrix; \n' + 		// Model matrix
  'uniform mat4 u_NormalMatrix; \n' +  	// Inverse Transpose of ModelMatrix;
  																			// (won't distort normal vec directions
  																			// but it usually WILL change its length)
  
	//-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
	'varying vec3 v_Kd; \n' +							// Phong Lighting: diffuse reflectance
																				// (I didn't make per-pixel Ke,Ka,Ks;
																				// we use 'uniform' values instead)
  'varying vec4 v_Position; \n' +				
  'varying vec3 v_Normal; \n' +					// Why Vec3? its not a point, hence w==0

  'attribute vec4 a_Color;\n' +
  'uniform vec3 u_LightColor;\n' +
  'uniform vec3 u_LightDirection;\n' +
  'varying vec4 v_Color;\n' +
	//-----------------------------------------------------------------------------
  'void main() { \n' +
		// Compute CVV coordinate values from our given vertex. This 'built-in'
		// 'varying' value gets interpolated to set screen position for each pixel.
  '  gl_Position = u_MvpMatrix * u_ModelMatrix * a_Position;\n' +
		// Calculate the vertex position & normal vec in the WORLD coordinate system
		// for use as a 'varying' variable: fragment shaders get per-pixel values
		// (interpolated between vertices for our drawing primitive (TRIANGLE)).
  '  v_Position = u_MvpMatrix * a_Position; \n' +
		// 3D surface normal of our vertex, in world coords.  ('varying'--its value
		// gets interpolated (in world coords) for each pixel's fragment shader.
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '	 v_Kd = u_MatlSet[0].diff; \n' +		// find per-pixel diffuse reflectance from per-vertex
													// (no per-pixel Ke,Ka, or Ks, but you can do it...)
//	'  v_Kd = vec3(1.0, 1.0, 0.0); \n'	+ // TEST; color fixed at green
  ' vec3 normal = normalize(a_Normal.xyz);\n' + 
  ' float nDotL = max(dot(u_LightDirection, normal),0.0);\n' +
  ' vec3 diffuse = u_LightColor * a_Color.rgb * (0.3 + (0.7*nDotL));\n' +
  ' v_Color = vec4(diffuse, a_Color.a); \n' +
  '}\n';

//=============================================================================
// Fragment shader program
//=============================================================================
var FSHADER_SOURCE =
	//-------------Set precision.
	// GLSL-ES 2.0 defaults (from spec; '4.5.3 Default Precision Qualifiers'):
	// DEFAULT for Vertex Shaders: 	precision highp float; precision highp int;
	//									precision lowp sampler2D; precision lowp samplerCube;
	// DEFAULT for Fragment Shaders:  UNDEFINED for float; precision mediump int;
	//									precision lowp sampler2D;	precision lowp samplerCube;
	// MATCH the Vertex shader precision for float and int:
  'precision highp float;\n' +
  'precision highp int;\n' +
  //
	//--------------- GLSL Struct Definitions:
	'struct LampT {\n' +		// Describes one point-like Phong light source
	'		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
													//		   w==0.0 for distant light from x,y,z direction 
	' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
	' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
	'		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
	'}; \n' +
	//
	'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
	'		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
	'		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
	'		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
	'		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
	'		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
  '		};\n' +
  //
	//-------------UNIFORMS: values set from JavaScript before a drawing command.
  // first light source: (YOU write a second one...)
	'uniform LampT u_LampSet[2];\n' +		// Array of all light sources.
	'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
	'uniform float blinn;\n' +
	'uniform float gourand;\n' +

// OLD first material definition: you write 2nd, 3rd, etc.
//  'uniform vec3 u_Ke;\n' +						// Phong Reflectance: emissive
//  'uniform vec3 u_Ka;\n' +						// Phong Reflectance: ambient
	// no Phong Reflectance: diffuse? -- no: use v_Kd instead for per-pixel value
//  'uniform vec3 u_Ks;\n' +						// Phong Reflectance: specular
//  'uniform int u_Kshiny;\n' +				// Phong Reflectance: 1 < shiny < 128
//
  'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
  
 	//-------------VARYING:Vertex Shader values sent per-pix'''''''''''''''';el to Fragment shader: 
  'varying vec3 v_Normal;\n' +				// Find 3D surface normal at each pix
  'varying vec4 v_Position;\n' +			// pixel's 3D pos too -- in 'world' coords
  'varying vec3 v_Kd;	\n' +						// Find diffuse reflectance K_d per pix
  													// Ambient? Emissive? Specular? almost
  													// NEVER change per-vertex: I use 'uniform' values
  'varying vec4 v_Color;\n' +
  'void main() { \n' +
     	// Normalize! !!IMPORTANT!! TROUBLE if you don't! 
     	// normals interpolated for each pixel aren't 1.0 in length any more!
	'  vec3 normal = normalize(v_Normal); \n' +
	// '  test = 1.0; \n' +
//	'  vec3 normal = v_Normal; \n' +
     	// Find the unit-length light dir vector 'L' (surface pt --> light):
	'  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
			// Find the unit-length eye-direction vector 'V' (surface pt --> camera)
  '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
     	// The dot product of (unit-length) light direction and the normal vector
     	// (use max() to discard any negatives from lights below the surface) 
     	// (look in GLSL manual: what other functions would help?)
     	// gives us the cosine-falloff factor needed for the diffuse lighting term:
	'  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
  	 	// The Blinn-Phong lighting model computes the specular term faster 
  	 	// because it replaces the (V*R)^shiny weighting with (H*N)^shiny,
  	 	// where 'halfway' vector H has a direction half-way between L and V
  	 	// H = norm(norm(V) + norm(L)).  Note L & V already normalized above.
  	 	// (see http://en.wikipedia.org/wiki/Blinn-Phong_shading_model)
      'float nDotH = 0.0;\n' +
  	 ' if (blinn == 1.0){ \n' +
	'  vec3 H = normalize(lightDirection + eyeDirection); \n' +
	'  nDotH = max(dot(H, normal), 0.0); \n' +
	' } else { \n' +
	'  nDotH = max(dot(lightDirection, normal), 0.0); \n' +
	'} \n' +
		// for phong use lightdirection insteaad of H

			// (use max() to discard any negatives from lights below the surface)
			// Apply the 'shininess' exponent K_e:
			// Try it two different ways:		The 'new hotness': pow() fcn in GLSL.
			// CAREFUL!  pow() won't accept integer exponents! Convert K_shiny!  
	'  float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
 	// Calculate the final color from diffuse reflection and ambient reflection
//  '	 vec3 emissive = u_Ke;' +
 '	 vec3 emissive = 										u_MatlSet[0].emit;' +
  '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
  '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
  '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +
 

	'  vec3 lightDirection2 = normalize(u_LampSet[1].pos - v_Position.xyz);\n' +
		
     	// The dot product of (unit-length) light direction and the normal vector
     	// (use max() to discard any negatives from lights below the surface) 
     	// (look in GLSL manual: what other functions would help?)
     	// gives us the cosine-falloff factor needed for the diffuse lighting term:
	'  float nDotL2 = max(dot(lightDirection2, normal), 0.0); \n' +
  	 	// The Blinn-Phong lighting model computes the specular term faster 
  	 	// because it replaces the (V*R)^shiny weighting with (H*N)^shiny,
  	 	// where 'halfway' vector H has a direction half-way between L and V
  	 	// H = norm(norm(V) + norm(L)).  Note L & V already normalized above.
  	 	// (see http://en.wikipedia.org/wiki/Blinn-Phong_shading_model)
      'float nDotH2 = 0.0;\n' +
  	 ' if (blinn == 1.0){ \n' +
	'  vec3 H2 = normalize(lightDirection2 + eyeDirection); \n' +
	'  nDotH2 = max(dot(H2, normal), 0.0); \n' +
	' } else { \n' +
	'  nDotH2 = max(dot(lightDirection2, normal), 0.0); \n' +
	'} \n' +
		// for phong use lightdirection insteaad of H

			// (use max() to discard any negatives from lights below the surface)
			// Apply the 'shininess' exponent K_e:
			// Try it two different ways:		The 'new hotness': pow() fcn in GLSL.
			// CAREFUL!  pow() won't accept integer exponents! Convert K_shiny!  
	'  float e642 = pow(nDotH2, float(u_MatlSet[0].shiny));\n' +
 	// Calculate the final color from diffuse reflection and ambient reflection
//  '	 vec3 emissive = u_Ke;' +
 '	 vec3 emissive2 = u_MatlSet[0].emit;' +
  '  vec3 ambient2 = u_LampSet[1].ambi * u_MatlSet[0].ambi;\n' +
  '  vec3 diffuse2 = u_LampSet[1].diff * v_Kd * nDotL;\n' +
  '	 vec3 speculr2 = u_LampSet[1].spec * u_MatlSet[0].spec * e642;\n' +
  ' if (gourand== 1.0){\n'+
  '    gl_FragColor = v_Color;\n' +
  ' }else {\n' +
  '  gl_FragColor = vec4(emissive2 + ambient2 + diffuse2 + speculr2 + emissive + ambient + diffuse + speculr, 1.0);\n' +
  ' }\n' +
  '}\n';
//=============================================================================
// Global vars for mouse click-and-drag for rotation.
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;
var blinn = 0.0;
var gourand = 0.0;
var blinn_bool = true;
var gourand_bool_bool = false;
var headlight = true;
var overhead = true;

var red_ambient = 1; 
var green_ambient = 1; 
var blue_ambient = 1; 
var red_diffuse = 1; 
var green_diffuse = 1; 
var blue_diffuse = 1; 
var red_specular = 0; 
var green_specular = 0; 
var blue_specular = 0;
var shift = false;

// Global vars for GPU 'storage locations' -- you need these integer 'handles' 
// to select and modify the value of the GPU's 'uniform' vars that we created
// in main(). 
// *****!!!UGLY_UGLY_UGLY!!!*** in later versions, remove these globals and
// replace them with sensible object-oriented methods. e.g. create separate
// multi-member objects for 'lamp' (light source), 'camera', 'material', 'shape',
// 'controls'(mouse/keyboard/GUI/animation values and functions) and one big 
// master all-inclusive 'scene' (contains all shapes, materials, lamps, cameras, 
// gand any/all matrices and functions and animation needed to assemble them into
// a complete animated interactive 3D scene.
//		-- For 3D scene:
var uLoc_eyePosWorld 	= false;
var uLoc_ModelMatrix 	= false;
var uLoc_MvpMatrix 		= false;
var uLoc_NormalMatrix = false;

// ... for Phong material/reflectance:
var uLoc_Ke = false;
var uLoc_Ka = false;
var uLoc_Kd = false;
var uLoc_Kd2 = false;			// for K_d within the MatlSet[0] element.l
var uLoc_Ks = false;
var uLoc_Kshiny = false;

//  ... for 3D scene variables (previously used as arguments to draw() function)
var canvas 	= false;
var gl 			= false;
var n_vcount= false;	// formerly 'n', but that name is far too vague and terse
											// to use safely as a global variable.

// NEXT, create global vars that contain the values we send thru those uniforms,
//  ... for our camera:
var	eyePosWorld = new Float32Array(3);	// x,y,z in world coords
//  ... for our transforms:
var modelMatrix = new Matrix4();  // Model matrix
var	mvpMatrix 	= new Matrix4();	// Model-view-projection matrix
var	normalMatrix= new Matrix4();	// Transformation matrix for normals

//	... for our first light source:   (stays false if never initialized)
var lamp0 = new LightsT();
var lamp1 = new LightsT();

	// ... for our first material:
var matlSel= MATL_RED_PLASTIC;				// see keypress(): 'm' key changes matlSel
var mat_bunny_ears = new Material(matlSel +3);	
var carrot = new Material(matlSel+9);
var leaf = new Material(matlSel+1);



var ANGLE_STEP = 45;
var currentAngle = 0;
var currentAngle2=0;
var sphereLength;
var floatsPerVertex = 9;

// ---------------END of global vars----------------------------

//=============================================================================
function main() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context \'gl\' for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // 
  n_vcount = initVertexBuffers(gl);		// vertex count.
  if (n_vcount < 0) {
    console.log('Failed to set the vertex information: n_vcount false');
    return;
  }

  // Set the clear color and enable the depth test
  gl.clearColor(0.4, 0.4, 0.4, 1.0);
  gl.enable(gl.DEPTH_TEST);

  canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) }; 
  
  					// when user's mouse button goes down call mouseDown() function
  canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) };
  
											// call mouseMove() function					
  canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)};

  // Next, register all keyboard events found within our HTML webpage window:
	window.addEventListener("keydown", keydown, false);
	window.addEventListener("keypress", myKeyPress, false);

  // Create, save the storage locations of uniform variables: ... for the scene
  // (Version 03: changed these to global vars (DANGER!) for use inside any func)
  uLoc_eyePosWorld  = gl.getUniformLocation(gl.program, 'u_eyePosWorld');
  uLoc_ModelMatrix  = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  uLoc_MvpMatrix    = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  uLoc_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!uLoc_eyePosWorld ||
      !uLoc_ModelMatrix	|| !uLoc_MvpMatrix || !uLoc_NormalMatrix) {
  	console.log('Failed to get GPUs matrix storage locations');
  	return;
  	}
	//  ... for Phong light source:
	// NEW!  Note we're getting the location of a GLSL struct array member:

  lamp0.u_pos  = gl.getUniformLocation(gl.program, 'u_LampSet[0].pos');	
  lamp0.u_ambi = gl.getUniformLocation(gl.program, 'u_LampSet[0].ambi');
  lamp0.u_diff = gl.getUniformLocation(gl.program, 'u_LampSet[0].diff');
  lamp0.u_spec = gl.getUniformLocation(gl.program, 'u_LampSet[0].spec');
  if( !lamp0.u_pos || !lamp0.u_ambi	|| !lamp0.u_diff || !lamp0.u_spec	) {
    console.log('Failed to get GPUs Lamp0 storage locations');
    return;
  }

  lamp1.u_pos  = gl.getUniformLocation(gl.program, 'u_LampSet[1].pos');	
  lamp1.u_ambi = gl.getUniformLocation(gl.program, 'u_LampSet[1].ambi');
  lamp1.u_diff = gl.getUniformLocation(gl.program, 'u_LampSet[1].diff');
  lamp1.u_spec = gl.getUniformLocation(gl.program, 'u_LampSet[1].spec');
  if( !lamp1.u_pos || !lamp1.u_ambi	|| !lamp1.u_diff || !lamp1.u_spec	) {
    console.log('Failed to get GPUs Lamp0 storage locations');
    return;
  }

	uLoc_Ke = gl.getUniformLocation(gl.program, 'u_MatlSet[0].emit');
	uLoc_Ka = gl.getUniformLocation(gl.program, 'u_MatlSet[0].ambi');
	uLoc_Kd = gl.getUniformLocation(gl.program, 'u_MatlSet[0].diff');
	uLoc_Ks = gl.getUniformLocation(gl.program, 'u_MatlSet[0].spec');
	uLoc_Kshiny = gl.getUniformLocation(gl.program, 'u_MatlSet[0].shiny');
	
	if(!uLoc_Ke || !uLoc_Ka || !uLoc_Kd // || !uLoc_Kd2
		  		    || !uLoc_Ks || !uLoc_Kshiny
		 ) {
		console.log('Failed to get GPUs Reflectance storage locations');
		return;
	}
	// Position the camera in world coordinates:
	eyePosWorld.set([0.0, 25.0, 8.0]);
	gl.uniform3fv(uLoc_eyePosWorld, eyePosWorld);// use it to set our uniform
	// (Note: uniform4fv() expects 4-element float32Array as its 2nd argument)
	
  // Init World-coord. position & colors of first light source in global vars;
  lamp1.I_pos.elements.set( [0.0, 0.0, 10.0]);
  lamp1.I_ambi.elements.set([0.0, 0.0, 0.0]);
  lamp1.I_diff.elements.set([0.6, 0.6, 0.6]);
  lamp1.I_spec.elements.set([2, 2, 2]);

  lamp0.I_pos.elements.set( [eyePosWorld[0], eyePosWorld[1], eyePosWorld[2]]);
  lamp0.I_ambi.elements.set([1.0, 1.0, 1.0]);
  lamp0.I_diff.elements.set([0.5, 0.5, 0.5]);
  lamp0.I_spec.elements.set([0, 0, 0]);
  //TEST: console.log('lamp0.I_pos.elements: ', lamp0.I_pos.elements, '\n');

  // ( MOVED:  set the GPU's uniforms for lights and materials in draw()
  // 					function, not main(), so they ALWAYS get updated before each
  //					on-screen re-drawing)
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');

  gl.uniform3f(u_LightColor, 1, 1, 1);

  blinn  = gl.getUniformLocation(gl.program, 'blinn');
  gourand = gl.getUniformLocation(gl.program, 'gourand');

	var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    currentAngle2 = animate2(currentAngle, currentAngle2);
    draw();
    requestAnimationFrame(tick, canvas);   // Request that the browser ?calls tick
  };
  tick();
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

  var xcount = 1000;      // # of lines to draw in x,y to make the grid.
  var ycount = 1000;    
  var xymax = 1000.0;     // grid size; extends to cover +/-xymax in x and y.
  var xColr = new Float32Array([1.0, 1.0, 0.3]);  // bright yellow
  var yColr = new Float32Array([0.5, 1.0, 0.5]);  // bright green.
  
  // Create an (global) array to hold this ground-plane's vertices:
  gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
            // draw a grid made of xcount+ycount lines; 2 vertices per line.
            
  var xgap = xymax/(xcount-1);    // HALF-spacing between lines in x,y;
  var ygap = xymax/(ycount-1);    // (why half? because v==(0line number/2))
  
  // First, step thru x values as we make vertical lines of constant-x:
  for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
    if(v%2==0) {  // put even-numbered vertices at (xnow, -xymax, 0)
      gndVerts[j  ] = -xymax + (v  )*xgap;  // x
      gndVerts[j+1] = -xymax;               // y
      gndVerts[j+2] = 0.0;                  // z
    }
    else {        // put odd-numbered vertices at (xnow, +xymax, 0).
      gndVerts[j  ] = -xymax + (v-1)*xgap;  // x
      gndVerts[j+1] = xymax;                // y
      gndVerts[j+2] = 0.0;                  // z
    }
      gndVerts[j+3] = 0;
      gndVerts[j+4] = 0;
      gndVerts[j+5] = 1;
      gndVerts[j+6] = 0;
      gndVerts[j+7] = 0;
      gndVerts[j+8] = 1;

  }
  // Second, step thru y values as wqe make horizontal lines of constant-y:
  // (don't re-initialize j--we're adding more vertices to the array)
  for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
    if(v%2==0) {    // put even-numbered vertices at (-xymax, ynow, 0)
      gndVerts[j  ] = -xymax;               // x
      gndVerts[j+1] = -xymax + (v  )*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
    }
    else {          // put odd-numbered vertices at (+xymax, ynow, 0).
      gndVerts[j  ] = xymax;                // x
      gndVerts[j+1] = -xymax + (v-1)*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
    }
      gndVerts[j+3] = 0;
      gndVerts[j+4] = 0;
      gndVerts[j+5] = 1;
      gndVerts[j+6] = 0;
      gndVerts[j+7] = 0;
      gndVerts[j+8] = 1;

  }
}


function draw() {
//-------------------------------------------------------------------------------
  // Send fresh 'uniform' values to the GPU:

  var nuCanvas = document.getElementById('webgl');  // get current canvas
  gl = getWebGLContext(nuCanvas);             // and context:

  
  //Make canvas fill the top 3/4 of our browser window:
  nuCanvas.width = innerWidth;
  nuCanvas.height = innerHeight*3/4;



  gl.viewport(0                   ,         // Viewport lower-left corner
              0,    // location(in pixels)
              gl.drawingBufferWidth,        // viewport width, height.
              gl.drawingBufferHeight);
	//---------------For the light source(s):

  gl.uniform3fv(lamp0.u_pos,  lamp0.I_pos.elements.slice(0,3));
  //		 ('slice(0,3) member func returns elements 0,1,2 (x,y,z) ) 
  gl.uniform3fv(lamp0.u_ambi, lamp0.I_ambi.elements);		// ambient
  gl.uniform3fv(lamp0.u_diff, lamp0.I_diff.elements);		// diffuse
  gl.uniform3fv(lamp0.u_spec, lamp0.I_spec.elements);		// Specular
//	console.log('lamp0.u_pos',lamp0.u_pos,'\n' );
//	console.log('lamp0.I_diff.elements', lamp0.I_diff.elements, '\n');

  gl.uniform3fv(lamp1.u_pos,  lamp1.I_pos.elements.slice(0,3));
  //		 ('slice(0,3) member func returns elements 0,1,2 (x,y,z) ) 
  gl.uniform3fv(lamp1.u_ambi, lamp1.I_ambi.elements);		// ambient
  gl.uniform3fv(lamp1.u_diff, lamp1.I_diff.elements);		// diffuse
  gl.uniform3fv(lamp1.u_spec, lamp1.I_spec.elements);		// Specular
//	console.log('lamp0.u_pos',lamp0.u_pos,'\n' );
//	console.log('lamp0.I_diff.elements', lamp0.I_diff.elements, '\n');

// 	//---------------For the materials: 
// // Test our new Material object:
// // console.log('mat_bunny_ears.K_emit', mat_bunny_ears.K_emit.slice(0,3), '\n');
// // (Why 'slice(0,4)'? 
// //	this takes only 1st 3 elements (r,g,b) of array, ignores 4th element (alpha))
// 	gl.uniform3fv(uLoc_Ke, mat_bunny_ears.K_emit.slice(0,3));				// Ke emissive
// 	gl.uniform3fv(uLoc_Ka, mat_bunny_ears.K_ambi.slice(0,3));				// Ka ambient
//   	gl.uniform3fv(uLoc_Kd, mat_bunny_ears.K_diff.slice(0,3));				// Kd	diffuse
// 	gl.uniform3fv(uLoc_Ks, mat_bunny_ears.K_spec.slice(0,3));				// Ks specular
// 	gl.uniform1i(uLoc_Kshiny, parseInt(mat_bunny_ears.K_shiny, 10));     // Kshiny 
	//	== specular exponent; (parseInt() converts from float to base-10 integer).
  if(blinn_bool == 0){
  	gl.uniform1f(blinn, "0.0");		
	 
  }
  else{
   gl.uniform1f(blinn, "1.0");;    
  }

  if(gourand_bool_bool){            
   gl.uniform1f(gourand, "1.0");
  }
  else{
   gl.uniform1f(gourand, "0.0");    
  }

  if(!overhead){
        lamp0.I_ambi.elements.set([0, 0, 0]);
 	 	lamp0.I_diff.elements.set([0.0, 0.0, 0.0]);
  		lamp0.I_spec.elements.set([0, 0, 0]);
      }
  else{
  		lamp0.I_ambi.elements.set([red_ambient, green_ambient, blue_ambient]);
  		lamp0.I_diff.elements.set([red_diffuse, green_diffuse, blue_diffuse]);
  		lamp0.I_spec.elements.set([red_specular, green_specular, blue_specular]);
      }

  //----------------For the Matrices: find the model matrix:

  // Calculate the view projection matrix
  mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);

  mvpMatrix.lookAt(eyePosWorld[0],eyePosWorld[1],eyePosWorld[2],  // eye position,
                        x_lookat, y_lookat, z_lookat,                 // look-at point,
                        0, 0, 1);               // 'up' vector.

 
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  // Draw the cube
  // gl.drawElements(gl.TRIANGLES, sphereLength/3, gl.UNSIGNED_SHORT, 0);
  // gl.drawElements(gl.LINES, groundLength/3, gl.UNSIGNED_SHORT, gndStart);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 gndStart/floatsPerVertex, // start at this vertex number, and
                 gndVerts.length/floatsPerVertex); // draw th


  //---------------------BUNNY----------------------------------------------------
  gl.uniform3fv(uLoc_Ke, mat_bunny_ears.K_emit.slice(0,3));        // Ke emissive
  gl.uniform3fv(uLoc_Ka, mat_bunny_ears.K_ambi.slice(0,3));        // Ka ambient
  gl.uniform3fv(uLoc_Kd, mat_bunny_ears.K_diff.slice(0,3));        // Kd diffuse
  gl.uniform3fv(uLoc_Ks, mat_bunny_ears.K_spec.slice(0,3));        // Ks specular
  gl.uniform1i(uLoc_Kshiny, parseInt(mat_bunny_ears.K_shiny, 10));     // Kshiny 

  //head
  pushMatrix(mvpMatrix)
  mvpMatrix.translate(0,0,3.5)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th
  
  pushMatrix(mvpMatrix)

  //right ear
  mvpMatrix.translate(-0.9,0, 1.4)
  mvpMatrix.rotate(currentAngle, 0, -currentAngle, 1)
  mvpMatrix.scale(0.5,0.5,0.8)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th

  //right top ear
  pushMatrix(mvpMatrix)
  mvpMatrix.translate(0,0, 1.4)
  mvpMatrix.rotate(currentAngle2, 0, -currentAngle2, 1)
  mvpMatrix.scale(0.5,0.5,0.8)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th

  mvpMatrix= popMatrix()


  //left ear
  mvpMatrix = popMatrix()
  pushMatrix(mvpMatrix)
  mvpMatrix.translate(0.9,0,1.4)
  mvpMatrix.rotate(currentAngle, 0, currentAngle, 1)
  mvpMatrix.scale(0.5,0.5,0.8)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th


    //right left ear
  pushMatrix(mvpMatrix)
  mvpMatrix.translate(0,0, 1.4)
  mvpMatrix.rotate(currentAngle2, 0, currentAngle2, 1)
  mvpMatrix.scale(0.5,0.5,0.8)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th

  mvpMatrix= popMatrix()
 
  mvpMatrix = popMatrix()
  pushMatrix(mvpMatrix)

    //body
  mvpMatrix.translate(0,0,-2)
  mvpMatrix.scale(1.5,1.5,1)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th

  pushMatrix(mvpMatrix)

  //left arm
  mvpMatrix.translate(1,0,0.5)
  mvpMatrix.rotate(currentAngle, 0, currentAngle, 1)
  mvpMatrix.scale(0.25,0.5,0.5)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th
 
  mvpMatrix = popMatrix()
  pushMatrix(mvpMatrix)

    //right arm
  mvpMatrix.translate(-1,0,0.5)
  mvpMatrix.rotate(currentAngle, 0, -currentAngle, 1)
  mvpMatrix.scale(0.25,0.5,0.5)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th
 
  mvpMatrix = popMatrix()
  pushMatrix(mvpMatrix)

    //left leg
  mvpMatrix.translate(0.8,0,-1.15)
  mvpMatrix.rotate(currentAngle,-currentAngle*3, currentAngle, 1)
  mvpMatrix.scale(0.4,0.3,0.4)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th

  mvpMatrix = popMatrix()
  pushMatrix(mvpMatrix)

    //right leg
  mvpMatrix.translate(-0.8,0,-1.15)
  mvpMatrix.rotate(currentAngle,-currentAngle*3, -currentAngle, 1)
  mvpMatrix.scale(0.4,0.4,0.4)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th

  mvpMatrix = popMatrix()
  mvpMatrix = popMatrix()
  pushMatrix(mvpMatrix)

  //--------------------Carrot right------------------------------------------------------
  //carrot material
  gl.uniform3fv(uLoc_Ke, carrot.K_emit.slice(0,3));        // Ke emissive
  gl.uniform3fv(uLoc_Ka, carrot.K_ambi.slice(0,3));        // Ka ambient
  gl.uniform3fv(uLoc_Kd, carrot.K_diff.slice(0,3));        // Kd diffuse
  gl.uniform3fv(uLoc_Ks, carrot.K_spec.slice(0,3));        // Ks specular
  gl.uniform1i(uLoc_Kshiny, parseInt(carrot.K_shiny, 10));     // Kshiny 

   //smallest to biggest circle
  mvpMatrix.translate(-5,0,-3)
  mvpMatrix.rotate(currentAngle,0,currentAngle, 1)
  mvpMatrix.scale(0.2,0.2,0.2)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th

  pushMatrix(mvpMatrix)

  mvpMatrix.translate(0,0,2)
  mvpMatrix.rotate(currentAngle*0.2,0,currentAngle*0.2, 1)
  mvpMatrix.scale(2,2,1)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th

  pushMatrix(mvpMatrix)

  mvpMatrix.translate(0,0,3)
  mvpMatrix.rotate(currentAngle*2,0,0, 1)
  mvpMatrix.scale(2,2,2)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th


  gl.uniform3fv(uLoc_Ke, leaf.K_emit.slice(0,3));        // Ke emissive
  gl.uniform3fv(uLoc_Ka, leaf.K_ambi.slice(0,3));        // Ka ambient
  gl.uniform3fv(uLoc_Kd, leaf.K_diff.slice(0,3));        // Kd diffuse
  gl.uniform3fv(uLoc_Ks, leaf.K_spec.slice(0,3));        // Ks specular
  gl.uniform1i(uLoc_Kshiny, parseInt(leaf.K_shiny, 10));     // Kshiny 

  pushMatrix(mvpMatrix)

  mvpMatrix.translate(0,0,2)
  mvpMatrix.rotate(-currentAngle*0.5,0,currentAngle*0.5, 1)
  mvpMatrix.scale(0.35,0.35,1)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th

  mvpMatrix = popMatrix()
  mvpMatrix = popMatrix()
  mvpMatrix = popMatrix()
  mvpMatrix = popMatrix()
  pushMatrix(mvpMatrix)

  //--------------------Carrot left------------------------------------------------------
  //carrot material
  gl.uniform3fv(uLoc_Ke, carrot.K_emit.slice(0,3));        // Ke emissive
  gl.uniform3fv(uLoc_Ka, carrot.K_ambi.slice(0,3));        // Ka ambient
  gl.uniform3fv(uLoc_Kd, carrot.K_diff.slice(0,3));        // Kd diffuse
  gl.uniform3fv(uLoc_Ks, carrot.K_spec.slice(0,3));        // Ks specular
  gl.uniform1i(uLoc_Kshiny, parseInt(carrot.K_shiny, 10));     // Kshiny 

   //smallest to biggest circle
  mvpMatrix.translate(5,0,-3)
  mvpMatrix.rotate(-currentAngle,0,currentAngle, 1)
  mvpMatrix.scale(0.2,0.2,0.2)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th

  pushMatrix(mvpMatrix)

  mvpMatrix.translate(0,0,2)
  mvpMatrix.rotate(currentAngle*0.2,0,currentAngle*0.2, 1)
  mvpMatrix.scale(2,2,1)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th

  pushMatrix(mvpMatrix)

  mvpMatrix.translate(0,0,3)
  mvpMatrix.rotate(currentAngle*2,0,0, 1)
  mvpMatrix.scale(2,2,2)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th


  gl.uniform3fv(uLoc_Ke, leaf.K_emit.slice(0,3));        // Ke emissive
  gl.uniform3fv(uLoc_Ka, leaf.K_ambi.slice(0,3));        // Ka ambient
  gl.uniform3fv(uLoc_Kd, leaf.K_diff.slice(0,3));        // Kd diffuse
  gl.uniform3fv(uLoc_Ks, leaf.K_spec.slice(0,3));        // Ks specular
  gl.uniform1i(uLoc_Kshiny, parseInt(leaf.K_shiny, 10));     // Kshiny 

  pushMatrix(mvpMatrix)

  mvpMatrix.translate(0,0,2)
  mvpMatrix.rotate(currentAngle*0.5,0,currentAngle*0.5, 1)
  mvpMatrix.scale(0.35,0.35,1)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(mvpMatrix);
  normalMatrix.transpose();

  // Send the new matrix values to their locations in the GPU:
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                 0/floatsPerVertex, // start at this vertex number, and
                 sphVerts.length/floatsPerVertex); // draw th

  mvpMatrix = popMatrix()
  mvpMatrix = popMatrix()
  mvpMatrix = popMatrix()

}

function initVertexBuffers(gl) { // Create a sphere
//-------------------------------------------------------------------------------

  makeSphere()

  makeGroundGrid();

  var mySiz = sphVerts.length + gndVerts.length;

  var verticesColors = new Float32Array(mySiz);

  sphereLength = sphVerts.length;
  groundLength = gndVerts.length;
   var i = 0;
  for(j = 0; j < sphVerts.length; i++, j++){
    verticesColors[j] = sphVerts[j];
  }
  gndStart = i;           // next we'll store the ground-plane;
  for(j=0; j< gndVerts.length; i++, j++) {
    verticesColors[i] = gndVerts[j];
    }

  // Write the vertex property to buffers (coordinates and normals)
  // Use the same data for each vertex and its normal because the sphere is
  // centered at the origin, and has radius of 1.0.
  // We create two separate buffers so that you can modify normals if you wish.
    // if (!initArrayBuffer(gl, 'a_Position', new Float32Array(verticesColors), gl.FLOAT, 3)) return -1;
    // if (!initSecondArrayBuffer(gl, 'a_Normal', new Float32Array(verticesColors), gl.FLOAT, 3))  return -1;

  // Write date into the buffer object

    var vertexColorbuffer = gl.createBuffer();  
  if (!vertexColorbuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    var FSIZE = verticesColors.BYTES_PER_ELEMENT;

  // Assign the buffer object to the attribute variable
  // var a_attribute = gl.getAttribLocation(gl.program, attribute);
  // if (a_attribute < 0) {
  //   console.log('Failed to get the storage location of ' + attribute);
  //   return false;
  // }

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * floatsPerVertex, 0);
  gl.enableVertexAttribArray(a_Position);
  // Assign the buffer object to a_Color and enable the assignment
  var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
      console.log('Failed to get the storage location of a_Color');
      return -1;
  }
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * floatsPerVertex, FSIZE * 3);
  gl.enableVertexAttribArray(a_Normal);


  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * floatsPerVertex, FSIZE * 6);
  gl.enableVertexAttribArray(a_Color);
  // gl.vertexAttribPointer(a_attribute, n
  // gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // // Enable the assignment of the buffer object to the attribute variable
  // gl.enableVertexAttribArray(a_attribute);

  // Unbind the buffer object
  // gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // // Write the indices to the buffer object
  // var indexBuffer = gl.createBuffer();
  // if (!indexBuffer) {
  //   console.log('Failed to create the buffer object');
  //   return -1;
  // }
  // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(verticesColors), gl.STATIC_DRAW);

  return verticesColors.length;
}


function makeSphere() {

  var slices = 13;    

  var sliceVerts  = 27; 

  var topColr = new Float32Array([0.7, 0.7, 0.7]);  
  var equColr = new Float32Array([0.3, 0.7, 0.3]);  
  var botColr = new Float32Array([0.9, 0.9, 0.9]);  
  var sliceAngle = Math.PI/slices;  // lattitude angle spanned by one slice.

  // Create a (global) array to hold this sphere's vertices:
  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
              
  var cos0 = 0.0;         // sines,cosines of slice's top, bottom edge.
  var sin0 = 0.0;
  var cos1 = 0.0;
  var sin1 = 0.0; 
  var j = 0;              // initialize our array index
  var isLast = 0;
  var isFirst = 1;
  for(s=0; s<slices; s++) { 

    if(s==0) {
      isFirst = 1;  // skip 1st vertex of 1st slice.
      cos0 = 1.0;   // initialize: start at north pole.
      sin0 = 0.0;
    }
    else {          // otherwise, new top edge == old bottom edge
      isFirst = 0;  
      cos0 = cos1;
      sin0 = sin1;
    }               // & compute sine,cosine for new bottom edge.
    cos1 = Math.cos((s+1)*sliceAngle);
    sin1 = Math.sin((s+1)*sliceAngle);

    if(s==slices-1) isLast=1; // skip last vertex of last slice.
    for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) { 
      if(v%2==0)
      {      
        sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts);  
        sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);  
        sphVerts[j+2] = cos0;   
        // sphVerts[j+3] = 1.0;      
      }
      else { 
        sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);    // x
        sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);    // y
        sphVerts[j+2] = cos1;                                       // z
        // sphVerts[j+3] = 1.0;                                        // w.   
      }
      // if(s==0) {  // finally, set some interesting colors for vertices:
      //   sphVerts[j+4]=topColr[0]; 
      //   sphVerts[j+5]=topColr[1]; 
      //   sphVerts[j+3]=topColr[2]; 
      //   }
      // else if(s==slices-1) {
      //   sphVerts[j+4]=botColr[0]; 
      //   sphVerts[j+5]=botColr[1]; 
      //   sphVerts[j+3]=botColr[2]; 
      // }
      // else {
      //     sphVerts[j+4]=chooseColor();// equColr[0]; 
      //     sphVerts[j+5]=chooseColor();// equColr[1]; 
      //     sphVerts[j+3]=chooseColor();// equColr[2];          
      // }

    }
        sphVerts[j+3] = sphVerts[j];
       sphVerts[j+4] = sphVerts[j+1];
       sphVerts[j+5] = sphVerts[j+2];
       sphVerts[j+6] = 1;
      sphVerts[j+7] = 1;
      sphVerts[j+8] = 1;
  }
}



function initArrayBuffer(gl, attribute, data, type, num) {
//-------------------------------------------------------------------------------
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

//==================HTML Button Callbacks======================

function clearDrag() {
// Called when user presses 'Clear' button in our webpage
	xMdragTot = 0.0;
	yMdragTot = 0.0;
		  // REPORT updated mouse position on-screen
	document.getElementById('Mouse').innerHTML=
			'Mouse Drag totals (CVV coords):\t'+xMdragTot+', \t'+yMdragTot;	

	// NEW!  re-set the light-source global vars to its original values:
  lamp0.I_pos.elements.set([6.0, 5.0, 5.0]);
  draw();		// update GPU uniforms &  draw the newly-updated image.
}


//==================================Mouse and Keyboard event-handling Callbacks,
//								(modified from Week04 starter code: 5.04jt.ControlMulti.html))

function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = true;											// set our mouse-dragging flag
	xMclik = x;													// record where mouse-dragging began
	yMclik = y;
};


function myMouseMove(ev, gl, canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

//Mouse-Drag Moves Lamp0 ========================================================
	// Use accumulated mouse-dragging to change the global var 'lamp0.I_pos';
	// (note how accumulated mouse-dragging sets xmDragTot, ymDragTot below:
	//  use the same method to change the y,z coords of lamp0Pos)

	console.log('lamp0.I_pos.elements[0] = ', lamp0.I_pos.elements[0], '\n');
	lamp0.I_pos.elements.set([	
					lamp0.I_pos.elements[0],
					lamp0.I_pos.elements[1] + 4.0*(x-xMclik),	// Horiz drag: change world Y
					lamp0.I_pos.elements[2] + 4.0*(y-yMclik) 	// Vert. drag: change world Z
													]);
	/* OLD
	lamp0Pos.set([lamp0Pos[0],										// don't change world x;
								lamp0Pos[1] + 4.0*(x - xMclik),		// Horiz drag*4 changes world y
						    lamp0Pos[2] + 4.0*(y - yMclik)]);	// Vert drag*4 changes world z
*/ 
	draw();				// re-draw the image using this updated uniform's value
// REPORT new lamp0 position on-screen
		document.getElementById('Mouse').innerHTML=
			'Lamp0 position(x,y,z):\t('+ lamp0.I_pos.elements[0].toFixed(5) +
			                      '\t' + lamp0.I_pos.elements[0].toFixed(5) +
														'\t' + lamp0.I_pos.elements[0].toFixed(5) + ')';	
	
//END=====================================================================

	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);
	xMclik = x;													// Make next drag-measurement from here.
	yMclik = y;
	
/*	  // REPORT updated mouse position on-screen
		document.getElementById('Mouse').innerHTML=
			'Mouse Drag totals (CVV coords):\t'+xMdragTot+', \t'+yMdragTot;	
*/
};

function myMouseUp(ev, gl, canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	xMdragTot += (x - xMclik);
	yMdragTot += (y - yMclik);
	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
};

var x_lookat = 0, y_lookat = 0, z_lookat = 0, dist = 0; 
// Global vars for Eye position. 
// NOTE!  I moved eyepoint BACKWARDS from the forest: from z_lookat=0.25
// a distance far enough away to see the whole 'forest' of trees within the
// 30-degree field-of-view of our 'perspective' camera.  I ALSO increased
// the 'keydown()' function's effect on x_lookat position.

function keydown(ev, gl, u_ViewMatrix, viewMatrix) {
//------------------------------------------------------
//HTML calls this'Event handler' or 'callback function' when we press a key:

       var yz_angle = Math.atan((y_lookat - eyePosWorld[1])/(z_lookat - eyePosWorld[2]))
       var xz_angle = Math.atan((x_lookat - eyePosWorld[0])/(z_lookat - eyePosWorld[2]))

//---------------------up-----------------------------------------------------------------

    if(ev.keyCode == 38) { 
    	eyePosWorld[2]+= 0.5
        z_lookat += 0.5;
    }
//---------------------down-----------------------------------------------------------------        
    
    else if (ev.keyCode == 40){
    	eyePosWorld[2]-= 0.5
        z_lookat -= 0.5;
       
    }
//---------------------left-----------------------------------------------------------------
   else if (ev.keyCode == 37) { 
       	eyePosWorld[0]= eyePosWorld[0] + Math.cos(xz_angle)*0.5
        eyePosWorld[1]= eyePosWorld[1] - Math.sin(xz_angle)*0.5
        
        x_lookat+=Math.cos(xz_angle)*0.5
        y_lookat-=Math.sin(xz_angle)*0.5
      	
       
    }
//---------------------right-----------------------------------------------------------------
    else if (ev.keyCode == 39){
      	eyePosWorld[0]= eyePosWorld[0] - Math.cos(xz_angle)*0.5
        eyePosWorld[1]= eyePosWorld[1] + Math.sin(xz_angle)*0.5
        
        x_lookat-=Math.cos(xz_angle)*0.5
        y_lookat+=Math.sin(xz_angle)*0.5
        
         
    }
//---------------------forward-----------------------------------------------------------------
    else if (ev.keyCode == 87){ 
        eyePosWorld[0]= eyePosWorld[0] - Math.sin(xz_angle)*0.5
        eyePosWorld[1]= eyePosWorld[1] - Math.sin(yz_angle)*0.5
        
        x_lookat-=Math.sin(xz_angle)*0.5
        y_lookat-=Math.sin(yz_angle)*0.5
       

         
    }
//--------------------backwards-----------------------------------------------------------------
    else if (ev.keyCode == 83){ //backwards
        eyePosWorld[0]= eyePosWorld[0] + Math.sin(xz_angle)*0.5
        eyePosWorld[1]= eyePosWorld[1] + Math.sin(yz_angle)*0.5
        
        x_lookat+=Math.sin(xz_angle)*0.5
        y_lookat+=Math.sin(yz_angle)*0.5
   
        
    }

//------------------rotate right------------------------------------------------------------------
    else if (ev.keyCode == 68){ 


 		x_lookat += Math.sin(xz_angle)*0.5-0.5
    	y_lookat += Math.sin(xz_angle)*0.5+0.01
    	
    	//z_lookat += Math.sin(yz_angle)*0.5

    	// if (xz_angle == -0){
    	// 	x_lookat -= Math.sin(xz_angle)*0.5+0.1
    	// 	//y_lookat +=0.5
    	// }
    	// else if (xz_angle > 0 && xz_angle <= Math.PI/2){
    	// 	x_lookat -= 0.5
    	// 	//y_lookat += 0.5
    	// }

    	// else if (xz_angle > Math.PI/2 && xz_angle <= Math.PI){
    	// 	x_lookat += 1
    	// 	//y_lookat -= 0.5
    	// }


    }

//------------------rotate left------------------------------------------------------------------    
    else if (ev.keyCode == 65){ //rotate left


    	
 		x_lookat -= Math.sin(xz_angle)*0.5-0.5
    	y_lookat -= Math.sin(xz_angle)*0.5+0.01

    	

 
    }

//lighting
    else if (ev.keyCode == 76){
      if(blinn_bool){
        blinn_bool = false;
      }
      else{
        blinn_bool = true;
      }
    }
    else if (ev.keyCode == 75){
      if(gourand_bool_bool==1){
        gourand_bool_bool = false;
      }
      else{
        gourand_bool_bool = true;
      }
    }

    //--------------------look up--------------------------------------------------------------------
	else if (ev.keyCode == 187){
		z_lookat+= 1
	}
	//--------------------look down------------------------------------------------------------------
	else if (ev.keyCode == 189){
		z_lookat-= 1
	}


	else if (ev.keyCode == 80){
      if(headlight){
        headlight = false;
        lamp1.I_ambi.elements.set([0, 0, 0]);
  		lamp1.I_diff.elements.set([0.0, 0.0, 0.0]);
  		lamp1.I_spec.elements.set([0, 0, 0]);
      }
      else{
        headlight = true;
        lamp1.I_ambi.elements.set([0, 0, 0]);
  		lamp1.I_diff.elements.set([0.6, 0.6, 0.6]);
  		lamp1.I_spec.elements.set([2, 2, 2]);
      }
    }

    else if (ev.keyCode == 79){
    	if (overhead){
    		overhead = false
    	}
    	else{
    		overhead = true
    	}
    	
    }

    else if (ev.keyCode == 16){
        if(shift){
          shift = false
        }
        else{
          shift = true
        }
       }
    else if (ev.keyCode == 49){
        if(shift){
          red_ambient += 0.1;
        }
        else{
          red_ambient -= 0.1;
        }
       }
    else if (ev.keyCode == 50){
        if(shift){
          green_ambient += 0.1;
        }
        else{
          green_ambient -= 0.1;
        }
       }
    else if (ev.keyCode == 51){
        if(shift){
          blue_ambient += 0.1;
        }
        else{
          blue_ambient -= 0.1;
        }
       }
    else if (ev.keyCode == 52){
        if(shift){
          red_diffuse += 0.1;
        }
        else{
          red_diffuse -= 0.1;
        }
       }
    else if (ev.keyCode == 53){
        if(shift){
          green_diffuse += 0.1;
        }
        else{
          green_diffuse -= 0.1;
        }
       }
    else if (ev.keyCode == 54){
        if(shift){
          blue_diffuse += 0.1;
        }
        else{
          blue_diffuse -= 0.1;
        }
       }
    else if (ev.keyCode == 55){
        if(shift){
          red_specular += 0.04;
        }
        else{
          red_specular -= 0.04;
        }
       }
    else if (ev.keyCode == 56){
        if(shift){
          green_specular += 0.04;
        }
        else{
          green_specular -= 0.04;
        }
       }
    else if (ev.keyCode == 57){
        if(shift){
          blue_specular += 0.04;
        }
        else{
          blue_specular -= 0.04;
        }
       }
    else { return; } // Prevent the unnecessary drawing
    // draw(gl, u_ViewMatrix, viewMatrix);    

     draw();

}


function myKeyPress(ev) {
//===============================================================================
// Best for capturing alphanumeric keys and key-combinations such as 
// CTRL-C, alt-F, SHIFT-4, etc.
	switch(ev.keyCode)
	{
		case 77:	// UPPER-case 'M' key:
		case 109:	// LOWER-case 'm' key:
			matlSel = (matlSel +1)%MATL_DEFAULT;		// see materials_Ayerdi.js for list
			console.log('MatlSel=', matlSel, '\n');
			mat_bunny_ears = new Material(matlSel);					// REPLACE our current material, &
			draw();								// re-draw on-screen image.
			break;
		case 80: // UPPER-case 's' key:
			mat_bunny_ears.K_shiny += 1.0;								// INCREASE shinyness, but with a
			if(mat_bunny_ears.K_shiny > 128.0) mat_bunny_ears.K_shiny = 128.0;	// upper limit.
			console.log('UPPERcase S: ++K_shiny ==', mat_bunny_ears.K_shiny,'\n');	
			draw();														// re-draw on-screen image.
			break;
		case 79:	// LOWER-case 's' key:
			mat_bunny_ears.K_shiny += -1.0;								// DECREASE shinyness, but with a
			if(mat_bunny_ears.K_shiny < 1.0) mat_bunny_ears.K_shiny = 1.0;		// lower limit.
			console.log('lowercase s: --K_shiny ==', mat_bunny_ears.K_shiny, '\n');
			draw();													// re-draw on-screen image.
			break;
		default:
		break;
	}
}

g_last = Date.now();


function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;

  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
  if(angle >   45.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
  if(angle <  -45.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  
  return newAngle %= 360;
}

gg_last = Date.now();
function animate2(angle1, angle2) {
//==============================================================================
  return angle1*2
}