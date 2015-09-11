var modelROM = "48.ROM";
var autoLoadFile = "";
var clockFrequency = 3.5;
var fps = 50;
var memory = bytes(65536);
var bck_memory = bytes(65536);
//var ie = 0; // Internet Explorer

var zxScreen = null;
var imageData; // Our canvas
var w_resolution = 320; // Original width = 256 pixels + 64 pixels border
var h_resolution = 240; // Original height = 192 pixels + 48 pixels border
var x_scale = 1;
var y_scale = 1;

// var flash = 0; // 16 frames and blinks // ToDo
// var IRQ = false; // Interruptions // ToDo

var pal = [
	// BRIGHT 0 (RGB)
	[0,0,0], // Binary value 000
	[0,0,205], // 001
	[205,0,0], // 010
	[205,0,205], // 011
	[0,205,0], // 100
	[0,205,205], // 101
	[205,205,0], // 110
	[205,205,205], // 111
	
	// BRIGHT 1 (RGB)
	[0,0,0], // Binary value 000
	[0,0,255], // 001
	[255,0,0], // etc.
	[255,0,255],
	[0,255,0],
	[0,255,255],
	[255,255,0],
	[255,255,255]	
];


function bytes(n){
	
	try {
		/* The Uint8Array typed array represents an array of 8-bit unsigned integers. The contents are initialized to 0. */
		return new Uint8Array(n);
	} catch (e) {
		console.log("Error trying to set up the memory");
	};
};

function createContext(width, height){
	
	var canvas = document.createElement("canvas");
	div = document.getElementById("Screen");
	canvas.width = width;
	canvas.height = height;
	div.appendChild(canvas);
	return canvas.getContext("2d");

};


function dumpBinaryInConsole(m,n,name) {
        
        var markup, result, num, aByte, byteStr, label;
        markup = [];
        
        if (n) { num = n;}
        else num = m.length
        
        if (name) { label = name;}
        else label = "No Name";
        
        console.log("DATA DUMP " +label + " (" + num + " bytes): ");
        
        for (n = 0; n < num; ++n) {
            aByte = m[n];
            byteStr = aByte.toString(16);
            if (byteStr.length < 2) {
                byteStr = "0" + byteStr;
            }
            markup.push(byteStr);
        };

        console.log(markup.join(" "));       
   };

function init(args) {
	
	switch (args[0]){
		case "MODEL48K": 
			modelROM = "48.ROM";
			break;
		case "MODEL128K":
			modelROM = "128.ROM"; // ToDo
			break;
		default:
			modelROM = "48.ROM";
			break;		
	};
	
	switch (args[1]) { // Screen scale // ToDo
		default:
			x_scale = y_scale = 1;
			break;
	};

	console.log("Starting JSpectrum");
	zxScreen = createContext(w_resolution,h_resolution);
	zxScreen.fillStyle="#aaaaaa";
	zxScreen.fillRect(0,0,w_resolution,h_resolution);
	
	imageData = zxScreen.createImageData(w_resolution, h_resolution);
	
	document.onkeydown = keyDown;
	document.onkeypress = keyPress;
    document.onkeyup = keyUp;
    document.onresize = document.body.onresize = onResize;
    ULA.init();
    
    if((args[2]) || (args[2] != "")) {
		autoLoadFile = args[2];
	};
	
	loadROM(modelROM);

};

function loadROM(fileROM) {
	
	function putInMemory(filestream) {
		 for (var n = 0; n < filestream.length; n++) {
				var abyte = filestream.charCodeAt(n) & 0xff; // Throw away high-order byte
				memory[n] = abyte;
			};
		
		 bck_memory = memory;	
		 
		 if ((autoLoadFile == "") || (!autoLoadFile)) {;
			run();
		 } else uploadLocalFile(autoLoadFile);
	};
	
	xmlhttp = getXmlHttp();
	xmlhttp.onreadystatechange = function() { //Asynchronous requests
    if (xmlhttp.readyState==4) { 
          putInMemory(xmlhttp.responseText); 
		}
	}
	
    xmlhttp.open("GET", fileROM, true); // Asynchronous requests
    xmlhttp.overrideMimeType('text/plain; charset=x-user-defined');
    xmlhttp.send(null);
	console.log("ROM loaded");

};


function onResize() {
	// ToDo
};

function run(){
	console.log("Z80 started");
	Z80.start();
};

