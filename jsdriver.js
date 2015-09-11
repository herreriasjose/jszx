function uploadLocalFile(nameFile) {
	
	    var input, file, fr;
	    
	    file = nameFile || "";
	    
	    if (typeof window.FileReader !== 'function') {
            console.log("The file API isn't supported on this browser.");
            return;
        };
	    
		input = document.getElementById('fileinput');
		
		if (file == "") {
			if (!input) {
				console.log("Couldn't find the fileinput element.");
				return;
			}
			else if (!input.files) {
				console.log("This browser doesn't seem to support the 'files' property of file inputs.");
				return;
			}
			else if (!input.files[0]) {
				console.log("Please select a file before clicking 'Load'");
				return;
			}
			else {
				file = input.files[0];
			};
			  		
			fr = new FileReader();
			fr.onload = receivedLocalBinary;
			fr.readAsBinaryString(file);
			
		} else {
			
			// Download remote file
			xmlhttp = getXmlHttp();
			xmlhttp.onreadystatechange = function() { //Asynchronous requests
			if (xmlhttp.readyState==4) { 
				  setupZ80file(xmlhttp.responseText); 
				}
			}
			
			xmlhttp.open("GET", file, true); // Asynchronous requests
			xmlhttp.overrideMimeType('text/plain; charset=x-user-defined');
			xmlhttp.send(null);
			
		};

		

        function receivedLocalBinary() {
            setupZ80file(fr.result);
        }
    }

/* Version 1 of the .z80 format can save only 48K snapshots */

function setupZ80file(file) {	
		
		var compressed = false;
		var header = [30];
		var temp = 0;
		
		console.log("Setting up Z80 file");
		Z80.isRunning = 0;
		Z80.reset();

		for (var n = 0; n < 30; n++) { // Let's extract the header 
			header[n] = (file.charCodeAt(n) & 0xFF);
		};
		
			
		Z80._r._A = header[0];
		Z80._r._F = header[1];
		Z80._r._C = header[2];
		Z80._r._B = header[3];
		Z80._r._Lset(header[4]);
		Z80._r._Hset(header[5]);
		
		Z80._r._PC = ( header[6] | (header[7] << 8) );
		Z80._r._SP = ( header[8] | (header[9] << 8) );
		
		Z80._r._I = header[10];
		Z80._r._R = header[11];
		
		temp = header[12];
		
		/* Byte 12      Bit 0  : Bit 7 of the R-register
                        Bit 1-3: Border colour
                        Bit 4  : 1 = Basic SamRom switched in
                        Bit 5  : 1 = Block of data is compressed
                        Bit 6-7: No meaning */
                        
		if (temp == 255) temp = 1;
		
		// Z80.setBorder(254, ((temp >> 1) & 0x07), 0); // ToDo
		
		if (temp & 0x01 != 0) {
			Z80._r._R = (Z80._r._R | 0x80);
			}
			
		compressed = ((temp & 0x20) != 0);
		
		Z80._r._Eset(header[13]);
		Z80._r._Dset(header[14]);
		
		temp = Z80._r._AFget();
		Z80._r._AFset(Z80._r._AF_);
		Z80._r._AF_ = temp;
		
		temp = Z80._r._BCget();
		Z80._r._BCset(Z80._r._BC_);
		Z80._r._BC_ = temp;
			
		temp = Z80._r._DE;
		Z80._r._DE = Z80._r._DE_;
		Z80._r._DE_ = temp;
			
		temp = Z80._r._HL;
		Z80._r._HL = Z80._r._HL_;
		Z80._r._HL_ = temp;
		
		Z80._r._C = header[15];
		Z80._r._B = header[16];
		Z80._r._Eset(header[17]);
		Z80._r._Dset(header[18]);
		Z80._r._Lset(header[19]);  
		Z80._r._Hset(header[20]); 

		Z80._r._A = header[21];
		Z80._r._Fset(header[22]); 
		
		temp = Z80._r._AFget();
		Z80._r._AFset(Z80._r._AF_);
		Z80._r._AF_ = temp;
		
		temp = Z80._r._BCget();
		Z80._r._BCset(Z80._r._BC_);
		Z80._r._BC_ = temp;
			
		temp = Z80._r._DE;
		Z80._r._DE = Z80._r._DE_;
		Z80._r._DE_ = temp;
			
		temp = Z80._r._HL;
		Z80._r._HL = Z80._r._HL_;
		Z80._r._HL_ = temp;
		
		Z80._r._IY =  ( header[23] | (header[24] << 8));
		Z80._r._IX =  ( header[25] | (header[26] << 8));

		Z80._r._IFF1 = ( header[27] != 0 );
		Z80._r._IFF2 = ( header[28] != 0 );
		
		temp = (header[29] & 0x03);
		
		if (temp == 0) Z80._r._IM = 0;
		else if (temp == 1) Z80._r._IM = 1;
		else Z80._r._IM = 2;
		
		
		
		if (Z80._r._PC == 0) {
			// extended Z80 // ToDo
			console.log("Format not support");
			
		} else {
			
			if (compressed) {
						var tFile = [];
						var size = 0;
						var i,j = 0;
						var addr = 16384;
						
						for(i = 0,j = 30; j < file.length; i++,j++) {
							tFile[i] = file.charCodeAt(j) & 0xff;
						};
						i = j = 0;
						file = tFile;
						size = file.length;
						
						while ((i < size) && (addr < 65536)) {
							temp = file[i];
							i = i + 1;
							if (temp != 0xED) {
								memory[addr] = temp;
								addr = addr + 1;
							} else {
								temp = file[i];
								i = i + 1;
								if (temp != 0xED) {
									memory[addr] = 0xED;
									i = i -1;
									addr = addr + 1; 
								} else {
									var count = file[i];
									i = i + 1;
									temp = file[i];
									i = i + 1;
									while (count != 0) {
											count = count - 1;
											memory[addr] = temp;
											addr = addr + 1;
									};
								};								
							};
						};
									
						run();
			} else {
				
				// ToDo
				console.log("Format not support");
			};
		};
		
};

function getXmlHttp() {
   if (window.XMLHttpRequest) {
      xmlhttp=new XMLHttpRequest();
   } else if (window.ActiveXObject) {
      xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
   }
   if (xmlhttp == null) {
      console.log("Your browser does not support XMLHTTP.");
   }
   return xmlhttp;
};
