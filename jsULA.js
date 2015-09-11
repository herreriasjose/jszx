ULA = {
	
	// upper_border : false, // ToDo
	// bottom_border : false, // ToDo
	
	audioBeeperVal : 0,
	audioBuffer : null,
	audioBufNumb : 12,
	audioCounter : 0,
	audioCtx : null,
	audioIsPlaying : false,
	audioNode : null,
	audioReady : true,
	audioSampleOut : [],
	audioSource : null,
	audioWaveAddTStates : 158, // 48K model
	audioWaveOut : [48000],
	audioWavePtr : 0,
	
	NUM_WAV_BUFFERS : 50,
	WAVE_FREQUENCY : 22050,
	WAV_BUFFER_SIZE : 441, // (WAVE_FREQUENCY / NUM_WAV_BUFFERS)
	NUM_CHANNELS : 1,

	keyStates : [255,255,255,255,255,255,255,255],
	
	addSoundWave: function (ts) {
		
		ULA.audioCounter = ULA.audioCounter + ts;
		while (ULA.audioCounter >= ULA.audioWaveAddTStates) {
			ULA.audioWaveOut[ULA.audioWavePtr] = ULA.audioBeeperVal;
			ULA.audioWavePtr += 1;
			ULA.audioCounter = ULA.audioCounter - ULA.audioWaveAddTStates;
		};
	  
	},
	
	init: function() {
		
		for(var row = 0; row < 8; row++){
			ULA.keyStates[row] = 0xFF; // Zero indicates a pressed Key
		};
		ULA.setUpAudio();
		console.log("ULA OK");

	},
	
	audioWaveOutWrite: function() {
		
		if(ULA.audioIsPlaying) {
					ULA.audioNode.stop(0);
					ULA.audioIsPlaying = false;
					return;
				};
		
		if (ULA.audioReady) {
			
				ULA.audioNode = ULA.audioCtx.createBufferSource();
				
				ULA.audioBuffer = ULA.audioCtx.createBuffer(1, ULA.WAV_BUFFER_SIZE, ULA.WAVE_FREQUENCY);
				
				var data = ULA.audioBuffer.getChannelData(0);
				var gain = ULA.audioCtx.createGain();
			  
				  for (var i = 0; i < ULA.WAV_BUFFER_SIZE; i++) {
							data[i] = ULA.audioWaveOut[i];
							};		
				
				  ULA.audioNode.buffer = ULA.audioBuffer;
				  ULA.audioNode.loop = false;
				  ULA.audioNode.connect(gain);
				  // Making it less loud
				  gain.gain.value = 0.2;
				  gain.connect(ULA.audioCtx.destination)
				  ULA.audioNode.start(0);
				  ULA.audioIsPlaying = true;
				  
				  ULA.audioNode.onended = function() {
					  ULA.audioIsPlaying = false;
						};
			};
		},
	
	
	reset: function () {
		
		for (var n = 0; n < ULA.keyStates.length; n++) {
			ULA.keyStates[n] = 255;
		};
	},
	
	setUpAudio: function () {
			
			for(var i= 0; i < ULA.audioWaveOut.length; i++) {
				ULA.audioWaveOut[i] = 0;
			};
		
			if (ULA.audioReady) {
					try {
						window.AudioContext = window.AudioContext||window.webkitAudioContext;
						ULA.audioCtx = new AudioContext();
						ULA.audioSource = ULA.audioCtx.createBufferSource();
					}  catch(e) {
						ULA.audioReady = false;
					};
					
					if(ULA.audioCtx.createScriptProcessor){
						// The bufferSize must be one of the following values: 256, 512, 1024, 2048, 4096, 8192, 16384
						ULA.audioNode = ULA.audioCtx.createScriptProcessor(8192,ULA.NUM_CHANNELS,ULA.NUM_CHANNELS);
					}
					else if(this.context.createJavaScriptNode){
						ULA.audioNode = ULA.audioCtx.createJavaScriptNode(8192,ULA.NUM_CHANNELS,ULA.NUM_CHANNELS);
					}
					else {
						ULA.audioReady = false;
					};
					if (ULA.audioReady)
					{		
						console.log("Audio Ready");
						}			
					else console.log("WebAudio API is not supported in this browser");
		};
		
	},

	updateScreen: function () {
			
			function setPixel(imageData,y,x,color) {
					var index = (x * imageData.width + y ) * 4;
					
					imageData.data[index+0] = color[0];
					imageData.data[index+1] = color[1];
					imageData.data[index+2] = color[2];
					imageData.data[index+3] = 255;		
					
				};
	
			for(var addr = 16348; addr < 22527 + 1; addr++) {
						
				var y = ((addr & 0x00e0) >> 2) + ((addr & 0x0700) >> 8) + ((addr & 0x1800) >> 5);
				var sx = (addr & 0x1f) << 3;
				
				var attr = memory[22528 + (addr & 0x1f) + ((y>>3)*32)];
				var bright = ((attr >> 3) & 0x08);
				var ink = (attr & 0x07) | bright;
				var pap = ((attr >> 3) & 0x07) | bright;
				
				var byte = memory[addr];

				if ((1 << 7) & byte) color = ink;
					else color = pap;
				setPixel(imageData,sx,y,pal[color]);
				sx += 1;
				if ((1 << 6) & byte) color = ink;
					else color = pap;
				setPixel(imageData,sx,y,pal[color]);
				sx += 1;
				if ((1 << 5) & byte) color = ink;
					else color = pap;
				setPixel(imageData,sx,y,pal[color]);
				sx += 1;
				if ((1 << 4) & byte) color = ink;
					else color = pap;
				setPixel(imageData,sx,y,pal[color]);
				sx += 1;
				if ((1 << 3) & byte) color = ink;
					else color = pap;
				setPixel(imageData,sx,y,pal[color]);
				sx += 1;
				if ((1 << 2) & byte) color = ink;
					else color = pap;
				setPixel(imageData,sx,y,pal[color]);
				sx += 1;
				if ((1 << 1) & byte) color = ink;
					else color = pap;
				setPixel(imageData,sx,y,pal[color]);
				sx += 1;
				if (1  & byte) color = ink;
					else color = pap;
				setPixel(imageData,sx,y,pal[color]);

				}
		
				zxScreen.putImageData(imageData,0,0);
	
		},
		
		pressKey: function(keyRow, keyMask, state) {
			if(state) {
				ULA.keyStates[keyRow] &= ~keyMask;
			}
			else {
				ULA.keyStates[keyRow] |= keyMask;
			};
		},
		
}
