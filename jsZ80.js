Z80 = {
	 
	 now : 0, // Delays
	 delta: 0,
	 then: 0,
	 interval: (1000 / fps),
	 	
     tStates: 0,
     tStatesXinterrupt: 0,
     isRunning: 0,	
	
	 // Register set 
	 
	_r: { 
		_A: 0, _B: 0, _C: 0, _DE: 0, _HL:0, // Main Registers
		
		_fS: 0, _fZ: 0, _f5: 0, _fH: 0, _f3: 0, _fP: 0, _fN: 0, _fC: 0, // Register F is divided in 8 bit flags
		
		_AF_:0, _BC_:0, _DE_: 0, _HL_: 0, // Alternative registers
		
		_I: 0, _R: 0, _R7:0, // Interrupt Vector and Refresh Register
		
		_IX: 0, _IY: 0, // Index Registers
		_IT: 0, // Index temp
		
		_IFF1: 0, _IFF2: 0, _IM: 0, // Interruptions flip-flops
		
		_SP: 0, // Stack Pointer
		
		_PC: 0, // Program counter
		
		_parity: [],
		
		_halted: false,
		
		_adc16: function(reg1, reg2){ //Add reg2 to reg1 with carry
			var c = Z80._r._fC? 1: 0;
			var t1 = reg1 + reg2 + c;
			var t2 = t1 & 0xFFFF;
			
			
			Z80._r._f3 = (t2 & (0x08 << 8));
			Z80._r._f5 = (t2 & (0x20 << 8));
			Z80._r._fS = (t2 & (0x80 << 8));
			Z80._r._fZ = (t2 == 0);
			Z80._r._fC = (t1 & 0x10000);
			Z80._r._fP = (((reg1 ^ ~reg2) & (reg1 ^ t2) & 0x8000));
			Z80._r._fH = ((((reg1 & 0x0FFF) + (reg2 & 0x0FFF)) + c) & 0x1000);
			Z80._r._fN = 0;
			
			return t2;
		},
		
		_add16: function(reg1, reg2) { //Add reg2 to reg1
			var t1 = reg1 + reg2;
			var t2 = t1 & 0xFFFF;
						
			Z80._r._f3 = ((t2) & (0x08 << 8)) != 0;
			Z80._r._f5 = ((t2) & (0x20 << 8)) != 0; 
			Z80._r._fC = (t1 & 0x10000); // Set to 1 if there's carry in #15
			Z80._r._fH = (((reg1 & 0x0FFF) + (reg2 & 0X0FFF)) & 0x1000); // Set TRUE if there isn't carry in bit #11			
			Z80._r._fN = 0; // Set to 0 always
						
			return t2;
			
		},
		
		_addA: function(value) { // Add to A // Changes all flags
			var t1 = Z80._r._A + value;
			var t2 = t1 & 0xFF;
			
			Z80._r._fS = ((t2 & 0x80) != 0);
			Z80._r._f3 = ((t2 & 0x08) != 0);
			Z80._r._f5 = ((t2 & 0x20) != 0);
			Z80._r._fZ = ( t2 == 0);
			Z80._r._fC = ((t1 & 0x100) != 0);
			Z80._r._fP = (((Z80._r._A ^ ~value) & (Z80._r._A ^ t2) & 0x80) != 0);
			Z80._r._fH = ((((Z80._r._A & 0x0F) + (value & 0x0F)) & 0x10) != 0);
			Z80._r._fN = 0;
			
			Z80._r._A = t2;
		},
		
		_adcA: function(value) { // Add with carry // Changes all flags
			var a = Z80._r._A;
			var c = (Z80._r._fC ? 1 : 0);
			var t1 = a + value + c;
			var t2 = t1 & 0xFF;
			
			Z80._r._fS = ((t2 & 0x80) != 0);
			Z80._r._f3 = ((t2 & 0x08) != 0);
			Z80._r._f5 = ((t2 & 0x20) != 0);
			Z80._r._fZ = ( t2 == 0);
			Z80._r._fC = ((t1 & 0x100) != 0);
			Z80._r._fP = (((a ^ ~value) & (a ^ t2) & 0x80) != 0);
			Z80._r._fH = ((((a & 0x0F) + (value & 0x0F) + c) & 0x10) != 0);
			Z80._r._fN = 0; 
			
			Z80._r._A = t2;
		},
		
		_AFget: function() {
			return ((Z80._r._A << 8) | Z80._r._Fget());
		},	
		
		_AFset: function(reg) {
			Z80._r._A = (reg >> 8);
			if((reg & 0x80)) Z80._r._fS = 1;
				else Z80._r._fS = 0;
			if((reg & 0x40)) Z80._r._fZ = 1;
				else Z80._r._fZ = 0;
			if((reg & 0x20)) Z80._r._f5 = 1;
				else Z80._r._f5 = 0;	
			if((reg & 0x10)) Z80._r._fH = 1;
				else Z80._r._fH = 0;	
			if((reg & 0x08)) Z80._r._f3 = 1;
				else Z80._r._f3 = 0;
			if((reg & 0x04)) Z80._r._fP = 1;
				else Z80._r._fP = 0;
			if((reg & 0x02)) Z80._r._fN = 1;
				else Z80._r._fN = 0;
			if((reg & 0x01)) Z80._r._fC = 1;
				else Z80._r._fC = 0;
				
		}, 
		
		_andA: function(value) {
			var temp = Z80._r._A & value;
			
			Z80._r._fS = ((temp & 0x80) != 0);
			Z80._r._f3 = ((temp & 0x08) != 0);
			Z80._r._f5 = ((temp & 0x20) != 0);
			Z80._r._fZ = (temp == 0);
			Z80._r._fC = 0;  
			Z80._r._fP = Z80._r._parity[temp];
			Z80._r._fH = 1;  
			Z80._r._fN = 0;  
			
			Z80._r._A = temp;
			
		},
		
		_bit: function(b,reg) { // Test bit // Changes all but C flag
			var temp = ((reg & b) != 0);
			
			Z80._r._fN = 0; 
			Z80._r._fP = (!temp);
			Z80._r._f3 = ((reg & 0x08) != 0);
			Z80._r._fH = 1;  
			Z80._r._f5 = ((reg & 0x20) != 0);
			Z80._r._fZ = (!temp);
			Z80._r._fS = (b == 0x80 ? temp : 0);
		},
		
		_BCget: function() {
			
			return (Z80._r._B << 8)  | Z80._r._C;
		},
		
		_BCset: function(value) {
			Z80._r._B = value >> 8;
			Z80._r._C = value & 0xFF;
		},
		
		_cpA: function(value) { // Define una instrucción que compara el octeto representado por el operando con el registro acumulador.
			var a = Z80._r._A;
			var t1 = a - value;
			var t2 = t1 & 0xFF;
			
			Z80._r._fS = (t2 & 0x80);
			Z80._r._f3 = (value & 0x08); 
			Z80._r._f5 = (value & 0x20);
			Z80._r._fZ = (t2 == 0);
			Z80._r._fC = (t1 & 0x100);
			Z80._r._fP = ((a ^ value) & (a ^ t2) & 0x80);
			Z80._r._fH = (((a & 0x0F) - (value & 0x0F)) & 0x10);
			Z80._r._fN = 1;  
						
		},
		
		_Dget: function() {
			return (Z80._r._DE >> 8);
		},
		
		_Dset: function(value) {
			Z80._r._DE = (Z80._r._DE & 0xFF);
			Z80._r._DE = ((value << 8) | Z80._r._DE);
		},
		
		
		_dec8: function(reg) { // Updates flags (except C)
			
			var parv = (reg == 0x80);
			var hc = ((reg & 0x0F) - 1) & 0x10; // Half Carry
			reg = (reg - 1) & 0xFF;
			
			Z80._r._fS = (reg & 0x80); // Sign of the last operation
			Z80._r._f3 = (reg & 0x08);
			Z80._r._f5 = (reg & 0x20);
			Z80._r._fZ = (reg == 0);
			Z80._r._fP = parv;
			Z80._r._fH = hc;
			Z80._r._fN = 1;
						
			return reg;
			
		},
			
		_Eget: function() {
			return (Z80._r._DE & 0xFF);
		},
		
		_Eset: function(value) {
			Z80._r._DE = ((Z80._r._DE & 0xFF00) | value);
		},
		
		_Fget: function() {
			
			var temp = 0;
			if (Z80._r._fS) (temp |= 0x80);
			if (Z80._r._fZ) (temp |= 0x40);
			if (Z80._r._f5) (temp |= 0x20);
			if (Z80._r._fH) (temp |= 0x10);
			if (Z80._r._f3) (temp |= 0x08);
			if (Z80._r._fP) (temp |= 0x04);
			if (Z80._r._fN) (temp |= 0x02);
			if (Z80._r._fC) (temp |= 0x01);
			return temp;			
		},
		
		_Fset: function(value) {
			Z80._r._fS =  (value & 0x80);
			Z80._r._fZ =  (value & 0x40);
			Z80._r._f5 =  (value & 0x20);
			Z80._r._fH =  (value & 0x10);
			Z80._r._f3 =  (value & 0x08);
			Z80._r._fP =  (value & 0x04);
			Z80._r._fN =  (value & 0x02);
			Z80._r._fC =  (value & 0x01);

		},
	
		_Hget: function() {
			return (Z80._r._HL >> 8);
		},
		
		_Hset: function(value) {
			Z80._r._HL &= 0xFF;
			Z80._r._HL |= (value << 8);
		},
		
		_in: function(port) { // Reads a byte from the selected port 
			var temp = 0xFF;
			if( (port & 0x0001) == 0){
				// Here, the rows to read are indicated by Zero
				if((port & 0x8000) == 0) temp &= ULA.keyStates[0];  
				if((port & 0x4000) == 0) temp &= ULA.keyStates[1];
				if((port & 0x2000) == 0) temp &= ULA.keyStates[2];
				if((port & 0x1000) == 0) temp &= ULA.keyStates[3];
				if((port & 0x0800) == 0) temp &= ULA.keyStates[4];
				if((port & 0x0400) == 0) temp &= ULA.keyStates[5];
				if((port & 0x0200) == 0) temp &= ULA.keyStates[6];
				if((port & 0x0100) == 0) temp &= ULA.keyStates[7];				
			};
			return temp;
		},
				
		_inc8: function(reg) { // Updates flags (except C)
			
			var parv = (reg == 0x7F);
			var hc = ((reg & 0x0F) + 1) & 0x10; // Half Carry
			reg = (reg + 1) & 0xFF;
			
			Z80._r._fS = (reg & 0x80); // Sign of the last operation
			Z80._r._fZ = (reg == 0);
			Z80._r._f5 = (reg & 0x20);
			Z80._r._f3 = (reg & 0x08);
			Z80._r._fN = 0;
			
			Z80._r._fP = parv;
			Z80._r._fH = hc;			
			
			// Does not change flag C
			return reg;
		},
		
		_in_bc: function() {
			var value = Z80._r._in(Z80._r._BCget());
			
			Z80._r._fS = (value & 0x80);
			Z80._r._fZ = (value == 0);
			Z80._r._f3 = (value & 0x08);
			Z80._r._f5 = (value & 0x20);
			Z80._r._fN = 0;
			Z80._r._fH = 0;		
			Z80._r._fP = Z80._r._parity[value];

			return value;
			
		},
	
		_Lget: function() {
			return (Z80._r._HL & 0xFF);
		},
		
		_Lset: function(value) {
			Z80._r._HL = ((Z80._r._HL & 0xFF00) | value);
		},
		
		_pop: function() {
			var temp = Z80._r._SP; 
			var value = memory[temp];
			temp = (temp + 1) & 0xFFFF;	
			value |= (memory[temp] << 8);
			temp = (temp + 1) & 0xFFFF;	
			Z80._r._SP = temp; 
			return value;			
		},
		
		_push: function(value) {
			var sp = (Z80._r._SP - 2) & 0xFFFF;
			Z80._r._SP = sp;
			memory[sp] = value & 0xFF; 
			sp++;
			memory[sp & 0xFFFF] = value >> 8;
		},
		
		_out: function(port,value,states) { 
		
			if( value & 16) { 
					ULA.audioBeeperVal = 1;
			} else {
					ULA.audioBeeperVal = 0;
			};
		},
		
		_orA: function(value) { //Bitwise OR // Changes all flags
			var temp = Z80._r._A | value;
			
			Z80._r._fS = ((temp & 0x80) != 0);
			Z80._r._f3 = ((temp & 0x08) != 0);
			Z80._r._f5 = ((temp & 0x20) != 0);
			Z80._r._fZ = ( temp == 0);
			Z80._r._fC = 0; 
			Z80._r._fP = Z80._r._parity[temp];
			Z80._r._fH = 0; 
			Z80._r._fN = 0; 
			
			Z80._r._A = temp;			
		},
		
		_rl: function(value) { //Rotate Left through carry // Changes Flags
			var carry= ((value & 0x80) != 0);
			
			if(Z80._r._fC){
				value = (value << 1) | 0x01;
				} else {
					value <<= 1; };
			
			value &= 0xFF;
			
			Z80._r._f3 = ((value & 0x08) != 0);
			Z80._r._fS = ((value & 0x80) != 0);
			Z80._r._f5 = ((value & 0x20) != 0);
			Z80._r._fZ = (value == 0);
			Z80._r._fP = Z80._r._parity[value];
			Z80._r._fN = 0; 
			Z80._r._fH = 0; 
			Z80._r._fC = carry;
			
			return value;
		},
		
		_rlc: function(value) { // Rotate value to Left // Changes Flags
			var carry= ((value & 0x80) != 0);
			
			if(carry){
				value = (value << 1) | 0x01;
				} else {
					value <<= 1; };
			
			value &= 0xFF;
			
			Z80._r._f3 = ((value & 0x08) != 0);
			Z80._r._fS = ((value & 0x80) != 0);
			Z80._r._f5 = ((value & 0x20) != 0);
			Z80._r._fZ = (value == 0);
			Z80._r._fP = Z80._r._parity[value];
			Z80._r._fN = 0;  
			Z80._r._fH = 0;  
			Z80._r._fC = carry;
			
			return value;
		},
		
		_rr: function(value) { //Rotate Right through Carry // Change Flags
			var carry= ((value & 0x01) != 0);
			
			if(Z80._r._fC){
				value = (value >> 1) | 0x80;
				} else {
					value >>= 1; };
			
					
			Z80._r._f3 = ((value & 0x08) != 0);
			Z80._r._fS = ((value & 0x80) != 0);
			Z80._r._f5 = ((value & 0x20) != 0);
			Z80._r._fZ = (value == 0);
			Z80._r._fP = Z80._r._parity[value];
			Z80._r._fN = 0;  
			Z80._r._fH = 0;  
			Z80._r._fC = carry;
			
			return value;
		},
		
		_rrc: function(value) { // Rotate value to Right // Changes flags
			var carry= ((value & 0x01) != 0);
			
			if(carry){
				value = (value >> 1) | 0x80;
				} else {
					value >>= 1; };
			
					
			Z80._r._f3 = ((value & 0x08) != 0);
			Z80._r._fS = ((value & 0x80) != 0);
			Z80._r._f5 = ((value & 0x20) != 0);
			Z80._r._fZ = (value == 0);
			Z80._r._fP = Z80._r._parity[value];
			Z80._r._fN = 0; 
			Z80._r._fH = 0;
			Z80._r._fC = carry;
			
			return value;
		},
		
		_sbc16: function(reg1,reg2) { // Subtract 2 registers with carry
			var c = Z80._r._fC? 1: 0;
			var t1 = reg1 - reg2 - c;
			var t2 = t1 & 0xFFFF;
			
			Z80._r._f3 = ((t2 & (0x08 << 8)) != 0);
			Z80._r._fS = ((t2 & (0x80 << 8)) != 0);
			Z80._r._f5 = ((t2 & (0x20 << 8)) != 0);
			Z80._r._fZ = (t2 == 0);
			Z80._r._fP = ((reg1 ^ reg2) & (reg1 ^ t2) & 0x8000);
			Z80._r._fN = 1;
			Z80._r._fH = (((reg1 & 0x0FFF) - (reg2 & 0x0FFF) - c) & 0x1000);
			Z80._r._fC = t1 & 0x10000;
			
			return t2;
			
			
		},
		
		_sbcA: function(value) { // Subtract with carry
			var a = Z80._r._A;
			var c = (Z80._r._fC? 1: 0);
			var t1 = a - value - c;
			var t2 = t1 & 0xFF;
			
			Z80._r._fS = ((t2 & 0x80) != 0);
			Z80._r._f3 = ((t2 & 0x08) != 0);
			Z80._r._f5 = ((t2 & 0x20) != 0);
			Z80._r._fZ = ( t2 == 0);
			Z80._r._fC = ((t1 & 0x100) != 0);
			Z80._r._fP = ((a ^ value) & (a ^ t2) & 0x80) != 0;
			Z80._r._fH = (((a & 0x0F) - (value & 0x0F) - c) & 0x10) != 0;
			Z80._r._fN = 1;
			
			Z80._r._A = t2;
		},
		
		_signedByte: function(value) { // Returns a value between -128 to 127
			if (value > 127) return (value - 256);
			else return value;
		},
		
		_sla: function(value) { // Shift Left Arithmetic // Changes flags
			var carry= ((value & 0x80) != 0);
			value = (value << 1) & 0xFF;
			
			Z80._r._f3 = ((value & 0x08) != 0);
			Z80._r._fS = ((value & 0x80) != 0);
			Z80._r._f5 = ((value & 0x20) != 0);
			Z80._r._fZ = (value == 0);
			Z80._r._fP = Z80._r._parity[value];
			Z80._r._fN = 0;
			Z80._r._fH = 0;
			Z80._r._fC = carry;
			
			return value;
		},
		
		_sls: function(value) { // Shift Left Arithmetic and Set // Changes flags
			var carry= ((value & 0x80) != 0);
			value = ((value << 1) | 0x01) & 0xFF;
			
			Z80._r._f3 = ((value & 0x08) != 0);
			Z80._r._fS = ((value & 0x80) != 0);
			Z80._r._f5 = ((value & 0x20) != 0);
			Z80._r._fZ = (value == 0);
			Z80._r._fP = Z80._r._parity[value];
			Z80._r._fN = 0; 
			Z80._r._fH = 0; 
			Z80._r._fC = carry;
			
			return value;
		},
		
		_sra: function(value) { // Shift Right Arithmetic // Changes flags
			var carry= ((value & 0x01) != 0);
			value = (value >> 1) |  (value & 0x80);
			
			Z80._r._f3 = ((value & 0x08) != 0);
			Z80._r._fS = ((value & 0x80) != 0);
			Z80._r._f5 = ((value & 0x20) != 0);
			Z80._r._fZ = (value == 0);
			Z80._r._fP = Z80._r._parity[value];
			Z80._r._fN = 0; 
			Z80._r._fH = 0; 
			Z80._r._fC = carry;
			
			return value;
		},
		
		_srl: function(value) { // Shift Right Logical // Changes flags
			var carry= ((value & 0x01) != 0);
			value = value >> 1;
			
			Z80._r._f3 = ((value & 0x08) != 0);
			Z80._r._fS = ((value & 0x80) != 0);
			Z80._r._f5 = ((value & 0x20) != 0);
			Z80._r._fZ = (value == 0);
			Z80._r._fP = Z80._r._parity[value];
			Z80._r._fN = 0; 
			Z80._r._fH = 0; 
			Z80._r._fC = carry;
			
			return value;
		},
		
		_subA: function(value) {
			var a = Z80._r._A;
			var t1 = a - value;
			var t2 = t1 & 0xFF;
			
			Z80._r._fS = ((t2 & 0x80) != 0);
			Z80._r._f3 = ((t2 & 0x08) != 0);
			Z80._r._f5 = ((t2 & 0x20) != 0);
			Z80._r._fZ = ( t2 == 0);
			Z80._r._fC = ((t1 & 0x100) != 0);
			Z80._r._fP = ((a ^ value) & (a ^ t2) & 0x80) != 0;
			Z80._r._fH = (((a & 0x0F) - (value & 0x0F)) & 0x10) != 0;
			Z80._r._fN = 1; 
			
			Z80._r._A = t2;
		},
		
		_xorA: function(value) { //Bitwise Xclusive OR; // Changes flags
			var temp = (Z80._r._A ^ value);
			
			Z80._r._fS = ((temp & 0x80) != 0);
			Z80._r._f3 = ((temp & 0x08) != 0);
			Z80._r._f5 = ((temp & 0x20) != 0);
			Z80._r._fZ = (temp == 0);
			Z80._r._fC = 0; 
			Z80._r._fP = Z80._r._parity[temp];
			Z80._r._fH = 0; 
			Z80._r._fN = 0; 
			
			Z80._r._A = temp;
		},
		
		
	},
	
		
	_clock: { tStates:0 },

	
	_op: [
		function() { 	//opcode 0 NOP
					Z80.tStates =  Z80.tStates + 4; 
		},
		function() { 	//opcode 1 LD BC, nn // nn = a 16 bit number
					var temp = memory[Z80._r._PC++];
					temp |= (memory[Z80._r._PC++] << 8); 
					Z80._r._BCset(temp);
					Z80.tStates =  Z80.tStates + 10; 
		},
		function() { 	//opcode 2 LD (BC), a
					memory[Z80._r._BCget()] = Z80._r._A;
					Z80.tStates =  Z80.tStates + 7;
		},
		function(){ 	//opcode 3 INC BC
					Z80._r._BCset((Z80._r._BCget() + 1) & 0xFFFF);
					Z80.tStates =  Z80.tStates + 6;
		},
		function(){ 	//0x04h INC B
					Z80._r._B = Z80._r._inc8(Z80._r._B);
					Z80.tStates =  Z80.tStates + 4;
		},
		function(){ 	//0x05 DEC B
					Z80._r._B = Z80._r._dec8(Z80._r._B);
					Z80.tStates =  Z80.tStates + 4;
		},	 
		function(){ 	//0x06 LD B,n	
					Z80._r._B = memory[Z80._r._PC++];
					Z80.tStates =  Z80.tStates + 7;
		},
		function(){		//0x07 RLC A // Rotate Register A Left with Carry
					var temp = Z80._r._A;
					var carry = (temp & 0x80) != 0;
					
					if (carry){
						temp = (temp << 1) | 0x01;
						} else {
						temp <<= 1;
							};
					
					temp &= 0xff;		
					// Changes flags 5,H,3,N
					Z80._r._f3 = ((temp & 0x08) != 0);
					Z80._r._f5 = ((temp & 0x20) != 0);
					Z80._r._fH = 0;
					Z80._r._fN = 0;
					Z80._r._fC = carry;
					
					Z80._r._A = temp;	
					Z80.tStates =  Z80.tStates + 4;							
		},
		function(){ 	//0x08 EX AF,AF' // Exchanges 
					var temp = Z80._r._AFget();
					Z80._r._AFset(Z80._r._AF_);
					Z80._r._AF_ = temp;
					Z80.tStates =  Z80.tStates + 4;
		},
		function(){ 	//0x09 ADD HL,BC
				Z80._r._HL = Z80._r._add16(Z80._r._HL, Z80._r._BCget());
				Z80.tStates =  Z80.tStates + 11;
		},
		function(){ 	//opcode 10 LD A,(BC)
			Z80._r._A = memory[Z80._r._BCget()];
			Z80.tStates =  Z80.tStates + 7;
		},
		function(){ 	//opcode 11 DEC BC
			Z80._r._BCset((Z80._r._BCget() - 1) & 0xFFFF); // Doesn't change any flag
			Z80.tStates =  Z80.tStates + 6;
		},
		function(){ 	//opcode 12 INC C
			Z80._r._C = Z80._r._inc8(Z80._r._C);
			Z80.tStates =  Z80.tStates + 4;
		},
		function(){ 	//opcode 13 DEC C
			Z80._r._C = Z80._r._dec8(Z80._r._C);
			Z80.tStates =  Z80.tStates + 4;
		},
		function(){ 	//opcode 14 LD C,n
			Z80._r._C = memory[Z80._r._PC++];
			Z80.tStates =  Z80.tStates + 7;
		},
		function(){ 	//opcode 15 RRCA // Rotate Acumulator Right with Carry
			var temp = Z80._r._A;
			var carry = (temp & 0x01) != 0;
			
			if (carry){
				temp = (temp >> 1) | 0x80;
				} else {
				temp >>= 1;
					};
					
			temp &= 0xff;
			// Changes flags 5,H,3,N
			Z80._r._f3 = ((temp & 0x08) != 0);
			Z80._r._f5 = ((temp & 0x20) != 0);
			Z80._r._fH = 0;
			Z80._r._fN = 0;
			Z80._r._fC = carry;
			
			Z80._r._A = temp;	
			Z80.tStates =  Z80.tStates + 4;		
		},
		function(){ 	//opcode 16 DJNZ d 	
				/* Decrement and Jump if Not Zero. Register B is the counter for loops 'd' must be a value between -128 and +127 */
			Z80._r._B = (Z80._r._B - 1) & 0xFF; 
			if (Z80._r._B != 0)
				{
					var value = Z80._r._signedByte(memory[Z80._r._PC++]);
					Z80._r._PC = ((Z80._r._PC + value) & 0xFFFF);
					Z80.tStates =  Z80.tStates + 13;					
				}
			else {
					Z80._r._PC = (Z80._r._PC + 1) & 0xFFFF
					Z80.tStates =  Z80.tStates + 8;	
			 }
		},
		function() { 	//opcode 17 LD DE, nn
			Z80._r._DE = memory[Z80._r._PC++];
			Z80._r._DE = (memory[Z80._r._PC++] << 8) | Z80._r._DE;
			Z80.tStates =  Z80.tStates + 10;
		},
		function() { 	//opcode 18 LD (DE),A 
			memory[Z80._r._DE] = Z80._r._A;
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 19 INC DE 
			Z80._r._DE = (Z80._r._DE + 1) & 0xFFFF;
			Z80.tStates =  Z80.tStates + 6;
		},	
		function(){ 	//opcode 20 INC D
			Z80._r._Dset(Z80._r._inc8(Z80._r._Dget()));
			Z80.tStates =  Z80.tStates + 4;
		},
		function(){ 	//opcode 21 DEC D
			Z80._r._Dset(Z80._r._dec8(Z80._r._Dget()));
			Z80.tStates =  Z80.tStates + 4;
		},
		function(){ 	//opcode 22 LD D,n
			Z80._r._Dset(memory[Z80._r._PC++]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function(){ 	//opcode 23 RLA // Rotate Left Acumulator (with Carry)
			var temp = Z80._r._A;
			var carry = (temp & 0x80) != 0;
			
			if (Z80._r._fC){
				temp = (temp << 1) | 0x01;
				} else {
				temp <<= 1;
					};
					
			temp &= 0xff;
			// Changes flags 5,H,3,N
			Z80._r._f3 = ((temp & 0x08) != 0);
			Z80._r._f5 = ((temp & 0x20) != 0);
			Z80._r._fH = 0; // False
			Z80._r._fN = 0; // False
			Z80._r._fC = carry;
			
			Z80._r._A = temp;	
			Z80.tStates =  Z80.tStates + 4;		
		},
		function(){ 	//opcode 24 JR dis
			var dis = Z80._r._signedByte(memory[Z80._r._PC++]);
			Z80._r._PC = ((Z80._r._PC + dis) & 0xFFFF);
			Z80.tStates =  Z80.tStates + 12;	
		},
		function(){ 	//opcode 25 ADD HL,DE 
			Z80._r._HL = Z80._r._add16(Z80._r._HL, Z80._r._DE);
			Z80.tStates =  Z80.tStates + 11;
		},
		function(){ 	//opcode 26 LD A, (DE)
			Z80._r._A = memory[Z80._r._DE];
			Z80.tStates =  Z80.tStates + 7;
		},
		function(){ 	//opcode 27 DEC DE
			Z80._r._DE = (Z80._r._DE - 1) & 0xFFFF;
			Z80.tStates =  Z80.tStates + 6;
		},
		function(){ 	//opcode 28 INC E
			Z80._r._Eset(Z80._r._inc8(Z80._r._Eget()));
			Z80.tStates =  Z80.tStates + 4;
		},
		function(){ 	//opcode 29 DEC E
			Z80._r._Eset(Z80._r._dec8(Z80._r._Eget()));
			Z80.tStates =  Z80.tStates + 4;			
		},
		function(){ 	//opcode 30 LD E,n 
			Z80._r._Eset(memory[Z80._r._PC++]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function(){ 	//opcode 31 RRA
			var temp = (Z80._r._A & 0x01) != 0;
			
			if (Z80._r._fC) {
				Z80._r._A = (Z80._r._A >> 1) | 0x80;
			} else {
				Z80._r._A >>= 1;
			};
						
			// Changes flags 5,H,3,N,C
			Z80._r._f5 = ((Z80._r._A & 0x20) != 0);
			Z80._r._fH = 0;
			Z80._r._f3 = ((Z80._r._A & 0x08) != 0);
			Z80._r._fN = 0;
			Z80._r._fC = temp;
			
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 32 JR NZ,dis 
			if(!Z80._r._fZ) {
				var dis = Z80._r._signedByte(memory[Z80._r._PC++]); // Values between -128 to 127
				Z80._r._PC = Z80._r._PC + dis;
				Z80.tStates =  Z80.tStates + 12;
			} else {
				Z80._r._PC = (Z80._r._PC + 1) & 0xFFFF
				Z80.tStates =  Z80.tStates + 7;
			};
		},
		function() { 	//opcode 33 LD HL,nn
			Z80._r._HL = memory[Z80._r._PC++];
			Z80._r._HL = (memory[Z80._r._PC++] << 8) | Z80._r._HL;
			Z80.tStates =  Z80.tStates + 10;
		},
		function() { 	//opcode 34 LD (nn),HL 
			var addr = memory[Z80._r._PC++];
			addr |= (memory[Z80._r._PC++] << 8);
			memory[addr] = (Z80._r._HL & 0xFF);
			addr = addr + 1;
			memory[addr] = (Z80._r._HL >> 8);	
			Z80.tStates =  Z80.tStates + 16;
		},
		function() { 	//opcode 35 INC HL
			Z80._r._HL = (Z80._r._HL + 1) & 0xFFFF;
			Z80.tStates =  Z80.tStates + 6;
		},
		function() { 	//opcode 36 INC H
			Z80._r._Hset(Z80._r._inc8(Z80._r._Hget()));
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 37 DEC H
			Z80._r._Hset(Z80._r._dec8(Z80._r._Hget()));
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 38 LD H,n 
			Z80._r._Hset(memory[Z80._r._PC++]);
			Z80.tStates =  Z80.tStates + 7;			
		},
		function() { 	//opcode 39 DAA // Decimal Adjust Accumulator // Changes all flags
			var carry = Z80._r._fC;
			var incr = 0;
			var temp = Z80._r._A;
			
			if( Z80._r._fH || ((Z80._r._A & 0x0F) > 0x09)){
				incr |= 0x06;
			};
			
			if( carry || (temp > 0x9F) || ((temp > 0x8F) && ((temp & 0x0F) > 0x09))){
				incr |= 0x60;
			};
			
			if( temp > 0x99) carry = 1;
			
			if (Z80._r._fN) {
				Z80._r._subA(incr);
			} else {
				Z80._r._addA(incr);				
			};
			
			temp = Z80._r._A;
			Z80._r._fC = carry;
			Z80._r._fP = Z80._r._parity[temp];
			Z80.tStates =  Z80.tStates + 4;			
		},
		function() { 	//opcode 40 JR Z,dis 
			if (Z80._r._fZ) {
				var dis = Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._PC = Z80._r._PC + dis;
				Z80.tStates = Z80.tStates + 12;
			} else {
				Z80._r._PC = (Z80._r._PC + 1) & 0xFFFF
				Z80.tStates =  Z80.tStates + 7;
			};
		},
		function() { 	//opcode 41 ADD HL,HL 
			var temp = Z80._r._HL;
			Z80._r._HL = Z80._r._add16(temp, temp);
			Z80.tStates =  Z80.tStates + 11;
		},
		function() { 	//opcode 42 LD HL,(nn)
			var addr = memory[Z80._r._PC++];
			addr |= ((memory[Z80._r._PC++] & 0xFFFF) << 8);
			var value = memory[addr++];
			value |= ((memory[addr] & 0xFFFF) << 8);
						
			Z80._r._HL = value;
			Z80.tStates =  Z80.tStates + 16;
		},
		function() { 	//opcode 43 DEC HL
			Z80._r._HL = (Z80._r._HL - 1) & 0xFFFF;
			Z80.tStates =  Z80.tStates + 6;
		},
		function() { 	//opcode 44 INC L
			Z80._r._Lset(Z80._r._inc8(Z80._r._Lget()));
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 45 DEC L
			Z80._r._Lset(Z80._r._dec8(Z80._r._Lget()));
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 46 LD L,n 
			Z80._r._Lset(memory[Z80._r._PC++]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 47 CPL // One's complement of Acummulator 
						// Changes flags N,3,H,5
			var temp = (Z80._r._A ^ 0xFF);
			Z80._r._fN = 1;
			Z80._r._f3 = (( temp & 0x08) != 0);
			Z80._r._fH = 1;
			Z80._r._f5 = (( temp & 0x20) != 0);
			Z80._r._A = temp;
			
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 48 JR NC,dis 
			if (!Z80._r._fC){
				var dis = Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._PC = Z80._r._PC + dis;
				Z80.tStates =  Z80.tStates + 12;				
			} else {
				Z80._r._PC = (Z80._r._PC + 1) & 0xFFFF
				Z80.tStates =  Z80.tStates + 7;				
			};
		},
		function() { 	//opcode 49 LD SP, nn
			var value = memory[Z80._r._PC++];
			value |= ((memory[Z80._r._PC++] & 0xFFFF) << 8);
			
			Z80._r._SP = value;
			Z80.tStates =  Z80.tStates + 10;			
		},
		function() { 	//opcode 50 LD (nn),A 
			var addr = memory[Z80._r._PC++];
			addr |= ((memory[Z80._r._PC++] & 0xFFFF) << 8);
			memory[addr] = Z80._r._A;
			Z80.tStates =  Z80.tStates + 13;
		},
		function() { 	//opcode 51 INC SP 
			Z80._r._SP = (Z80._r._SP + 1) & 0xFFFF
			Z80.tStates =  Z80.tStates + 6;
		},
		function() { 	//opcode 52 INC (HL) 
			memory[Z80._r._HL] = Z80._r._inc8(memory[Z80._r._HL]);
			Z80.tStates =  Z80.tStates + 11;
		},
		function() { 	//opcode 53 DEC (HL)
			memory[Z80._r._HL] = Z80._r._dec8(memory[Z80._r._HL]);
			Z80.tStates =  Z80.tStates + 11;
		},
		function() { 	//opcode 54 LD (HL),n 
			var value = memory[Z80._r._PC++];
			memory[Z80._r._HL] = value;
			Z80.tStates =  Z80.tStates + 10;
		},
		function() { 	//opcode 55 SCF Sets carry flag // Changes C,N,3,H,5 flags
			var temp = Z80._r._A;
			
			Z80._r._fC = 1;
			Z80._r._fN = 0;
			Z80._r._f3 = ((temp & 0x08) != 0);
			Z80._r._fH = 0;
			Z80._r._f5 = ((temp & 0x20) != 0);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 56 JR C, dis
			if(Z80._r._fC){
				var dis = Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._PC = Z80._r._PC + dis;
				Z80.tStates =  Z80.tStates + 12;
			} else {
				Z80._r._PC = (Z80._r._PC + 1) & 0xFFFF
				Z80.tStates =  Z80.tStates + 7;
			};
		},
		function() { 	//opcode 57 ADD HL,SP
			Z80._r._HL = Z80._r._add16(Z80._r._HL, Z80._r._SP);
			Z80.tStates =  Z80.tStates + 11;
		},
		function() { 	//opcode 58 LD A,(nn)
			var addr = memory[Z80._r._PC++];
			addr |= ((memory[Z80._r._PC++] & 0xFFFF) << 8);
			var value = memory[addr++];
						
			Z80._r._A = value;
			Z80.tStates =  Z80.tStates + 13;
		},
		function() { 	//opcode 59 DEC SP
			Z80._r._SP = Z80._r._SP - 1;
			Z80.tStates =  Z80.tStates + 6;
		},
		function() { 	//opcode 60 INC A
			Z80._r._A = Z80._r._inc8(Z80._r._A);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 61 DEC A
			Z80._r._A = Z80._r._dec8(Z80._r._A);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 62 LD A,n
			Z80._r._A = memory[Z80._r._PC];
			Z80._r._PC = (Z80._r._PC + 1) & 0xFFFF;
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 63 CCF // Complement carry flag //Changes C,N,3,5  flags 
			var temp = Z80._r._A;
			
			Z80._r._f3 = ((temp & 0x08) != 0);
			Z80._r._f5 = ((temp & 0x20) != 0);
			Z80._r._fN = 0; // False
			Z80._r._fC = Z80._r._fC ? 0: 1; 
			
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 64 LD B,B 
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 65 LD B,C
			Z80._r._B = Z80._r._C;
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 66 LD B,D 
			Z80._r._B = Z80._r._Dget();
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 67 LD B,E
			Z80._r._B = Z80._r._Eget();
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 68 LD B,H
			Z80._r._B = Z80._r._Hget();
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 69 LD B,L
			Z80._r._B = Z80._r._Lget();
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 70 LD B,(HL)
			Z80._r._B = memory[Z80._r._HL];
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 71 LD B,A 
			Z80._r._B = Z80._r._A;
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 72 LD C,B 
			Z80._r._C = Z80._r._B;
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 73 LD C,C 
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 74 LD C,D 
			Z80._r._C = Z80._r._Dget();
			Z80.tStates =  Z80.tStates + 4;
		}, 
		function() { 	//opcode 75 LD C,E
			Z80._r._C = Z80._r._Eget();
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 76 LD C,H 
			Z80._r._C = Z80._r._Hget();
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 77 LD C,L
			Z80._r._C = Z80._r._Lget();
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 78 LD C,(HL)
			Z80._r._C = memory[Z80._r._HL];
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 79 LD C,A 
			Z80._r._C = Z80._r._A;
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 80 LD D,B 
			Z80._r._D = Z80._r._B;
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	// opcode 81 LD D,C
			Z80._r._Dset(Z80._r._C);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 82 LD D,D 
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 83 LD D,E 
			Z80._r._Dset(Z80._r._Eget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 84 LD D,H 
			Z80._r._Dset(Z80._r._Hget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 85 LD D,L 
			Z80._r._Dset(Z80._r._Lget());
			Z80.tStates =  Z80.tStates + 4;
		},  
		function() { 	//opcode 86 LD D,(HL)
			Z80._r._Dset(memory[Z80._r._HL]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 87 LD D,A 
			Z80._r._Dset(Z80._r._A);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 88 LD E,B 
			Z80._r._Eset(Z80._r._B);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 89 LD E,C 
			Z80._r._Eset(Z80._r._C);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 90 LD E,D 
			Z80._r._Eset(Z80._r._Dget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 91 LD E,E 
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 92 LD E,H 
			Z80._r._Eset(Z80._r._Hget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 93 LD E,L 
			Z80._r._Eset(Z80._r._Lget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 94 LD E,(HL) 
			Z80._r._Eset(memory[Z80._r._HL]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 95 LD E,A 
			Z80._r._Eset(Z80._r._A);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 96 LD H,B 
			Z80._r._Hset(Z80._r._B);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 97 LD H,C 
			Z80._r._Hset(Z80._r._C);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 98 LD H,D 
			Z80._r._Hset(Z80._r._Dget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 99 LD H,E
			Z80._r._Hset(Z80._r._Eget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 100 LD H,H 
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 101 LD H,L 
			Z80._r._Hset(Z80._r._Lget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 102 LD H,(HL) 
			Z80._r._Hset(memory[Z80._r._HL]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 103 LD H,A 
			Z80._r._Hset(Z80._r._A);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 104 LD L,B
			Z80._r._Lset(Z80._r._B);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 105 LD L,C 
			Z80._r._Lset(Z80._r._C);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 106 LD L,D 
			Z80._r._Lset(Z80._r._Dget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 107 LD L,E 
			Z80._r._Lset(Z80._r._Eget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 108 LD L,H 
			Z80._r._Lset(Z80._r._Hget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 109 LD L,L 
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 110 LD L,(HL)
			Z80._r._Lset(memory[Z80._r._HL]);
			Z80.tStates =  Z80.tStates + 7;
		}, 
		function() { 	//opcode 111 LD L,A
			Z80._r._Lset(Z80._r._A);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 112 LD (HL),B
			memory[Z80._r._HL] = Z80._r._B;
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 113 LD (HL),C 
			memory[Z80._r._HL] = Z80._r._C;
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 114 LD (HL),D 
			memory[Z80._r._HL] = Z80._r._Dget();
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 115 LD (HL),E 
			memory[Z80._r._HL] = Z80._r._Eget();
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 116 LD (HL),H 
			memory[Z80._r._HL] = Z80._r._Hget();
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 117 LD (HL),L 
			memory[Z80._r._HL] = Z80._r._Lget();
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 118 HALT 
	/* The HALT instruction halts the Z80; it does not increase the PC so that the instruction is reexecuted, until a maskable or non-maskable interrupt is accepted. Only then does the Z80 increase the PC again and continues with the next instruction.  */
			var n = ((-Z80.tStates - 1) / 4) + 1;
			Z80._r._halted = true;
			Z80.tStates = Z80.tStates + (n*4);
			Z80._r._R = Z80._r._R + (n-1); 	
			// ToDo		
		},
		function() { 	//opcode 119 LD (HL),A 
			memory[Z80._r._HL] = Z80._r._A;
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 120 LD A,B 
			Z80._r._A = Z80._r._B;
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 121 LD A,C 
			Z80._r._A = Z80._r._C;
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 122 LD A,D 
			Z80._r._A = Z80._r._Dget();
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 123 LD A,E 
			Z80._r._A = Z80._r._Eget();
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 124 LD A,H
			Z80._r._A = Z80._r._Hget();
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 125 LD A,L
			Z80._r._A = Z80._r._Lget();
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 126 LD A,(HL)
			Z80._r._A = memory[Z80._r._HL];
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 127 LD A,A
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 128 ADD A,B 
			Z80._r._addA(Z80._r._B);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 129 ADD A,C
			Z80._r._addA(Z80._r._C);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 130 ADD A,D 
			Z80._r._addA(Z80._r._Dget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 131 ADD A,E 
			Z80._r._addA(Z80._r._Eget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 132 ADD A,H 
			Z80._r._addA(Z80._r._Hget());
			Z80.tStates =  Z80.tStates + 4;
		}, 
		function() { 	//opcode 133 ADD A,L 
			Z80._r._addA(Z80._r._Lget());
			Z80.tStates =  Z80.tStates + 4;
		}, 
		function() { 	//opcode 134 ADD A,(HL) 
			Z80._r._addA(memory[Z80._r._HL]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 135 ADD A,A 
			Z80._r._addA(Z80._r._A);
			Z80.tStates =  Z80.tStates + 4;
		}, 
		function() { 	//opcode 136 ADC A,B 
			Z80._r._adcA(Z80._r._B);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 137 ADC A,C
			Z80._r._adcA(Z80._r._C);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 138 ADC A,D 
			Z80._r._adcA(Z80._r._Dget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 139 ADC A,E
			Z80._r._adcA(Z80._r._Eget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 140 ADC A,H 
			Z80._r._adcA(Z80._r._Hget());
			Z80.tStates =  Z80.tStates + 4;
		},	
		function() { 	//opcode 141 ADC A,L 
			Z80._r._adcA(Z80._r._Lget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 142 ADC A,(HL)
			Z80._r._adcA(memory[Z80._r._HL]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 143 ADC A,A
			Z80._r._adcA(Z80._r._A);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 144 SUB B 
			Z80._r._subA(Z80._r._B);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 145 SUB C 
			Z80._r._subA(Z80._r._C);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 146 SUB D 
			Z80._r._subA(Z80._r._Dget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 147 SUB E
			Z80._r._subA(Z80._r._Eget());
			Z80.tStates =  Z80.tStates + 4;
		}, 
		function() { 	//opcode 148 SUB H 
			Z80._r._subA(Z80._r._Hget());
			Z80.tStates =  Z80.tStates + 4;
		}, 
		function() { 	//opcode 149 SUB L
			Z80._r._subA(Z80._r._Lget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 150 SUB (HL) 
			Z80._r._subA(memory[Z80._r._HL]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 151 SUB A
			Z80._r._subA(Z80._r._A);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 152 SBC A,B
			Z80._r._sbcA(Z80._r._B);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 153 SBC A,C 
			Z80._r._sbcA(Z80._r._C);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 154 SBC A,D 
			Z80._r._sbcA(Z80._r._Dget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 155 SBC A,E 
			Z80._r._sbcA(Z80._r._Eget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 156 SBC A,H
			Z80._r._sbcA(Z80._r._Hget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 157 SBC A,L 
			Z80._r._sbcA(Z80._r._Lget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 158 SBC A,(HL) 
			Z80._r._sbcA(memory[Z80._r._HL]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 159 SBC A,A 
			Z80._r._sbcA(Z80._r._A);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 160 AND B 
			Z80._r._andA(Z80._r._B);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 161 AND C 
			Z80._r._andA(Z80._r._C);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 162 AND D 
			Z80._r._andA(Z80._r._Dget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 163 AND E 
			Z80._r._andA(Z80._r._Eget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 164 AND H 
			Z80._r._andA(Z80._r._Hget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 165 AND L 
			Z80._r._andA(Z80._r._Lget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 166 AND (HL) 
			Z80._r._andA(memory[Z80._r._HL]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 167 AND _A 
			Z80._r._andA(Z80._r._A);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 168 XOR B 
			Z80._r._xorA(Z80._r._B);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 169 XOR C 
			Z80._r._xorA(Z80._r._C);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 170 XOR D 
			Z80._r._xorA(Z80._r._Dget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 171 XOR E
			Z80._r._xorA(Z80._r._Eget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 172 XOR H 
			Z80._r._xorA(Z80._r._Hget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 173 XOR L 
			Z80._r._xorA(Z80._r._Lget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 174 XOR (HL)
			Z80._r._xorA(memory[Z80._r._HL]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 175 XOR _A 
			Z80._r._xorA(Z80._r._A);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 176 OR B 
			Z80._r._orA(Z80._r._B);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 177 OR C 
			Z80._r._orA(Z80._r._C);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 178 OR D 
			Z80._r._orA(Z80._r._Dget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 179 OR E 
			Z80._r._orA(Z80._r._Eget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 180 OR H 
			Z80._r._orA(Z80._r._Hget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 181 OR L 
			Z80._r._orA(Z80._r._Lget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 182 OR (HL) 
			Z80._r._orA(memory[Z80._r._HL]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 183 OR A 
			Z80._r._orA(Z80._r._A);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 184 CP B
			Z80._r._cpA(Z80._r._B);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 185 CP C 
			Z80._r._cpA(Z80._r._C);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 186 CP D 
			Z80._r._cpA(Z80._r._Dget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 187 CP E 
			Z80._r._cpA(Z80._r._Eget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 188 CP H 
			Z80._r._cpA(Z80._r._Hget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 189 CP L 
			Z80._r._cpA(Z80._r._Lget());
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 190 CP (HL) 
			Z80._r._cpA(memory[Z80._r._HL]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 191 CP A
			Z80._r._cpA(Z80._r._A);
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 192 RET NZ 
	/* Pops the top of the stack into the program counter. Note that RET can be either conditional or unconditional. */
			if (!Z80._r._fZ){
				Z80._r._PC = Z80._r._pop();
				Z80.tStates =  Z80.tStates + 11;
			} else {
				Z80.tStates =  Z80.tStates + 5;
			};
		},
		function() { 	//opcode 193 POP BC
			Z80._r._BCset(Z80._r._pop());
			Z80.tStates =  Z80.tStates + 10;
		},
		function() { 	//opcode 194 JP NZ,nn 
			if (!Z80._r._fZ) {
				var addr = memory[Z80._r._PC++];
				addr |= ((memory[Z80._r._PC++]) << 8);
				Z80._r._PC = addr;
				} else {
				Z80._r._PC = Z80._r._PC + 2;
					};
			Z80.tStates =  Z80.tStates + 10;
		},
		function() { 	//opcode 195 JP nn
			var addr = memory[Z80._r._PC++];
			addr |= ((memory[Z80._r._PC++]) << 8);
			Z80._r._PC = addr;
			Z80.tStates =  Z80.tStates + 10;
		},
		function() { 	//opcode 196 CALL NZ,nn 
			if (!Z80._r._fZ){
				
				var temp = memory[Z80._r._PC++];
				temp |= ((memory[Z80._r._PC++]) << 8);
				Z80._r._push(Z80._r._PC);
				Z80._r._PC = temp;
				Z80.tStates =  Z80.tStates + 17;					
			} else {
				Z80._r._PC = (Z80._r._PC + 2) & 0xFFFF;
				Z80.tStates =  Z80.tStates + 10;				
			};
		},
		function() { 	//opcode 197 PUSH BC 
			Z80._r._push(Z80._r._BCget());
			Z80.tStates =  Z80.tStates + 11;
		},
		function() { 	//opcode 198 ADD A,n
			Z80._r._addA(memory[Z80._r._PC++]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 199 RST 0 
			Z80._r._push(Z80._r._PC);
			Z80._r._PC = 0;
			Z80.tStates =  Z80.tStates + 11;
		},
		function() { 	//opcode 200 RET Z 
			if (Z80._r._fZ){
				Z80._r._PC = Z80._r._pop();
				Z80.tStates =  Z80.tStates + 11;
			} else {
				Z80.tStates =  Z80.tStates + 5;
			};
		},
		function() { 	//opcode 201 RET 
			Z80._r._PC = Z80._r._pop();
			Z80.tStates =  Z80.tStates + 10;
		},
		function() { 	//opcode 202 JP Z,nn 
			if(Z80._r._fZ){
				var addr = memory[Z80._r._PC++];
				addr |= ((memory[Z80._r._PC++]) << 8);
				Z80._r._PC = addr;
			} else {
				Z80._r._PC = Z80._r._PC + 2;
			};
			Z80.tStates =  Z80.tStates + 10;
		},
		function() { 	//opcode 203 CB // PREFIX
			Z80.execute_cb();
		},
		function() { 	//opcode 204 CALL Z,nn 
			if (Z80._r._fZ){
				
				var temp = memory[Z80._r._PC++];
				temp |= ((memory[Z80._r._PC++]) << 8);
				Z80._r._push(Z80._r._PC);
				Z80._r._PC = temp;
				Z80.tStates =  Z80.tStates + 17;					
			} else {
				Z80._r._PC = (Z80._r._PC + 2) & 0xFFFF;
				Z80.tStates =  Z80.tStates + 10;				
			};
		},
		function() { 	//opcode 205 CALL nn
			var temp = memory[Z80._r._PC++];
			temp |= ((memory[Z80._r._PC++]) << 8);
			Z80._r._push(Z80._r._PC);
			Z80._r._PC = temp;
			Z80.tStates =  Z80.tStates + 17;
		},
		function() { 	//opcode 206 ADC A,n
			Z80._r._adcA(memory[Z80._r._PC++]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 207 RST 8 
			Z80._r._push(Z80._r._PC);
			Z80._r._PC = 8;
			Z80.tStates =  Z80.tStates + 11;
		},
		function() { 	//opcode 208 RET NC 
			if(!Z80._r._fC){
				Z80._r._PC = Z80._r._pop();
				Z80.tStates =  Z80.tStates + 11;
			} else {
				Z80.tStates =  Z80.tStates + 5;
				};	
		},
		function() { 	//opcode 209 POP DE 
			Z80._r._DE = Z80._r._pop();
			Z80.tStates =  Z80.tStates + 10;
		},
		function() { 	//opcode 210 JP NC,nn 
			if (!Z80._r._fC){
				var temp = memory[Z80._r._PC++];
				temp |= ((memory[Z80._r._PC++]) << 8);
				Z80._r._PC = temp;
			} else { Z80._r._PC = Z80._r._PC + 2 };
			Z80.tStates =  Z80.tStates + 10;
		},
		function() { 	//opcode 211 OUT (n),A 
	/* Coloca el valor del operando «n» en la mitad inferior del bus de direcciones para seleccionar un dispositivo de entrada/salida entre los 256 ports posibles. El contenido del registro acumulador se coloca en la mitad superior del bus de direcciones. */
			Z80._r._out(memory[Z80._r._PC++], Z80._r._A, Z80.tStates);
			Z80.tStates =  Z80.tStates + 11;
		},
		function() { 	//opcode 212 CALL NC,nn
			if(!Z80._r._fC){
				var temp = memory[Z80._r._PC++];
				temp |= ((memory[Z80._r._PC++]) << 8);
				Z80._r._push(Z80._r._PC);
				Z80._r._PC = temp;
				Z80.tStates =  Z80.tStates + 17;
			} else {
				Z80._r._PC = Z80._r._PC + 2;
				Z80.tStates =  Z80.tStates + 10;
			}
		},
		function() { 	//opcode 213 PUSH DE
			Z80._r._push(Z80._r._DE);
			Z80.tStates =  Z80.tStates + 11;			
		},
		function() { 	//opcode 214 SUB n
			Z80._r._subA(memory[Z80._r._PC++]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 215 RST 16 
			Z80._r._push(Z80._r._PC);
			Z80._r._PC = 16;
			Z80.tStates =  Z80.tStates + 11;
		},
		function() { 	//opcode 216 RET C 
			if(Z80._r._fC){
				Z80._r._PC = Z80._r._pop();
				Z80.tStates =  Z80.tStates + 11;
			} else {
				Z80.tStates =  Z80.tStates + 5;
			};
		},
		function() { 	//opcode 217 EXX 
			var temp = Z80._r._BCget();
			Z80._r._BCset(Z80._r._BC_);
			Z80._r._BC_ = temp;
			
			temp = Z80._r._DE;
			Z80._r._DE = Z80._r._DE_;
			Z80._r._DE_ = temp;
			
			temp = Z80._r._HL;
			Z80._r._HL = Z80._r._HL_;
			Z80._r._HL_ = temp;
			
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 218 JP C,nn 
			if (Z80._r._fC) {
				var temp = memory[Z80._r._PC++];
				temp |= ((memory[Z80._r._PC++]) << 8);
				Z80._r._PC = temp;
			} else {
				Z80._r._PC = Z80._r._PC + 2;
			};
			Z80.tStates =  Z80.tStates + 10;
		},
		function() { 	//opcode 219 IN A,(n) 
	/* Coloca el valor del operando «n» en la mitad inferior del bus de direcciones para seleccionar un dispositivo de entrada/salida entre los 256 ports posibles. El contenido del registro acumulador se coloca en la mitad superior del bus de direcciones. El octeto procedente del port seleccionado aparece en el bus de datos y se escribe en el registro acumulador «A». En esta instrucción, se direcciona en modo «directo» la mitad inferior del bus, y en modo indirecto la mitad superior. */
			Z80._r._A = Z80._r._in((Z80._r._A << 8) | memory[Z80._r._PC++])
			Z80.tStates =  Z80.tStates + 11;
		},
		function() { 	//opcode 220 CALL C,nn 
			if (Z80._r._fC){
				var temp = memory[Z80._r._PC++];
				temp |= ((memory[Z80._r._PC++]) << 8);
				Z80._r._push(Z80._r._PC);
				Z80._r._PC = temp;
				Z80.tStates =  Z80.tStates + 17;					
			} else {
				Z80._r._PC = Z80._r._PC + 2;
				Z80.tStates =  Z80.tStates + 10;				
			};
		},
		function() { 	//opcode 221 IX  // PREFIX
			Z80._r._IT = Z80._r._IX;
			Z80.execute_index();
			Z80._r._IX = Z80._r._IT;
		},
		function() { 	//opcode 222 SBC A,N 
			Z80._r._sbcA(memory[Z80._r._PC++]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 223 RST 24  
			Z80._r._push(Z80._r._PC);
			Z80._r._PC = 24;
			Z80.tStates =  Z80.tStates + 11;
		},
		function() { 	//opcode 224 RET PO 
			if(!Z80._r._fP){
				Z80._r._PC = Z80._r._pop();
				Z80.tStates =  Z80.tStates + 11;
			} else { 
				Z80.tStates =  Z80.tStates + 5;
				};
		},
		function() { 	//opcode 225 POP HL
			Z80._r._HL = Z80._r._pop();
			Z80.tStates =  Z80.tStates + 10;
		}, 
		function() { 	//opcode 226 JP PO,nn
			if(!Z80._r._fP){
				var temp = memory[Z80._r._PC++];
				temp |= ((memory[Z80._r._PC++]) << 8);
				Z80._r._PC = temp;
			}
			else {
				Z80._r._PC = Z80._r._PC + 2;		
			};
			Z80.tStates = Z80.tStates + 10;
		},
		function() { 	//opcode 227 EX (SP),HL 
			var t1 = Z80._r._SP;
			var t2 = memory[t1++];
			t2 |= ((memory[t1]) << 8);
			t1 = Z80._r._SP;
			memory[t1++] = Z80._r._Lget();
			memory[t1] = Z80._r._Hget();
			Z80._r._HL = t2;
			Z80.tStates =  Z80.tStates + 19;
		},
		function() { 	//opcode 228 CALL PO,nn
			if (!Z80._r._fP){
				var temp = memory[Z80._r._PC++];
				temp |= ((memory[Z80._r._PC++]) << 8);
				Z80._r._push(Z80._r._PC);
				Z80._r._PC = temp;
				Z80.tStates =  Z80.tStates + 17;					
			} else {
				Z80._r._PC = (Z80._r._PC + 2) & 0xFFFF;
				Z80.tStates =  Z80.tStates + 10;				
			};
		}, 
		function() { 	//opcode 229 PUSH HL
			Z80._r._push(Z80._r._HL);
			Z80.tStates =  Z80.tStates + 11;
		},
		function() { 	//opcode 230 AND n 
			Z80._r._andA(memory[Z80._r._PC++]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 231 RST 32
			Z80._r._push(Z80._r._PC);
			Z80._r._PC = 32;
			Z80.tStates =  Z80.tStates + 11;
		},
		function() { 	//opcode 232 RET PE
			if(Z80._r._fP){
				Z80._r._PC = Z80._r._pop();
				Z80.tStates =  Z80.tStates + 11;
			} else { 
				Z80.tStates =  Z80.tStates + 5;
				};
		},
		function() { 	//opcode 233 JP (HL) 
			Z80._r._PC = Z80._r._HL;
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 234 JP PE,nn 
			if(Z80._r._fP){
				var temp = memory[Z80._r._PC++];
				temp |= ((memory[Z80._r._PC++]) << 8);
				Z80._r._PC = temp;
			}
			else {
				Z80._r._PC = Z80._r._PC + 2;		
			};
			Z80.tStates =  Z80.tStates + 10;
		},
		function() { 	//opcode 235 EX DE,HL
			var temp = Z80._r._Dget();
			Z80._r._Dset(Z80._r._Hget());
			Z80._r._Hset(temp);
			temp = Z80._r._Eget();
			Z80._r._Eset(Z80._r._Lget());
			Z80._r._Lset(temp);
			Z80.tStates =  Z80.tStates + 4;			
		},
		function() { 	//opcode 236 CALL PE,nn 
			if (Z80._r._fP){
				var temp = memory[Z80._r._PC++];
				temp |= ((memory[Z80._r._PC++]) << 8);
				Z80._r._push(Z80._r._PC);
				Z80._r._PC = temp;
				Z80.tStates =  Z80.tStates + 17;					
			} else {
				Z80._r._PC = Z80._r._PC + 2;
				Z80.tStates =  Z80.tStates + 10;				
			};
		},
		function() { 	//opcode 237 ED // PREFIX
			Z80.execute_ed();
		},
		function() { 	//opcode 238 XOR N 
			Z80._r._xorA(memory[Z80._r._PC++]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 239 RST 40 
			Z80._r._push(Z80._r._PC);
			Z80._r._PC = 40;
			Z80.tStates =  Z80.tStates + 11;
		},
		function() { 	//opcode 240 RET p
			if(!Z80._r._fS){
				Z80._r._PC = Z80._r._pop();
				Z80.tStates =  Z80.tStates + 11;
			} else { 
				Z80.tStates =  Z80.tStates + 5;
				};		
		},
		function() { 	//opcode 241 POP AF 
			Z80._r._AFset(Z80._r._pop());
			Z80.tStates =  Z80.tStates + 10;			
		},
		function() { 	//opcode 242 JP P,nn
			if(!Z80._r._fS){
				var temp = memory[Z80._r._PC++];
				temp |= ((memory[Z80._r._PC++]) << 8);
				Z80._r._PC = temp;
			}
			else {
				Z80._r._PC = Z80._r._PC + 2;		
			};
			Z80.tStates =  Z80.tStates + 10;
		},
		function() { 	//opcode 243 DI 
			Z80._r._IFF1 = 0;
			Z80._r._IFF2 = 0;
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 244 CALL P,nn 
			if (!Z80._r._fS){
				var temp = memory[Z80._r._PC++];
				temp |= ((memory[Z80._r._PC++]) << 8);
				Z80._r._push(Z80._r._PC);
				Z80._r._PC = temp;
				Z80.tStates =  Z80.tStates + 17;					
			} else {
				Z80._r._PC = (Z80._r._PC + 2) & 0xFFFF;
				Z80.tStates =  Z80.tStates + 10;				
			};
		},
		function() { 	//opcode 245 PUSH AF 
			Z80._r._push(Z80._r._AFget());
			Z80.tStates =  Z80.tStates + 11;
		},
		function() { 	//opcode 246 OR n
			Z80._r._orA(memory[Z80._r._PC++]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 247 RST 48
			Z80._r._push(Z80._r._PC);
			Z80._r._PC = 48;
			Z80.tStates =  Z80.tStates + 11;
		},
		function() { 	//opcode 248 RET m
			if(Z80._r._fS){
				Z80._r._PC = Z80._r._pop();
				Z80.tStates =  Z80.tStates + 11;
			} else { 
				Z80.tStates =  Z80.tStates + 5;
				};		
		},
		function() { 	//opcode 249 LD SP,HL 
			Z80._r._SP = Z80._r._HL;
			Z80.tStates =  Z80.tStates + 6;
		},
		function() { 	//opcode 250 JP M,nn 
			if(Z80._r._fS){
				var temp = memory[Z80._r._PC++];
				temp |= ((memory[Z80._r._PC++]) << 8);
				Z80._r._PC = temp;
			}
			else {
				Z80._r._PC = Z80._r._PC + 2;		
			};
			Z80.tStates =  Z80.tStates + 10;
		},
		function() { 	//opcode 251 EI 
			Z80._r._IFF1 = 1; 
			Z80._r._IFF2 = 1;
			Z80.tStates =  Z80.tStates + 4;
		},
		function() { 	//opcode 252 CALL M,nn 
			if (Z80._r._fS){
				var temp = memory[Z80._r._PC++];
				temp |= ((memory[Z80._r._PC++]) << 8);
				Z80._r._push(Z80._r._PC);
				Z80._r._PC = temp;
				Z80.tStates =  Z80.tStates + 17;					
			} else {
				Z80._r._PC = (Z80._r._PC + 2) & 0xFFFF;
				Z80.tStates =  Z80.tStates + 10;				
			};
		},
		function() { 	//opcode 253 IY // PREFIX
			Z80._r._IT = Z80._r._IY;
			Z80.execute_index();
			Z80._r._IY = Z80._r._IT;
		},
		function() { 	//opcode 254 CP n
			Z80._r._cpA(memory[Z80._r._PC++]);
			Z80.tStates =  Z80.tStates + 7;
		},
		function() { 	//opcode 255 RST 56 
			Z80._r._push(Z80._r._PC);
			Z80._r._PC = 56;
			Z80.tStates =  Z80.tStates + 11;
		}
		],
	
	// PREFIX CB
		
	_cb_op: [
			function() { 		//cb + opcode 0 RLC B
				Z80._r._B = Z80._r._rlc(Z80._r._B);
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 1 RLC C
				Z80._r._C = Z80._r._rlc(Z80._r._C);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 2 RLC D
				Z80._r._Dset(Z80._r._rlc(Z80._r._Dget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 3 RLC E 
				Z80._r._Eset(Z80._r._rlc(Z80._r._Eget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 4 RLC H 
				Z80._r._Hset(Z80._r._rlc(Z80._r._Hget()));
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { 			//cb + opcode 5 RLC L 
			Z80._r._Lset(Z80._r._rlc(Z80._r._Lget()));
			Z80.tStates =  Z80.tStates + 8;
		},
			function() { 		//cb + opcode 6 RLC (HL)
				memory[Z80._r._HL] = Z80._r._rlc(memory[Z80._r._HL]);
				Z80.tStates =  Z80.tStates + 15;
			},
		function() { 			//cb + opcode 7 RLC A 
			Z80._r._A = Z80._r._rlc(Z80._r._A);
			Z80.tStates =  Z80.tStates + 8;
		},
			function() { 		//cb + opcode 8 RRC B 
				Z80._r._B = Z80._r._rrc(Z80._r._B);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 9 RRC C 
				Z80._r._C = Z80._r._rrc(Z80._r._C);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 10 RRC D 
				Z80._r._Dset(Z80._r._rrc(Z80._r._Dget()));
				Z80.tStates =  Z80.tStates + 8;
			},	
			function() { 		//cb + opcode 11 RRC E 
				Z80._r._Eset(Z80._r._rrc(Z80._r._Eget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 12 RRC H 
				Z80._r._Hset(Z80._r._rrc(Z80._r._Hget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 13 RRC L 
				Z80._r._Lset(Z80._r._rrc(Z80._r._Lget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 14 RRC (HL)
				memory[Z80._r._HL] = Z80._r._rrc(memory[Z80._r._HL]);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 15 RRC A	
				Z80._r._A = Z80._r._rrc(Z80._r._A);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 16 RL B 
				Z80._r._B = Z80._r._rl(Z80._r._B);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 17 RL C 
				Z80._r._C = Z80._r._rl(Z80._r._C);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 18 RL D 
				Z80._r._Dset(Z80._r._rl(Z80._r._Dget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 19 RL E 
				Z80._r._Eset(Z80._r._rl(Z80._r._Eget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 20 RL H 
				Z80._r._Hset(Z80._r._rl(Z80._r._Hget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 21 RL L 
				Z80._r._Lset(Z80._r._rl(Z80._r._Lget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 22 RL (HL) 
				memory[Z80._r._HL] = Z80._r._rl(memory[Z80._r._HL]);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 23 RL A
				Z80._r._A = Z80._r._rl(Z80._r._A);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 24 RR B
				Z80._r._B = Z80._r._rr(Z80._r._B);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 25 RR C 
				Z80._r._C = Z80._r._rr(Z80._r._C);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 26 RR D 
				Z80._r._Dset(Z80._r._rr(Z80._r._Dget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 27 RR E 
				Z80._r._Eset(Z80._r._rr(Z80._r._Eget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 28 RR H 
				Z80._r._Hset(Z80._r._rr(Z80._r._Hget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 29 RR L
				Z80._r._Lset(Z80._r._rr(Z80._r._Lget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 30 RR (HL)
				memory[Z80._r._HL] = Z80._r._rr(memory[Z80._r._HL]);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 31  RR A 
				Z80._r._A = Z80._r._rr(Z80._r._A);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 32 SLA B
				Z80._r._B = Z80._r._sla(Z80._r._B);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 33 SLA C
				Z80._r._C = Z80._r._sla(Z80._r._C);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 34 SLA D
				Z80._r._Dset(Z80._r._sla(Z80._r._Dget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 35 SLA E
				Z80._r._Eset(Z80._r._sla(Z80._r._Eget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 36 SLA H
				Z80._r._Hset(Z80._r._sla(Z80._r._Hget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 37 SLA L
				Z80._r._Lset(Z80._r._sla(Z80._r._Lget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 38 SLA (HL) 
				memory[Z80._r._HL] = Z80._r._sla(memory[Z80._r._HL]);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 39 SLA A 
				Z80._r._A = Z80._r._sla(Z80._r._A);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 40 SRA B 
				Z80._r._B = Z80._r._sra(Z80._r._B);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 41 SRA C
				Z80._r._C = Z80._r._sra(Z80._r._C);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 42 SRA D 
				Z80._r._Dset(Z80._r._sra(Z80._r._Dget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 43 SRA E 
				Z80._r._Eset(Z80._r._sra(Z80._r._Eget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 44 SRA H
				Z80._r._Hset(Z80._r._sra(Z80._r._Hget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 45 SRA L
				Z80._r._Lset(Z80._r._sra(Z80._r._Lget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 46 SRA (HL)
				memory[Z80._r._HL] = Z80._r._sra(memory[Z80._r._HL]);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 47 SRA A 
				Z80._r._A = Z80._r._sra(Z80._r._A);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 48 SLS B 
				Z80._r._B = Z80._r._sls(Z80._r._B);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 49 SLS C 
				Z80._r._C = Z80._r._sls(Z80._r._C);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 50 SLS D
				Z80._r._Dset(Z80._r._sls(Z80._r._Dget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 51 SLS E 
				Z80._r._Eset(Z80._r._sls(Z80._r._Eget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 52 SLS H 
				Z80._r._Hset(Z80._r._sls(Z80._r._Hget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 53 SLS L
				Z80._r._Lset(Z80._r._sls(Z80._r._Lget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 54 SLS (HL)
				memory[Z80._r._HL] = Z80._r._sls(memory[Z80._r._HL]);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 55 SLS A 
				Z80._r._A = Z80._r._sls(Z80._r._A);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 56 SRL B 
				Z80._r._B = Z80._r._srl(Z80._r._B);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 57 SRL C
				Z80._r._C = Z80._r._srl(Z80._r._C);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 58 SRL D 
				Z80._r._Dset(Z80._r._srl(Z80._r._Dget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 59 SRL E 
				Z80._r._Eset(Z80._r._srl(Z80._r._Eget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 60 SRL H
				Z80._r._Hset(Z80._r._srl(Z80._r._Hget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 61 SRL L 
				Z80._r._Lset(Z80._r._srl(Z80._r._Lget()));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 62 SRL (HL) 
				memory[Z80._r._HL] = Z80._r._srl(memory[Z80._r._HL]);
				Z80.tStates =  Z80.tStates + 15;
			}, 
			function() { 		//cb + opcode 63 SRL A
				Z80._r._A = Z80._r._srl(Z80._r._A);
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 64 BIT 0,B
				Z80._r._bit(0x01, Z80._r._B);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 65 BIT 0,C 
				Z80._r._bit(0x01, Z80._r._C);
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 66 BIT 0,D
				Z80._r._bit(0x01, Z80._r._Dget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 67 BIT 0,E 
				Z80._r._bit(0x01, Z80._r._Eget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 68 BIT 0,H 
				Z80._r._bit(0x01, Z80._r._Hget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 69 BIT 0,L 
				Z80._r._bit(0x01, Z80._r._Lget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() {  		//cb + opcode 70 BIT 0,(HL) 
				Z80._r._bit(0x01, memory[Z80._r._HL]);
				Z80.tStates =  Z80.tStates + 12;
			},
			function() {  		//cb + opcode 71 BIT 0,A 
				Z80._r._bit(0x01, Z80._r._A);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 72 BIT 1,B 
				Z80._r._bit(0x02, Z80._r._B);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 73 BIT 1,C 
				Z80._r._bit(0x02, Z80._r._C);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 74 BIT 1,D 
				Z80._r._bit(0x02, Z80._r._Dget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 75 BIT 1,E 
				Z80._r._bit(0x02, Z80._r._Eget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 76 BIT 1,H 
				Z80._r._bit(0x02, Z80._r._Hget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 77 BIT 1,L 
				Z80._r._bit(0x02, Z80._r._Lget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 78 BIT 1,(HL) 
				Z80._r._bit(0x02, memory[Z80._r._HL]);
				Z80.tStates =  Z80.tStates + 12;
			},
			function() { 		//cb + opcode 79 BIT 1,A 
				Z80._r._bit(0x02, Z80._r._A);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 80 BIT 2,B 
				Z80._r._bit(0x04, Z80._r._B);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 81 BIT 2,C
				Z80._r._bit(0x04, Z80._r._C);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 82 BIT 2,D 
				Z80._r._bit(0x04, Z80._r._Dget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 83 BIT 2,E 
				Z80._r._bit(0x04, Z80._r._Eget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 84 BIT 2,H 
				Z80._r._bit(0x04, Z80._r._Hget());
				Z80.tStates =  Z80.tStates + 8;
			},	
			function() { 		//cb + opcode 85 BIT 2,L 
				Z80._r._bit(0x04, Z80._r._Lget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 86 BIT 2,(HL)
				Z80._r._bit(0x04, memory[Z80._r._HL]);
				Z80.tStates =  Z80.tStates + 12;
			},
			function() { 		//cb + opcode 87 BIT 2,A 
				Z80._r._bit(0x04, Z80._r._A);
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 88 BIT 3,B
				Z80._r._bit(0x08, Z80._r._B);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 89 BIT 3,C 
				Z80._r._bit(0x08, Z80._r._C);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 90 BIT 3,D 
				Z80._r._bit(0x08, Z80._r._Dget());
				Z80.tStates =  Z80.tStates + 8;
			},	
			function() { 		//cb + opcode 91 BIT 3,E 
				Z80._r._bit(0x08, Z80._r._Eget());
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 92 BIT 3,H
				Z80._r._bit(0x08, Z80._r._Hget());
				Z80.tStates =  Z80.tStates + 8;
			},  
			function() { 		//cb + opcode 93 BIT 3,L
				Z80._r._bit(0x08, Z80._r._Lget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 94 BIT 3,(HL)
				Z80._r._bit(0x08, memory[Z80._r._HL]);
				Z80.tStates =  Z80.tStates + 12;
			},
			function() { 		//cb + opcode 95 BIT 3,A
				Z80._r._bit(0x08, Z80._r._A);
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 96 BIT 4,B
				Z80._r._bit(0x10, Z80._r._B);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 97 BIT 4,C
				Z80._r._bit(0x10, Z80._r._C);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 98 BIT 4,D 
				Z80._r._bit(0x10, Z80._r._Dget());
				Z80.tStates =  Z80.tStates + 8;
			},	
			function() { 		//cb + opcode 99 BIT 4,E 
				Z80._r._bit(0x10, Z80._r._Eget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 100 BIT 4,H
				Z80._r._bit(0x10, Z80._r._Hget());
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 101 BIT 4,L
				Z80._r._bit(0x10, Z80._r._Lget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 102 BIT 4,(HL) 
				Z80._r._bit(0x10, memory[Z80._r._HL]);
				Z80.tStates =  Z80.tStates + 12;
			}, 
			function() { 		//cb + opcode 103 BIT 4,A
				Z80._r._bit(0x10, Z80._r._A);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 104 BIT 5,B 
				Z80._r._bit(0x20, Z80._r._B);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 105 BIT 5,C
				Z80._r._bit(0x20, Z80._r._C);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 106 BIT 5,D 
				Z80._r._bit(0x20, Z80._r._Dget());
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 107 BIT 5,E
				Z80._r._bit(0x20, Z80._r._Eget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 108 BIT 5,H 
				Z80._r._bit(0x20, Z80._r._Hget());
				Z80.tStates =  Z80.tStates + 8;
			},	
			function() { 		//cb + opcode 109 BIT 5,L 
				Z80._r._bit(0x20, Z80._r._Lget());
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 110 BIT 5,(HL)
				Z80._r._bit(0x20, memory[Z80._r._HL]);
				Z80.tStates =  Z80.tStates + 12;
			},
			function() { 		//cb + opcode 111 BIT 5,A 
				Z80._r._bit(0x20, Z80._r._A);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 112 BIT 6,B 
				Z80._r._bit(0x40, Z80._r._B);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 113 BIT 6,C
				Z80._r._bit(0x40, Z80._r._C);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 114 BIT 6,D 
				Z80._r._bit(0x40, Z80._r._Dget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 115 BIT 6,E 
				Z80._r._bit(0x40, Z80._r._Eget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 116 BIT 6,H
				Z80._r._bit(0x40, Z80._r._Hget());
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 117 BIT 6,L
				Z80._r._bit(0x40, Z80._r._Lget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 118 BIT 6,(HL)
				Z80._r._bit(0x40, memory[Z80._r._HL]);
				Z80.tStates =  Z80.tStates + 12;
			},
			function() { 		//cb + opcode 119 BIT 6,A
				Z80._r._bit(0x40, Z80._r._A);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 120 BIT 7,B
				Z80._r._bit(0x80, Z80._r._B);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 121 BIT 7,C 
				Z80._r._bit(0x80, Z80._r._C);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 122 BIT 7,D 
				Z80._r._bit(0x80, Z80._r._Dget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 123 BIT 7,E 
				Z80._r._bit(0x80, Z80._r._Eget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 124 BIT 7,H
				Z80._r._bit(0x80, Z80._r._Hget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 125 BIT 7,L
				Z80._r._bit(0x80, Z80._r._Lget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 126 BIT 7,(HL)
				Z80._r._bit(0x80, memory[Z80._r._HL]);
				Z80.tStates =  Z80.tStates + 12;
			},
			function() { 		//cb + opcode 127 BIT 7,A
				Z80._r._bit(0x80, Z80._r._A);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 128 RES 0,B
				Z80._r._B = Z80._r._B & ~0x01;
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 129 RES 0,C
				Z80._r._C = Z80._r._C & ~0x01;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 130 RES 0,D 
				Z80._r._Dset(Z80._r._Dget() & ~0x01);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 131 RES 0,E 
				Z80._r._Eset(Z80._r._Eget() & ~0x01);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 132 RES 0,H 
				Z80._r._Hset(Z80._r._Hget() & ~0x01);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 133 RES 0,L
				Z80._r._Lset(Z80._r._Lget() & ~0x01);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 134 RES 0,(HL)
				memory[Z80._r._HL] = (memory[Z80._r._HL] & ~0x01);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 135 RES 0,A 
				Z80._r._A = Z80._r._A & ~0x01;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 136 RES 1,B 
				Z80._r._B = Z80._r._B & ~0x02;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 137 RES 1,C 
				Z80._r._C = Z80._r._C & ~0x02;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 138 RES 1,D 
				Z80._r._Dset(Z80._r._Dget() & ~0x02);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 139 RES 1,E 
				Z80._r._Eset(Z80._r._Eget() & ~0x02);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 140 RES 1,H
				Z80._r._Hset(Z80._r._Hget() & ~0x02);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 141 RES 1,L 
				Z80._r._Lset(Z80._r._Lget() & ~0x02);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 142 RES 1,(HL) 
				memory[Z80._r._HL] = (memory[Z80._r._HL] & ~0x02);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 143 RES 1,A 
				Z80._r._A = Z80._r._A & ~0x02;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 144 RES 2,B 
				Z80._r._B = Z80._r._B & ~0x04;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 145 RES 2,C 
				Z80._r._C = Z80._r._C & ~0x04;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 146 RES 2,D
				Z80._r._Dset(Z80._r._Dget() & ~0x04);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 147 RES 2,E 
				Z80._r._Eset(Z80._r._Eget() & ~0x04);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 148 RES 2,H 
				Z80._r._Hset(Z80._r._Hget() & ~0x04);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 149 RES 2,L 
				Z80._r._Lset(Z80._r._Lget() & ~0x04);
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 150 RES 2,(HL)
				memory[Z80._r._HL] = (memory[Z80._r._HL] & ~0x04);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 151 RES 2,A 
				Z80._r._A = Z80._r._A & ~0x04;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 152 RES 3,B 
				Z80._r._B = Z80._r._B & ~0x08;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 153 RES 3,C 
				Z80._r._C = Z80._r._C & ~0x08;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 154 RES 3,D 
				Z80._r._Dset(Z80._r._Dget() & ~0x08);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 155 RES 3,E 
				Z80._r._Eset(Z80._r._Eget() & ~0x08);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 156 RES 3,H 
				Z80._r._Hset(Z80._r._Hget() & ~0x08);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 157 RES 3,L 
				Z80._r._Lset(Z80._r._Lget() & ~0x08);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 158 RES 3,(HL)
				memory[Z80._r._HL] = (memory[Z80._r._HL] & ~0x08);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 159 RES 3,A 
				Z80._r._A = Z80._r._A & ~0x08;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 160 RES 4,B 
				Z80._r._B = Z80._r._B & ~0x10;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 161 RES 4,C 
				Z80._r._C = Z80._r._C & ~0x10;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 162 RES 4,D 
				Z80._r._Dset(Z80._r._Dget() & ~0x10);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 163 RES 4,E 
				Z80._r._Eset(Z80._r._Eget() & ~0x10);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 164 RES 4,H 
				Z80._r._Hset(Z80._r._Hget() & ~0x10);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 165 RES 4,L
				Z80._r._Lset(Z80._r._Lget() & ~0x10);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 166 RES 4,(HL)
				memory[Z80._r._HL] = (memory[Z80._r._HL] & ~0x10);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 167 RES 4,A 
				Z80._r._A = Z80._r._A & ~0x10;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 168 RES 5,B 
				Z80._r._B = Z80._r._B & ~0x20;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 169 RES 5,C 
				Z80._r._C = Z80._r._C & ~0x20;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 170 RES 5,D 
				Z80._r._Dset(Z80._r._Dget() & ~0x20);
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 171 RES 5,E
				Z80._r._Eset(Z80._r._Eget() & ~0x20);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 172 RES 5,H
				Z80._r._Hset(Z80._r._Hget() & ~0x20);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 173 RES 5,L 
				Z80._r._Lset(Z80._r._Lget() & ~0x20);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 174 RES 5,(HL)
				memory[Z80._r._HL] = (memory[Z80._r._HL] & ~0x20);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 175 RES 5,A
				Z80._r._A = Z80._r._A & ~0x20;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 176 RES 6,B 
				Z80._r._B = Z80._r._B & ~0x40;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 177 RES 6,C 
				Z80._r._C = Z80._r._C & ~0x40;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 178 RES 6,D 
				Z80._r._Dset(Z80._r._Dget() & ~0x40);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 179 RES 6,E 
				Z80._r._Eset(Z80._r._Eget() & ~0x40);
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 180 RES 6,H 
				Z80._r._Hset(Z80._r._Hget() & ~0x40);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 181 RES 6,L 
				Z80._r._Lset(Z80._r._Lget() & ~0x40);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() {		//cb + opcode 182 RES 6,(HL) 
				memory[Z80._r._HL] = (memory[Z80._r._HL] & ~0x40);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 183 RES 6,A 
				Z80._r._A = Z80._r._A & ~0x40;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 184 RES 7,B 
				Z80._r._B = Z80._r._B & ~0x80;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 185 RES 7,C 
				Z80._r._C = Z80._r._C & ~0x80;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 186 RES 7,D 	
				Z80._r._Dset(Z80._r._Dget() & ~0x80);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 187 RES 7,E 
				Z80._r._Eset(Z80._r._Eget() & ~0x80);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 188 RES 7,H 
				Z80._r._Hset(Z80._r._Hget() & ~0x80);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 189 RES 7,L
				Z80._r._Lset(Z80._r._Lget() & ~0x80);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 190 RES 7,(HL) 
				memory[Z80._r._HL] = (memory[Z80._r._HL] & ~0x80);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 191 RES 7,A
				Z80._r._A = Z80._r._A & ~0x80;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 192 SET 0,B
				Z80._r._B = (Z80._r._B |  0x01);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 193 SET 0,C 
				Z80._r._C = (Z80._r._C |  0x01);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 194 SET 0,D 
				Z80._r._Dset(Z80._r._Dget() |  0x01);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 195 SET 0,E 
				Z80._r._Eset(Z80._r._Eget() |  0x01);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 196 SET 0,H 
				Z80._r._Hset(Z80._r._Hget() |  0x01);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 197 SET 0,L 
				Z80._r._Lset(Z80._r._Lget() |  0x01);
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 198 SET 0,(HL)
				memory[Z80._r._HL] = (memory[Z80._r._HL] | 0x01);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 199 SET 0,A
				Z80._r._A = (Z80._r._A |  0x01);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 200 SET 1,B 
				Z80._r._B = (Z80._r._B |  0x02);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 201 SET 1,C 
				Z80._r._C = (Z80._r._C |  0x02);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 202 SET 1,D 
				Z80._r._Dset(Z80._r._Dget() |  0x02);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 203 SET 1,E 
				Z80._r._Eset(Z80._r._Eget() |  0x02);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		 //cb + opcode 204 SET 1,H 
				Z80._r._Hset(Z80._r._Hget() |  0x02);
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 205 SET 1,L
				Z80._r._Lset(Z80._r._Lget() |  0x02);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 206 SET 1,(HL) 
				memory[Z80._r._HL] = (memory[Z80._r._HL] | 0x02);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 207 SET 1,A 
				Z80._r._A = (Z80._r._A |  0x02);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 208 SET 2,B 
				Z80._r._B = (Z80._r._B |  0x04);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() {		//cb + opcode 209 SET 2,C 	
				Z80._r._C = (Z80._r._C |  0x04);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 210 SET 2,D 
				Z80._r._Dset(Z80._r._Dget() |  0x04);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 211 SET 2,E 
				Z80._r._Eset(Z80._r._Eget() |  0x04);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 212 SET 2,H 
				Z80._r._Hset(Z80._r._Hget() |  0x04);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 213 SET 2,L
				Z80._r._Lset(Z80._r._Lget() |  0x04);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 214 SET 2,(HL)
				memory[Z80._r._HL] = (memory[Z80._r._HL] | 0x04);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 215 SET 2,A
				Z80._r._A = (Z80._r._A |  0x04);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 216 SET 3,B 
				Z80._r._B = (Z80._r._B |  0x08);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 217 SET 3,C 
				Z80._r._C = (Z80._r._C |  0x08);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 218 SET 3,D 
				Z80._r._Dset(Z80._r._Dget() |  0x08);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 219 SET 3,E 
				Z80._r._Eset(Z80._r._Eget() |  0x08);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 220 SET 3,H
				Z80._r._Hset(Z80._r._Hget() |  0x08);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 221 SET 3,L 
				Z80._r._Lset(Z80._r._Lget() |  0x08);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 222 SET 3,(HL) 
				memory[Z80._r._HL] = (memory[Z80._r._HL] | 0x08);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 223 SET 3,A 
				Z80._r._A = (Z80._r._A |  0x08);
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 224 SET 4,B
				Z80._r._B = (Z80._r._B |  0x10);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 225 SET 4,C 
				Z80._r._C = (Z80._r._C |  0x10);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 226 SET 4,D
				Z80._r._Dset(Z80._r._Dget() |  0x10);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 227 SET 4,E 
				Z80._r._Eset(Z80._r._Eget() |  0x10);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 228 SET 4,H 
				Z80._r._Hset(Z80._r._Hget() |  0x10);
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 229 SET 4,L
				Z80._r._Lset(Z80._r._Lget() |  0x10);
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 230 SET 4,(HL)
				memory[Z80._r._HL] = (memory[Z80._r._HL] | 0x10);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 231 SET 4,A
				Z80._r._A = (Z80._r._A |  0x10);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 232 SET 5,B
				Z80._r._B = (Z80._r._B |  0x20);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 233 SET 5,C 
				Z80._r._C = (Z80._r._C |  0x20);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 234 SET 5,D 
				Z80._r._Dset(Z80._r._Dget() |  0x20);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 235 SET 5,E 
				Z80._r._Eset(Z80._r._Eget() |  0x20);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 236 SET 5,H 
				Z80._r._Hset(Z80._r._Hget() |  0x20);
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 237 SET 5,L
				Z80._r._Lset(Z80._r._Lget() |  0x20);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 238 SET 5,(HL)
				memory[Z80._r._HL] = (memory[Z80._r._HL] | 0x20);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 239 SET 5,A 
				Z80._r._A = (Z80._r._A |  0x20);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 240 SET 6,B 
				Z80._r._B = (Z80._r._B |  0x40);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 241 SET 6,C 
				Z80._r._C = (Z80._r._C |  0x40);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 242 SET 6,D 
				Z80._r._Dset(Z80._r._Dget() |  0x40);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 243 SET 6,E 
				Z80._r._Eset(Z80._r._Eget() |  0x40);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 244 SET 6,H 
				Z80._r._Hset(Z80._r._Hget() |  0x40);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 245 SET 6,L 
				Z80._r._Lset(Z80._r._Lget() |  0x40);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 246 SET 6,(HL) 
				memory[Z80._r._HL] = (memory[Z80._r._HL] | 0x40);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 247 SET 6,A 
				Z80._r._A = (Z80._r._A |  0x40);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 248 SET 7,B 
				Z80._r._B = (Z80._r._B |  0x80);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 249 SET 7,C 
				Z80._r._C = (Z80._r._C |  0x80);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 250 SET 7,D 
				Z80._r._Dset(Z80._r._Dget() |  0x80);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 251 SET 7,E 
				Z80._r._Eset(Z80._r._Eget() |  0x80);
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { 		//cb + opcode 252 SET 7,H
				Z80._r._Hset(Z80._r._Hget() |  0x80);
				Z80.tStates =  Z80.tStates + 8;
			},

			function() { 		//cb + opcode 253 SET 7,L
				Z80._r._Lset(Z80._r._Lget() |  0x80);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { 		//cb + opcode 254 SET 7,(HL) 
				memory[Z80._r._HL] = (memory[Z80._r._HL] | 0x80);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { 		//cb + opcode 255 SET 7,A 
				Z80._r._A = (Z80._r._A |  0x80);
				Z80.tStates =  Z80.tStates + 8;
			},
		],
		
	// PREFIX ED
		
	_ed_op: [
		function() { //ed + opcode 0 NOP
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 1 NOP
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 2 NOP
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 3 NOP
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 4 NOP
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 5 NOP
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 6 NOP
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 7 NOP
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 8 NOP
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 9 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 10 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 11 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 12 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 13 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 14 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 15 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 16 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 17 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 18 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 19 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 20 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 21 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 22 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 23 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 24 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 25 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 26 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 27 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 28 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 29 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 30 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 31 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 32 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 33 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 34 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 35 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 36 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 37 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 38 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 39 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 40 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 41 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 42 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 43 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 44 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 45 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 46 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 47 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 48 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 49 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 50 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 51 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 52 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 53 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 54 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 55 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 56 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 57 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 58 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 59 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 60 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 61 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 62 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 63 NOP
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 64 IN B,(c) 
				Z80._r._B = Z80._r._in_bc();
				Z80.tStates =  Z80.tStates + 12;
			},
		function() { //ed + opcode 65 OUT (c),B 
				Z80._r._out(Z80._r._BCget(), Z80._r._B, Z80._r._B, Z80.tStates);
				Z80.tStates =  Z80.tStates + 12;
			},
		function() { //ed + opcode 66 SBC HL,BC 
				Z80._r._HL= Z80._r._sbc16(Z80._r._HL, Z80._r._BCget());
				Z80.tStates =  Z80.tStates + 15;
			},
		function() { //ed + opcode 67 LD (nn),BC 
				var addr = memory[Z80._r._PC++];
				addr |= (memory[Z80._r._PC++] << 8);
				memory[addr] = (Z80._r._BCget() & 0xFF);
				addr = addr + 1;
				memory[addr & 0xFFFF] = (Z80._r._BCget() >> 8);	
				Z80.tStates =  Z80.tStates + 20;
			},
		function() { //ed + opcode 68 NEG
				var temp = Z80._r._A;
				Z80._r._A = 0;
				Z80._r._subA(temp);
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 69 RETN 
				Z80._r._IFF1 = Z80._r._IFF2;
				Z80._r._PC = Z80._r._pop();
				Z80.tStates =  Z80.tStates + 14;
			},
		function() { //ed + opcode 70 IM 0
				Z80._r._IM = 0;
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 71 LD I,A 
				Z80._r._I = Z80._r._A;
				Z80.tStates =  Z80.tStates + 9; 
			},
		function() { //ed + opcode 72 IN C,(c)
				Z80._r._C = Z80._r._in_bc();
				Z80.tStates =  Z80.tStates + 12;
			},
		function() { //ed + opcode 73 OUT (c),C 
				Z80._r._out(Z80._r._BCget(), Z80._r._C, Z80.tStates);
				Z80.tStates =  Z80.tStates + 12;
			},
		function() { //ed + opcode 74 ADC HL,BC 
				Z80._r._HL = Z80._r._adc16(Z80._r._HL, Z80._r._BCget());
				Z80.tStates =  Z80.tStates + 15;
			},
		function() { //ed + opcode 75 LD BC,(nn)  
				var addr = memory[Z80._r._PC++];
				addr |= ((memory[Z80._r._PC++] & 0xFFFF) << 8);
				var temp = memory[addr++];
				temp |= ((memory[addr] & 0xFFFF) << 8);
				
				Z80._r._BCset(temp);
				Z80.tStates =  Z80.tStates + 20;
			},
		function() { //ed + opcode 76 NEG
				var temp = Z80._r._A;
				Z80._r._A = 0;
				Z80._r._subA(temp);
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 77 RETI
				Z80._r._PC = Z80._r._pop();
				Z80.tStates =  Z80.tStates + 14;   
			},
		function() { //ed + opcode 78 IM 0
				Z80._r._IM = 0;
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 79 LD R,A 
				Z80._r._R = Z80._r._A;
				Z80._r._R7 = Z80._r._A & 0x80;
				Z80.tStates = Z80.tStates + 9;
			},
		function() { //ed + opcode 80 IN D,(c)
				Z80._r._Dset(Z80._r._in_bc());
				Z80.tStates =  Z80.tStates + 12; 
 
			},
		function() { //ed + opcode 81 OUT (c),D 
				Z80._r._out(Z80._r._BCget(), Z80._r._Dget(), Z80.tStates);
				Z80.tStates =  Z80.tStates + 12; 
			},
		function() { //ed + opcode 82 SBC HL,DE 
				Z80._r._HL = Z80._r._sbc16(Z80._r._HL, Z80._r._DE);
				Z80.tStates =  Z80.tStates + 15; 
			},
		function() { //ed + opcode 83 LD (nn),DE 
				var addr = memory[Z80._r._PC++];
				addr |= (memory[Z80._r._PC++] << 8);
				memory[addr] = (Z80._r._DE & 0xFF);
				addr = addr + 1;
				memory[addr] = (Z80._r._DE >> 8);	
				Z80.tStates =  Z80.tStates + 20;
			},
		function() { //ed + opcode 84 NEG
				var temp = Z80._r._A;
				Z80._r._A = 0;
				Z80._r._subA(temp);
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 85 RETN 
				Z80._r._IFF1 = Z80._r._IFF2;
				Z80._r._PC = Z80._r._pop();
				Z80.tStates =  Z80.tStates + 14; 
			},
		function() { //ed + opcode 86 IM 1
				Z80._r._IM = 1;
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 87 LD A,I // Changes several flags
			var temp = Z80._r._I;
			
			Z80._r._fN = 0;
			Z80._r._fZ = (temp == 0);
			Z80._r._fP = Z80._r._IFF2;
			Z80._r._f3 = ((temp & 0x08) != 0);
			Z80._r._fH = 0;	
			Z80._r._f5 = ((temp & 0x20) != 0);
			Z80._r._fS = ((temp & 0x80) != 0);
						
			Z80._r._A = temp;
			Z80.tStates =  Z80.tStates + 9;
			},
		function() { //ed + opcode 88 IN E,(c)
				Z80._r._Eset(Z80._r._in_bc());
				Z80.tStates =  Z80.tStates + 12;  
			},
		function() { //ed + opcode 89 OUT (c),E 
				Z80._r._out(Z80._r._BCget(), Z80._r._Eget(), Z80.tStates);
				Z80.tStates =  Z80.tStates + 12; 
			},
		function() { //ed + opcode 90 ADC HL,DE 
				Z80._r._HL = Z80._r._adc16(Z80._r._HL, Z80._r._DE);
				Z80.tStates =  Z80.tStates + 15; 
			},
		function() { //ed + opcode 91 LD DE,(nn) 
				var addr = memory[Z80._r._PC++];
				addr |= ((memory[Z80._r._PC++] & 0xFFFF) << 8);
				var value = memory[addr++];
				value |= ((memory[addr] & 0xFFFF) << 8);		
				Z80._r._DE = value;
				Z80.tStates =  Z80.tStates + 20;
			},
		function() { //ed + opcode 92 NEG
				var temp = Z80._r._A;
				Z80._r._A = 0;
				Z80._r._subA(temp);
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 93 RETI
				Z80._r._PC = Z80._r._pop();
				Z80.tStates =  Z80.tStates + 14;    
			},
		function() { //ed + opcode 94 IM 2
				Z80._r._IM = 2;
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 95 LD A,R 
				var temp = Z80._r._R;
			
				Z80._r._fN = 0;
				Z80._r._fZ = (temp == 0);
				Z80._r._fP = Z80._r._IFF2;
				Z80._r._f3 = ((temp & 0x08) != 0);
				Z80._r._fH = 0;	
				Z80._r._f5 = ((temp & 0x20) != 0);
				Z80._r._fS = ((temp & 0x80) != 0);
							
				Z80._r._A = temp;
				Z80.tStates =  Z80.tStates + 9;
			},
		function() { //ed + opcode 96 IN H,(c)
				Z80._r._Hset(Z80._r._in_bc());
				Z80.tStates =  Z80.tStates + 12;  
			},
		function() { //ed + opcode 97 OUT (c),H
				Z80._r._out(Z80._r._BCget(), Z80._r._Hget(), Z80.tStates);
				Z80.tStates =  Z80.tStates + 12;
 
			},
		function() { //ed + opcode 98 SBC HL,HL 
				Z80._r._HL = Z80._r._sbc16(Z80._r._HL, Z80._r._HL);
				Z80.tStates =  Z80.tStates + 15;
			},
		function() { //ed + opcode 99 LD (nn),HL 
				var addr = memory[Z80._r._PC++];
				addr |= (memory[Z80._r._PC++] << 8);
				memory[addr] = (Z80._r._HL & 0xFF);
				addr = addr + 1;
				memory[addr] = (Z80._r._HL >> 8);	
				Z80.tStates =  Z80.tStates + 20; 
			},
		function() { //ed + opcode 100 NEG
				var temp = Z80._r._A;
				Z80._r._A = 0;
				Z80._r._subA(temp);
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 101 RETN 
				Z80._r._IFF1 = Z80._r._IFF2;
				Z80._r._PC = Z80._r._pop();
				Z80.tStates =  Z80.tStates + 14;  
			},
		function() { //ed + opcode 102 IM 0
				Z80._r._IM = 0;
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 103 RRD // Rotate right through A and (HL)
				var value = Z80._r._A;
				var t1 = memory[Z80._r._HL];
				var t2 = t1;
				
				t1 = (t1 >> 4) | (value << 4);
				value = (value & 0xF0) | (t2 & 0x0F);
				memory[Z80._r._HL] = t1;
				
				Z80._r._fN = 0;
				Z80._r._fZ = (value == 0);
				Z80._r._fP = Z80._r._IFF2;
				Z80._r._f3 = ((value & 0x08) != 0);
				Z80._r._fH = 0;	
				Z80._r._f5 = ((value & 0x20) != 0);
				Z80._r._fS = ((value & 0x80) != 0);
							
				Z80._r._A = value;
				Z80.tStates =  Z80.tStates + 18;			
			},
		function() { //ed + opcode 104 IN L,(c)
				Z80._r._Lset(Z80._r._in_bc());
				Z80.tStates =  Z80.tStates + 12; 
			},
		function() { //ed + opcode 105 OUT (c),L
				Z80._r._out(Z80._r._BCget(), Z80._r._Lget(), Z80.tStates);
				Z80.tStates =  Z80.tStates + 12;
 
			},
		function() { //ed + opcode 106 ADC HL,HL 
				Z80._r._HL = Z80._r._adc16(Z80._r._HL, Z80._r._HL);
				Z80.tStates =  Z80.tStates + 15; 
			},
		function() { //ed + opcode 107 LD HL,(nn) 
				var addr = memory[Z80._r._PC++];
				addr |= ((memory[Z80._r._PC++] & 0xFFFF) << 8);
				var value = memory[addr++];
				value |= ((memory[addr] & 0xFFFF) << 8);		
				Z80._r._HL = value;
				Z80.tStates =  Z80.tStates + 20;
			},
		function() { //ed + opcode 108 NEG
				var temp = Z80._r._A;
				Z80._r._A = 0;
				Z80._r._subA(temp);
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 109 RETI
				Z80._r._PC = Z80._r._pop();
				Z80.tStates =  Z80.tStates + 14;     
			},
		function() { //ed + opcode 110 IM 0
				Z80._r._IM = 0;
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 111 // Rotate right through A and (HL)
				var value = Z80._r._A;
				var t1 = memory[Z80._r._HL];
				var t2 = t1;
				
				t1 = (t1 << 4) | (value & 0x0F);
				value = (value & 0xF0) | (t2 >> 4);
				memory[Z80._r._HL] = (t1 & 0xFF);
				
				Z80._r._fN = 0;
				Z80._r._fZ = (value == 0);
				Z80._r._fP = Z80._r._IFF2;
				Z80._r._f3 = ((value & 0x08) != 0);
				Z80._r._fH = 0;	
				Z80._r._f5 = ((value & 0x20) != 0);
				Z80._r._fS = ((value & 0x80) != 0);
							
				Z80._r._A = value;
				Z80.tStates =  Z80.tStates + 18;
			},
		function() { //ed + opcode 112 IN (c) 
			Z80._r._in_bc();
			Z80.tStates =  Z80.tStates + 12; 
			},
		function() { //ed + opcode 113 OUT (c),0 
				Z80._r._out(Z80._r._BCget(), 0, Z80.tStates);
				Z80.tStates =  Z80.tStates + 12;
 
			},
		function() { //ed + opcode 114 SBC HL,SP 
				Z80._r._HL = Z80._r._sbc16(Z80._r._HL, Z80._r._SP);
				Z80.tStates =  Z80.tStates + 15;
			},
		function() { //ed + opcode 115 LD (nn),SP 
				var addr = memory[Z80._r._PC++];
				addr |= (memory[Z80._r._PC++] << 8);
				memory[addr] = (Z80._r._SP & 0xFF);
				addr = addr + 1;
				memory[addr] = (Z80._r._SP >> 8);	
				Z80.tStates =  Z80.tStates + 20;
			},
		function() { //ed + opcode 116 NEG
				var temp = Z80._r._A;
				Z80._r._A = 0;
				Z80._r._subA(temp);
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 117 RETN 
				Z80._r._IFF1 = Z80._r._IFF2;
				Z80._r._PC = Z80._r._pop();
				Z80.tStates =  Z80.tStates + 14;  
			},
		function() { //ed + opcode 118 IM 1
				Z80._r._IM = 1;
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 119 
 
			},
		function() { //ed + opcode 120 IN A,(c) 
				Z80._r._A = Z80._r._in_bc();
				Z80.tStates =  Z80.tStates + 12;
			},
		function() { //ed + opcode 121 OUT (c),A 
				Z80._r._out(Z80._r._BCget(), Z80._r._A, Z80.tStates);
				Z80.tStates =  Z80.tStates + 12;
 
			},
		function() { //ed + opcode 122 ADC HL,SP 
				Z80._r._HL = Z80._r._adc16(Z80._r._HL, Z80._r._SP);
				Z80.tStates =  Z80.tStates + 15;
 
			},
		function() { //ed + opcode 123 LD SP,(nn) 
				var addr = memory[Z80._r._PC++];
				addr |= ((memory[Z80._r._PC++] & 0xFFFF) << 8);
				var value = memory[addr++];
				value |= ((memory[addr] & 0xFFFF) << 8);		
				Z80._r._SP = value;
				Z80.tStates =  Z80.tStates + 20;
			},
		function() { //ed + opcode 124 NEG
				var temp = Z80._r._A;
				Z80._r._A = 0;
				Z80._r._subA(temp);
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 125 RETI
				Z80._r._PC = Z80._r._pop();
				Z80.tStates =  Z80.tStates + 14;    
			},
		function() { //ed + opcode 126 IM 2
				Z80._r._IM = 2;
				Z80.tStates =  Z80.tStates + 8; 
			},
		function() { //ed + opcode 127 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 128 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 129 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 130 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 131 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 132 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 133 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 134 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 135 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 136 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 137 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 138 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 139 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 140 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 141 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 142 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 143 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 144 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 145 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 146 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 147 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 148 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 149 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 150 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 151 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 152 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 153 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 154 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 155 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 156 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 157 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 158 NOP
  				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 159 NOP
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 160 LDI
				memory[Z80._r._Dget()] = memory[Z80._r._HL];
				Z80._r._DE = Z80._r._DE + 1;
				Z80._r._HL = Z80._r._HL + 1;
				Z80._r._BCset(Z80._r._BCget()-1);
				
				Z80._r._fN = 0;
				Z80._r._fP = (Z80._r._BCget() != 0);
				Z80._r._fH = 0;	
				Z80.tStates =  Z80.tStates + 16;				
			},
		function() { //ed + opcode 161 CPI
				var temp = Z80._r._fC;
				Z80._r._cpA(memory[Z80._r._HL]);
				Z80._r._HL = Z80._r._HL + 1;
				Z80._r._BCset(Z80._r._BCget()-1);
				
				Z80._r._fP = (Z80._r._BCget() != 0);
				Z80._r._fC = temp;
				Z80.tStates =  Z80.tStates + 16;
			},
		function() { //ed + opcode 162 INI
				memory[Z80._r._HL] = Z80._r._in(Z80._r._BCget());
				Z80._r._B = (Z80._r._B - 1) & 0xFF;
				Z80._r._HL = Z80._r._HL + 1;
				
				Z80._r._fN = 1;
				Z80._r._fZ = (Z80._r._B == 0);
				Z80.tStates =  Z80.tStates + 16; 
			},
		function() { //ed + opcode 163 OUTI 
				Z80._r._B = (Z80._r._B - 1) & 0xFF;
				Z80._r._out(Z80._r._BCget(), memory[Z80._r._HL], Z80.tStates);
				Z80._r._HL = Z80._r._HL + 1;
				
				Z80._r._fN = 1;
				Z80._r._fZ = (Z80._r._B == 0);
				Z80.tStates =  Z80.tStates + 16;  
			},
		function() { //ed + opcode 164 NOP
   				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 165 NOP
   				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 166 NOP
   				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 167 NOP
   				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 168 LDD 
				memory[Z80._r._DE] = memory[Z80._r._HL];
				Z80._r._BCset(Z80._r._BCget()-1);
				Z80._r._DE = Z80._r._DE - 1;
				Z80._r._HL = Z80._r._HL - 1;
				
				Z80._r._fN = 0;
				Z80._r._PV = (Z80._r._BCget() != 0);
				Z80.tStates =  Z80.tStates + 16; 
			},
		function() { //ed + opcode 169 CPD 
				var temp = Z80._r._fC;
				Z80._r._cpA(memory[Z80._r._HL]);
				Z80._r._BCset(Z80._r._BCget()-1);
				Z80._r._HL = Z80._r._HL - 1;
				
				Z80._r._fC = temp;
				Z80._r._fP = (Z80._r._BCget() != 0);
				Z80.tStates =  Z80.tStates + 16; 
			},
		function() { //ed + opcode 170 IND
				memory[Z80._r._HL] = Z80._r._in(Z80._r._BCget());
				Z80._r._B = (Z80._r._B - 1) & 0xFF;
				Z80._r._HL = Z80._r._HL - 1;
				
				Z80._r._fN = 1;
				Z80._r._fZ = (Z80._r._B == 0);
				Z80.tStates =  Z80.tStates + 16; 
			},
		function() { //ed + opcode 171 OUTD 
				Z80._r._B = (Z80._r._B - 1) & 0xFF;
				Z80._r._out(Z80._r._BCget(), memory[Z80._r._HL], Z80.tStates);
				Z80._r._HL = Z80._r._HL - 1;
				
				Z80._r._fN = 1;
				Z80._r._fZ = (Z80._r._B == 0);
				Z80.tStates =  Z80.tStates + 16; 
			},
		function() { //ed + opcode 172 NOP
   				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 173 NOP
   				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 174 NOP
   				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 175 NOP
   				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 176 LDIR 
				var temp = 0;
				var count = Z80._r._BCget();
				var dest = Z80._r._DE;
				var src = Z80._r._HL;
				Z80._r._R = Z80._r._R + (-2);
				while (count != 0) {
					memory[dest] = memory[src];
					dest = dest + 1;
					count = count - 1;;
					src = src + 1;
					};
				Z80._r._R = Z80._r._R + (2 * count);
				temp = temp + (21 * count);
				if (count != 0) {
					Z80._r._PC = Z80._r._PC - 2;
					Z80._r._fN = 0;
					Z80._r._fP = 1
					Z80._r._fH = 0;
				} else { 
					temp = temp + (-5);
					Z80._r._fN = 0;
					Z80._r._fP = 0;
					Z80._r._fH = 0;
				};
				Z80._r._BCset(count);
				Z80._r._DE = dest;
				Z80._r._HL = src;
				Z80.tStates = Z80.tStates + temp;
			},
		function() { //ed + opcode 177 CPIR 
				var temp = Z80._r._fC;
				Z80._r._cpA(memory[Z80._r._HL]);
				Z80._r._BCset((Z80._r._BCget() -1) & 0xFFFF);
				Z80._r._HL = Z80._r._HL + 1;
				
				Z80._r._fC= temp;
				Z80._r._fP= (Z80._r._BCget() != 0);
				if( (Z80._r._fP) && (!Z80._r._fZ)){
					Z80._r._PC = Z80._r._PC - 2;
					Z80.tStates =  Z80.tStates + 21;
				} else Z80.tStates =  Z80.tStates + 16;			
			},
		function() { //ed + opcode 178 INIR
				memory[Z80._r._HL] = Z80._r._in(Z80._r._BCget());
				Z80._r._B = (Z80._r._B - 1) & 0xFF;
				Z80._r._HL = Z80._r._HL + 1;
				
				Z80._r._fN = 1;
				Z80._r._fZ = 1;
				if (Z80._r._BC != 0){
					Z80._r._PC = Z80._r._PC - 2;
					Z80.tStates =  Z80.tStates + 21;
				} else Z80.tStates =  Z80.tStates + 16; 
			},
		function() { //ed + opcode 179 OTIR 
				Z80._r._B = (Z80._r._B - 1) & 0xFF;
				Z80._r._out(Z80._r._BCget(), memory[Z80._r._HL], Z80.tStates);
				Z80._r._HL = Z80._r._HL + 1;
				
				Z80._r._fN = 1;
				Z80._r._fZ = 1;
				if(Z80._r._B != 0) {
					Z80._r._PC = Z80._r._PC - 2;
					Z80.tStates =  Z80.tStates + 21; 
				} else Z80.tStates =  Z80.tStates + 16;
			},
		function() { //ed + opcode 180 NOP
   				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 181 NOP
   				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 182 NOP
   				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 183 NOP
   				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 184 LDDR 
				var temp = 0;
				var count = Z80._r._BCget();
				var dest = Z80._r._DE;
				var src = Z80._r._HL;
				Z80._r._R = Z80._r._R + (-2);
				while (count > 0) {
					memory[dest] = memory[src];
					dest = (dest - 1) & 0xFFFF;
					count = count - 1;
					src = (src - 1) & 0xFFFF;
					};
				Z80._r._R = Z80._r._R + (2 * count);
				temp = temp +  (21 * count);
				if (count != 0) {
					Z80._r._PC = Z80._r._PC - 2;
					Z80._r._fN = 0;
					Z80._r._fP = 1
					Z80._r._fH = 0;
				} else { 
					temp = temp + (-5);
					Z80._r._fN = 0;
					Z80._r._fP = 0;
					Z80._r._fH = 0;
				};
				Z80._r._BCset(count);
				Z80._r._DE = dest & 0xFFFF;
				Z80._r._HL = src & 0xFFFF;
				Z80.tStates = Z80.tStates + temp;
			},
		function() { //ed + opcode 185 CPDR 
				var temp = Z80._r._fC;
				Z80._r._cpA(memory[Z80._r._HL]);
				Z80._r._BCset((Z80._r._BCget() -1) & 0xFFFF);
				Z80._r._HL = Z80._r._HL - 1;
				
				Z80._r._fC= temp;
				Z80._r._fP= (Z80._r._BCget() != 0);
				if( (Z80._r._fP) && (!Z80._r._fZ)){
					Z80._r._PC = Z80._r._PC - 2;
					Z80.tStates =  Z80.tStates + 21;
				} else Z80.tStates =  Z80.tStates + 16;			
			},
		function() { //ed + opcode 186 INDR 
				memory[Z80._r._HL] = Z80._r._in(Z80._r._BCget());
				Z80._r._B = (Z80._r._B - 1) & 0xFF;
				Z80._r._HL = Z80._r._HL - 1;
				
				Z80._r._fN = 1;
				Z80._r._fZ = 1;
				if(Z80._r._B != 0){
					Z80._r._PC = Z80._r._PC - 2;
					Z80.tStates =  Z80.tStates + 21;
				} else Z80.tStates =  Z80.tStates + 16;	
			},
		function() { //ed + opcode 187 OTDR 
				Z80._r._B = (Z80._r._B - 1) & 0xFF;
				Z80._r._out(Z80._r._BCget(), memory[Z80._r._HL], Z80.tStates);
				Z80._r._HL = Z80._r._HL - 1;
				
				Z80._r._fN = 1;
				Z80._r._fZ = 1;
				if(Z80._r._B != 0) {
					Z80._r._PC = Z80._r._PC - 2;
					Z80.tStates =  Z80.tStates + 21; 
				} else Z80.tStates =  Z80.tStates + 16;
			},
		function() { //ed + opcode 188 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 189 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 190 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 191 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 192 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 193 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 194 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 195 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 196 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 197 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 198 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 199 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 200
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 201 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 202 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 203 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 204 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 205 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 206 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 207 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 208 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 209 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 210 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 211 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 212 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 213 
				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 214 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 215 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 216 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 217 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 218 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 219 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 220 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 221 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 222 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 223 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 224 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 225 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 226 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 227 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 228 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 229 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 230 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 231 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 232 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 233 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 234 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 235 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 236 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 237 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 238 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 239 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 240 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 241 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 242 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 243 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 244 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 245 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 246 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 247 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 248 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 249 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 250 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 251 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 252 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 253 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 254 
 				Z80.tStates =  Z80.tStates + 8;
			},
		function() { //ed + opcode 255 
 				Z80.tStates =  Z80.tStates + 8;
			},
		],
			
	// PREFIX INDEX (IX or IY)
	
	_index_op: [
			function() { //index + opcode 0 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 1 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 2 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 3 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 4 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 5 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 6 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 7 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 8 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 9 ADD IT,BC 
				Z80._r._IT = Z80._r._add16(Z80._r._IT, Z80._r._BCget());
				Z80.tStates =  Z80.tStates + 15;
			},
		    function() { //index + opcode 10 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 11 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 12 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 13 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 14 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 15 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 16 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 17 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 18 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 19 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 20 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 21 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 22 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 23 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 24 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 25 ADD IT,DE 
				Z80._r._IT = Z80._r._add16(Z80._r._IT, Z80._r._DE);
				Z80.tStates =  Z80.tStates + 15;
			},
		    function() { //index + opcode 26 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 27 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 28 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 29 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 30 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 31 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 32 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 33 // LD IT,nn
				Z80._r._IT = memory[Z80._r._PC++];
				Z80._r._IT = (memory[Z80._r._PC++] << 8) | Z80._r._IT;
				Z80.tStates =  Z80.tStates + 14; 
			},
			function() { //index + opcode 34 LD (nn),IT
				var addr = memory[Z80._r._PC++];
				addr |= (memory[Z80._r._PC++] << 8);
				memory[addr] = (Z80._r._IT & 0xFF);
				addr = addr + 1;
				memory[addr] = (Z80._r._IT >> 8); 
				Z80.tStates =  Z80.tStates + 20;
			},
			function() { //index + opcode 35 INC IT
				Z80._r._IT++;
				Z80.tStates =  Z80.tStates + 10;
			},
			function() {  //index + opcode 36 INC ITH
				var temp = (Z80._r._inc8((Z80._r._IT >> 8)));
				Z80._r._IT =  (temp << 8) | (Z80._r._IT & 0xFF);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() {  //index + opcode 37 DEC ITH
				var temp = (Z80._r._dec8((Z80._r._IT >> 8)));
				Z80._r._IT =  (temp << 8) | (Z80._r._IT & 0xFF);
				Z80.tStates =  Z80.tStates + 8;
			},

			function() { 	//index + opcode 38 LD ITH,n 
				Z80._r._IT = (memory[Z80._r._PC++] << 8) | (Z80._r._IT & 0xFF);
				Z80.tStates =  Z80.tStates + 11;
			},
		    function() { //index + opcode 39 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 40 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			}, 
			function() { //index + opcode 41 ADD IT, IT 
				Z80._r._IT = Z80._r._add16(Z80._r._IT, Z80._r._IT);
				Z80.tStates =  Z80.tStates + 15;
			},
			function() { //index + opcode 42 
				
			},
			function() {  //index + opcode 43 DEC IT
				Z80._r._IT--;
				Z80.tStates =  Z80.tStates + 10;
			},
			function() {  //index + opcode 44 INC ITL
				var temp = (Z80._r._inc8((Z80._r._IT & 0xFF)));
				Z80._r._IT =  (Z80._r._IT & 0xFF00 ) | temp;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() {  //index + opcode 45 DEC ITL 
				var temp = (Z80._r._dec8((Z80._r._IT & 0xFF)));
				Z80._r._IT =  (Z80._r._IT & 0xFF00 ) | temp;
				Z80.tStates =  Z80.tStates + 8;
			},
			function() {  //index + opcode 46 LD ITL,n 
				Z80._r._IT = (Z80._r._IT & 0xFF00) | (memory[Z80._r._PC++]);
				Z80.tStates =  Z80.tStates + 11;
			},
		    function() { //index + opcode 47 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 48 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 49 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 50 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 51 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},

			function() { //index + opcode 52 INC (IT + d) // Index register access 
				var addr = (Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]));
				memory[addr] = Z80._r._inc8(memory[addr]);
				Z80.tStates =  Z80.tStates + 23;
			},
			function() {  //index + opcode 53 DEC (IT + d) // Index register access
				var addr = (Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]));
				memory[addr] = Z80._r._dec8(memory[addr]);
				Z80.tStates =  Z80.tStates + 23;
			},
			function() {  //index + opcode 54 LD (IT + d),n 
				var addr = (Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]));
				memory[addr] = memory[Z80._r._PC++];
				Z80.tStates =  Z80.tStates + 19;
			},
		    function() { //index + opcode 55 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 56 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 57 ADD IT,SP 
				Z80._r._IT = Z80._r._add16(Z80._r._IT, Z80._r._SP);
				Z80.tStates =  Z80.tStates + 15;
			},
		    function() { //index + opcode 58 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 59 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 60 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 61 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 62 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 63 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 64 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 65 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 66 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 67 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 68 LD B,ITH 
				Z80._r._B = (Z80._r._IT >> 8);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 69 LD B,ITL
				Z80._r._B = (Z80._r._IT & 0xFF);
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { //index + opcode 70 LD B,(IT + d)
				var addr = Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._B = memory[addr];
				Z80.tStates =  Z80.tStates + 19;
			},
		    function() { //index + opcode 71 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 72 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 73 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 74 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 75 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 76 LD C,ITH 
				Z80._r._C = (Z80._r._IT >> 8);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 77 LD C,ITL
				Z80._r._C = (Z80._r._IT & 0xFF);
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { //index + opcode 78 LD C,(IT + d)
				var addr = Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._C = memory[addr];
				Z80.tStates =  Z80.tStates + 19;
			},
		    function() { //index + opcode 79 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 80 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 81 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 82 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 83 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 84 LD D,ITH 
				Z80._r._Dset((Z80._r._IT >> 8));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 85 LD D,ITL 
				Z80._r._Dset((Z80._r._IT & 0xFF));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 86 LD D,(IT + d)
				var addr = Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._Dset(memory[addr]);
				Z80.tStates =  Z80.tStates + 19; 
			},
		    function() { //index + opcode 87 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 88 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 89 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 90 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 91 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 92 LD E,ITH 
				Z80._r._Eset((Z80._r._IT >> 8));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 93 LD E,ITL  
				Z80._r._Eset((Z80._r._IT & 0xFF));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 94 LD E,(IT + d) 
				var addr = Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._Eset(memory[addr]);
				Z80.tStates =  Z80.tStates + 19; 
			},
		    function() { //index + opcode 95 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 96 LD ITH,B 
				Z80._r._IT = (Z80._r._B << 8) | (Z80._r._IT & 0xFF);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() {  //index + opcode 97 LD ITH,C 
				Z80._r._IT = (Z80._r._C << 8) | (Z80._r._IT & 0xFF);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 98 LD ITH,D 
				Z80._r._IT = (Z80._r._Dget() << 8) | (Z80._r._IT & 0xFF);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 99 LD ITH,E 
				Z80._r._IT = (Z80._r._Eget() << 8) | (Z80._r._IT & 0xFF);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 100 LD ITH,ITH 
				Z80.tStates =  Z80.tStates + 8;
			}, 
			function() { //index + opcode 101 LD ITH,ITL 
				Z80._r._IT = (((Z80._r._IT & 0xFF) << 8) | Z80._r._IT & 0xFF);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 102 LD H,(IT + d) 
				var addr = Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._Hset(memory[addr]);
				Z80.tStates =  Z80.tStates + 19;
			},
			function() { //index + opcode 103 LD ITH,A 
				Z80._r._IT = ((Z80._r._A << 8) | Z80._r._IT & 0xFF);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 104 LD ITL,B 
				Z80._r._IT = (Z80._r._IT & 0xFF00) | (Z80._r._B);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 105 LD ITL,C 
				Z80._r._IT = (Z80._r._IT & 0xFF00) | (Z80._r._C);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 106 LD ITL,D 
				Z80._r._IT = (Z80._r._IT & 0xFF00) | (Z80._r._Dget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 107 LD ITL,E 
				Z80._r._IT = (Z80._r._IT & 0xFF00) | (Z80._r._Eget());
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 108 LD ITL,ITH 
				Z80._r._IT = ((Z80._r._IT & 0xFF00) | ((Z80._r._IT >> 8)));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 109 LD ITL,ITL 
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 110 LD L,(IT + d)  
				var addr = Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._Lset(memory[addr]);
				Z80.tStates =  Z80.tStates + 19;
			},
			function() { //index + opcode 111 LD ITL,A 
				Z80._r._IT = (Z80._r._IT & 0xFF00) | (Z80._r._A);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 112 LD (IT + d),B 
				var addr = (Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]));
				memory[addr] = Z80._r._B;
				Z80.tStates =  Z80.tStates + 19;
			},
			function() { //index + opcode 113 LD (IT + d),C
				var addr = (Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]));
				memory[addr] = Z80._r._C;
				Z80.tStates =  Z80.tStates + 19;
			},
			function() { //index + opcode 114  LD (IT + d),D 
				var addr = (Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]));
				memory[addr] = Z80._r._Dget();
				Z80.tStates =  Z80.tStates + 19;
			},
			function() { //index + opcode 115 LD (IT + d),E 
				var addr = (Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]));
				memory[addr] = Z80._r._Eget();
				Z80.tStates =  Z80.tStates + 19;
			},
			function() { //index + opcode 116 LD (IT + d),H 
				var addr = (Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]));
				memory[addr] = Z80._r._Hget();
				Z80.tStates =  Z80.tStates + 19;
			},
			function() {  //index + opcode 117 LD (IT + d),L 
				var addr = (Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]));
				memory[addr] = Z80._r._Hget();
				Z80.tStates =  Z80.tStates + 19;
			},
			function() {  //index + opcode 118 
				
			}, 
			function() {  //index + opcode 119 LD (IT + d),A 
				var addr = (Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]));
				memory[addr] = Z80._r._A;
				Z80.tStates =  Z80.tStates + 19;
			},
		    function() { //index + opcode 120 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 121 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 122 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 123 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 124 LD A,ITH
				Z80._r._A = ((Z80._r._IT >> 8));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 125 LD A,ITL 
				Z80._r._A = (Z80._r._IT & 0xFF);
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 126 LD A,(IT + d) 
				var addr = Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._A = memory[addr];
				Z80.tStates =  Z80.tStates + 19;
			},
		    function() { //index + opcode 127 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 128 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 129 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 130 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 131 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 132 ADD A,ITH 
				Z80._r._addA((Z80._r._IT >> 8));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 133 ADD A,ITL 
				Z80._r._addA((Z80._r._IT & 0xFF));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 134 ADD A,(IT + d)
				var addr = Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._addA(memory[addr]);
				Z80.tStates =  Z80.tStates + 19;
			},
		    function() { //index + opcode 135 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 136 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 137 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 138 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 139 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 140 ADC A,ITH
				Z80._r._adcA((Z80._r._IT >> 8));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 141 ADC A,ITL 
				Z80._r._adcA((Z80._r._IT & 0xFF));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 142 ADC A,(IT + d) 
				var addr = Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._adcA(memory[addr]);
				Z80.tStates =  Z80.tStates + 19;
			},
		    function() { //index + opcode 143 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 144 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 145 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 146 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 147 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 148 SUB ITH 
				Z80._r._subA((Z80._r._IT >> 8));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 149 SUB ITL 
				Z80._r._subA((Z80._r._IT & 0xFF));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 150 SUB (IT + d) 
				var addr = Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._subA(memory[addr]);
				Z80.tStates =  Z80.tStates + 19;
			},
		    function() { //index + opcode 151 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 152 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 153 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 154 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 155 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 156 SBC A,ITH 
				Z80._r._sbcA((Z80._r._IT >> 8));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 157 SBC A,ITL
				Z80._r._sbcA((Z80._r._IT & 0xFF));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 158 SBC A,(IT + d)
				var addr = Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._sbcA(memory[addr]);
				Z80.tStates =  Z80.tStates + 19;
			},
		    function() { //index + opcode 159 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 160 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 161 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 162 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 163 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 164 AND ITH 
				Z80._r._andA((Z80._r._IT >> 8));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 165 AND ITL 
				Z80._r._andA((Z80._r._IT & 0xFF));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 166 AND (IT + d) 
				var addr = Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._andA(memory[addr]);
				Z80.tStates =  Z80.tStates + 19;
			},
		    function() { //index + opcode 167 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 168 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 169 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 170 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 171 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 172 XOR ITH 
				Z80._r._xorA((Z80._r._IT >> 8));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 173 XOR ITL 
				Z80._r._xorA((Z80._r._IT & 0xFF));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 174 XOR (IT + d)
				var addr = Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._xorA(memory[addr]);
				Z80.tStates =  Z80.tStates + 19;
			},
		    function() { //index + opcode 175 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 176 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 177 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 178 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 179 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			}, 
			function() { //index + opcode 180 OR ITH
				Z80._r._orA((Z80._r._IT >> 8));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 181 OR ITL 
				Z80._r._orA((Z80._r._IT & 0xFF));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 182 OR (IT + d)
				var addr = Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._orA(memory[addr]);
				Z80.tStates =  Z80.tStates + 19;
			},
		    function() { //index + opcode 183 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 184 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 185 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 186 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 187 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 188 CP ITH  
				Z80._r._cpA((Z80._r._IT >> 8));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 189 CP ITL
				Z80._r._cpA((Z80._r._IT & 0xFF));
				Z80.tStates =  Z80.tStates + 8;
			},
			function() { //index + opcode 190 CP (IT + d)
				var addr = Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++]);
				Z80._r._cpA(memory[addr]);
				Z80.tStates =  Z80.tStates + 19;
			},
		    function() { //index + opcode 191 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 192 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 193 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 194 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 195 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 196 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 197 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 198 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 199 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 200 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 201 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 202 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 203 // PREFIX CB (yep, again)
				// Get index address (offset byte first)
				var addr = (Z80._r._IT + Z80._r._signedByte(memory[Z80._r._PC++])) & 0xFFFF;
				var opcode = memory[Z80._r._PC++];
				Z80.execute_index_cb(opcode, addr);
			},
		    function() { //index + opcode 204 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 205 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 206 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 207 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 208 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 209 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 210 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 211 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 212 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 213 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 214 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 215 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 216 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 217 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 218 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 219 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 220 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 221 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 222 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 223 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 224 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 225 POP IT
				Z80._r._IT = Z80._r._pop();
				Z80.tStates =  Z80.tStates + 14;
			},
		    function() { //index + opcode 226 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 227 EX (SP),IT 
				var temp = Z80._r._IT;
				Z80._r._IT = (memory[Z80._r._SP]  | (memory[Z80._r._SP + 1] << 8));
				memory[Z80._r._SP] = temp & 0xFF;
				memory[Z80._r._SP + 1] = temp >> 8;
				Z80.tStates =  Z80.tStates + 23;
			},
		    function() { //index + opcode 228 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 229 PUSH IT 
				Z80._r._SP = Z80._r._SP - 2;
				memory[Z80._r._SP] = Z80._r._IT & 0xFF;
				memory[Z80._r._SP + 1] = Z80._r._IT >> 8;
				Z80.tStates =  Z80.tStates + 15;
			},
		    function() { //index + opcode 230 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 231 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
		    function() { //index + opcode 232 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 233 JP (IT) 
				Z80._r._PC = Z80._r._IT;
				Z80.tStates =  Z80.tStates + 8;
			},
		    function() { //index + opcode 234 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 235 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 236 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 237 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 238 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 239 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 240 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 241 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 242 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 243 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 244 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 245 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 246 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 247 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 248 // NOP
				Z80._r._PC--; Z80._r._R = Z80._r._R + (-1);
				Z80.tStates =  Z80.tStates + 4;
			},
			function() { //index + opcode 249 LD SP,IT
				Z80._r._SP = Z80._r._IT;
				Z80.tStates =  Z80.tStates + 10;
			},
		//index + opcode 250 
			function() { 
			},
		//index + opcode 251 
			function() { 
			},
		//index + opcode 252 
			function() { 
			},
		//index + opcode 253 
			function() { 
			},
		//index + opcode 254 
			function() { 
			},
		//index + opcode 255 
			function() { 
			},
		
		],
	
	_index_cb_op: [
	
		function(value) { //index + cb opcode 0 RLC B 
			Z80._r._B = Z80._r._rlc(memory[value]);
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 1 RLC C 
			Z80._r._C = Z80._r._rlc(memory[value]);
			memory[value] = Z80._r._C;			
		},
		function(value) { //index + cb opcode 2 RLC D 
			Z80._r._Dset(Z80._r._rlc(memory[value]));
			memory[value] = Z80._r._Dget();	
		},
		function(value) { //index + cb opcode 3 RLC E 
			Z80._r._Eset(Z80._r._rlc(memory[value]));
			memory[value] = Z80._r._Eget();	
		},
		function(value) { //index + cb opcode 4 RLC H 
			Z80._r._Hset(Z80._r._rlc(memory[value]));
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 5 RLC L 
			Z80._r._Lset(Z80._r._rlc(memory[value]));
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 6 RLC (HL) 
			memory[value] = Z80._r._rlc(memory[value]);
		},
		function(value) { //index + cb opcode 7 RLC A 
			Z80._r._A = Z80._r._rlc(memory[value]);
			memory[value] = Z80._r._A;	
		},
		function(value) { //index + cb opcode 8 RRC B 
			Z80._r._B = Z80._r._rrc(memory[value]);
			memory[value] = Z80._r._B;			
		},
		function(value) { //index + cb opcode 9 RRC C 
			Z80._r._C = Z80._r._rrc(memory[value]);
			memory[value] = Z80._r._C;	
		},
		function(value) { //index + cb opcode 10 RRC D 
			Z80._r._Dset(Z80._r._rrc(memory[value]));
			memory[value] = Z80._r._Dget();	
		},
		function(value) { //index + cb opcode 11 RRC E
			Z80._r._Eset(Z80._r._rrc(memory[value]));
			memory[value] = Z80._r._Eget();	
		},
		function(value) { //index + cb opcode 12 RRC H 
			Z80._r._Hset(Z80._r._rrc(memory[value]));
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 13 RRC L 
			Z80._r._Lset(Z80._r._rrc(memory[value]));
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 14 RRC (HL) 
			memory[value] = Z80._r._rrc(memory[value]);
		},
		function(value) { //index + cb opcode 15 RRC A 
			Z80._r._A = Z80._r._rrc(memory[value]);
			memory[value] = Z80._r._A;	
		},
		function(value) { //index + cb opcode 16 RL B 
			Z80._r._B = Z80._r._rl(memory[value]);
			memory[value] = Z80._r._B;	
		},
		function(value) { //index + cb opcode 17 RL C 
			Z80._r._C = Z80._r._rl(memory[value]);
			memory[value] = Z80._r._C;	
		},
		function(value) { //index + cb opcode 18 RL D 
			Z80._r._Dset(Z80._r._rl(memory[value]));
			memory[value] = Z80._r._Dget();	
		},
		function(value) { //index + cb opcode 19 RL E 
			Z80._r._Eset(Z80._r._rl(memory[value]));
			memory[value] = Z80._r._Eget();	
		},
		function(value) { //index + cb opcode 20 RL H 
			Z80._r._Hset(Z80._r._rl(memory[value]));
			memory[value] = Z80._r._Hget();	
		},
		function(value) { //index + cb opcode 21 RL L 
			Z80._r._Lset(Z80._r._rl(memory[value]));
			memory[value] = Z80._r._Lget();	
		},
		function(value) { //index + cb opcode 22 RL (HL) 
			memory[value] = Z80._r._rl(memory[value]);
		},
		function(value) { //index + cb opcode 23 RL A 
			Z80._r._A = Z80._r._rl(memory[value]);
			memory[value] = Z80._r._A;	
		},
		function(value) { //index + cb opcode 24 RR B 
			Z80._r._B = Z80._r._rr(memory[value]);
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 25 RR C 
			Z80._r._C = Z80._r._rr(memory[value]);
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 26 RR D 
			Z80._r._Dset(Z80._r._rr(memory[value]));
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 27 RR E 
			Z80._r._Eset(Z80._r._rr(memory[value]));
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 28 RR H 
			Z80._r._Hset(Z80._r._rr(memory[value]));
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 29 RR L 
			Z80._r._Lset(Z80._r._rr(memory[value]));
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 30 RR (HL) 
			memory[value] = Z80._r._rr(memory[value]);
		},
		function(value) { //index + cb opcode 31 RR A 
			Z80._r._A = Z80._r._rr(memory[value]);
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 32 SLA B 
			Z80._r._B = Z80._r._sla(memory[value]);
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 33 SLA C 
			Z80._r._C = Z80._r._sla(memory[value]);
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 34 SLA D 
			Z80._r._Dset(Z80._r._sla(memory[value]));
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 35 SLA E 
			Z80._r._Eset(Z80._r._sla(memory[value]));
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 36 SLA H 
			Z80._r._Hset(Z80._r._sla(memory[value]));
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 37 SLA L 
			Z80._r._Lset(Z80._r._sla(memory[value]));
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 38 SLA (HL) 
			memory[value] = Z80._r._sla(memory[value]);
		},
		function(value) { //index + cb opcode 39 SLA A 
			Z80._r._A = Z80._r._sla(memory[value]);
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 40 SRA B 
			Z80._r._B = Z80._r._sra(memory[value]);
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 41 SRA C 
			Z80._r._C = Z80._r._sra(memory[value]);
			memory[value] = Z80._r._C;			
		},
		function(value) { //index + cb opcode 42 SRA D 
			Z80._r._Dset(Z80._r._sra(memory[value]));
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 43 SRA E 
			Z80._r._Eset(Z80._r._sra(memory[value]));
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 44 SRA H 
			Z80._r._Hset(Z80._r._sra(memory[value]));
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 45 SRA L
			Z80._r._Lset(Z80._r._sra(memory[value]));
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 46 SRA (HL) 
			memory[value] = Z80._r._sra(memory[value]);
		},
		function(value) { //index + cb opcode 47 SRA A 
			Z80._r._A = Z80._r._sra(memory[value]);
			memory[value] = Z80._r._A;		
		},
		function(value) { //index + cb opcode 48 SLS B 
			Z80._r._B = Z80._r._sls(memory[value]);
			memory[value] = Z80._r._B;	
		},
		function(value) { //index + cb opcode 49 SLS C 
			Z80._r._C = Z80._r._sls(memory[value]);
			memory[value] = Z80._r._C;			
		},
		function(value) { //index + cb opcode 50 SLS D 
			Z80._r._Dset(Z80._r._sls(memory[value]));
			memory[value] = Z80._r._Dget();	
		},
		function(value) { //index + cb opcode 51 SLS E 
			Z80._r._Eset(Z80._r._sls(memory[value]));
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 52 SLS H 
			Z80._r._Hset(Z80._r._sls(memory[value]));
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 53 SLS L 
			Z80._r._Lset(Z80._r._sls(memory[value]));
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 54 SLS (HL)
			memory[value] = Z80._r._sls(memory[value]);
		},
		function(value) { //index + cb opcode 55 SLS A 
			Z80._r._A = Z80._r._sls(memory[value]);
			memory[value] = Z80._r._A;				
		},
		function(value) { //index + cb opcode 56 SRL B 
			Z80._r._B = Z80._r._srl(memory[value]);
			memory[value] = Z80._r._B;	
		},
		function(value) { //index + cb opcode 57 SRL C 
			Z80._r._C = Z80._r._srl(memory[value]);
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 58 SRL D 
			Z80._r._Dset(Z80._r._srl(memory[value]));
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 59 SRL E
			Z80._r._Eset(Z80._r._srl(memory[value]));
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 60 SRL H 
			Z80._r._Hset(Z80._r._srl(memory[value]));
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 61 SRL L 
			Z80._r._Lset(Z80._r._srl(memory[value]));
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 62 SRL (HL) 
			memory[value] = Z80._r._srl(memory[value]);
		},
		function(value) { //index + cb opcode 63 SRL A 
			Z80._r._A = Z80._r._srl(memory[value]);
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 64 BIT 0,B 
			Z80._r._bit(0x01,memory[value]);
		},
		function(value) { //index + cb opcode 65 BIT 0,B 
			Z80._r._bit(0x01,memory[value]);
		},
		function(value) { //index + cb opcode 66 BIT 0,B 
			Z80._r._bit(0x01,memory[value]);
		},
		function(value) { //index + cb opcode 67 BIT 0,B 
			Z80._r._bit(0x01,memory[value]);
		},
		function(value) { //index + cb opcode 68 BIT 0,B 
			Z80._r._bit(0x01,memory[value]);
		},
		function(value) { //index + cb opcode 69 BIT 0,B 
			Z80._r._bit(0x01,memory[value]);
		},
		function(value) { //index + cb opcode 70 BIT 0,B 
			Z80._r._bit(0x01,memory[value]);
		},
		function(value) { //index + cb opcode 71 BIT 0,B 
			Z80._r._bit(0x01,memory[value]);
		},
		function(value) { //index + cb opcode 72 BIT 1,B
			Z80._r._bit(0x02,memory[value]);
		},
		function(value) { //index + cb opcode 73 BIT 1,B
			Z80._r._bit(0x02,memory[value]);
		},
		function(value) { //index + cb opcode 74 BIT 1,B
			Z80._r._bit(0x02,memory[value]);
		},
		function(value) { //index + cb opcode 75 BIT 1,B
			Z80._r._bit(0x02,memory[value]);
		},
		function(value) { //index + cb opcode 76 BIT 1,B
			Z80._r._bit(0x02,memory[value]);
		},
		function(value) { //index + cb opcode 77 BIT 1,B
			Z80._r._bit(0x02,memory[value]);
		},
		function(value) { //index + cb opcode 78 BIT 1,B
			Z80._r._bit(0x02,memory[value]);
		},
		function(value) { //index + cb opcode 79 BIT 1,B
			Z80._r._bit(0x02,memory[value]);
		},
		function(value) { //index + cb opcode 80 BIT 2,B 
			Z80._r._bit(0x04,memory[value]);
		},
		function(value) { //index + cb opcode 81 BIT 2,B 
			Z80._r._bit(0x04,memory[value]);
		},
		function(value) { //index + cb opcode 82 BIT 2,B 
			Z80._r._bit(0x04,memory[value]);
		},
		function(value) { //index + cb opcode 83 BIT 2,B 
			Z80._r._bit(0x04,memory[value]);
		},
		function(value) { //index + cb opcode 84 BIT 2,B 
			Z80._r._bit(0x04,memory[value]);
		},
		function(value) { //index + cb opcode 85 BIT 2,B 
			Z80._r._bit(0x04,memory[value]);	
		},
		function(value) { //index + cb opcode 86 BIT 2,B 
			Z80._r._bit(0x04,memory[value]);	
		},
		function(value) { //index + cb opcode 87 BIT 2,B 
			Z80._r._bit(0x04,memory[value]);	
		},
		function(value) { //index + cb opcode 88 BIT 3,B 
			Z80._r._bit(0x08,memory[value]);
		},
		function(value) { //index + cb opcode 89 BIT 3,B 
			Z80._r._bit(0x08,memory[value]);
		},
		function(value) { //index + cb opcode 90 BIT 3,B 
			Z80._r._bit(0x08,memory[value]);
		},
		function(value) { //index + cb opcode 91 BIT 3,B 
			Z80._r._bit(0x08,memory[value]);
		},
		function(value) { //index + cb opcode 92 BIT 3,B 
			Z80._r._bit(0x08,memory[value]);
		},
		function(value) { //index + cb opcode 93 BIT 3,B 
			Z80._r._bit(0x08,memory[value]);
		},
		function(value) { //index + cb opcode 94 BIT 3,B 
			Z80._r._bit(0x08,memory[value]);
		},
		function(value) { //index + cb opcode 95 BIT 3,B 
			Z80._r._bit(0x08,memory[value]);
		},
		function(value) { //index + cb opcode 96 BIT 4,B 
			Z80._r._bit(0x10,memory[value]);
		},
		function(value) { //index + cb opcode 97 BIT 4,B 
			Z80._r._bit(0x10,memory[value]);
		},
		function(value) { //index + cb opcode 98 BIT 4,B 
			Z80._r._bit(0x10,memory[value]);
		},
		function(value) { //index + cb opcode 99 BIT 4,B 
			Z80._r._bit(0x10,memory[value]);
		},
		function(value) { //index + cb opcode 100 BIT 4,B 
			Z80._r._bit(0x10,memory[value]);
		},
		function(value) { //index + cb opcode 101 BIT 4,B 
			Z80._r._bit(0x10,memory[value]);
		},
		function(value) { //index + cb opcode 102 BIT 4,B 
			Z80._r._bit(0x10,memory[value]);
		},
		function(value) { //index + cb opcode 103 BIT 4,B 
			Z80._r._bit(0x10,memory[value]);
		},
		function(value) { //index + cb opcode 104 BIT 5,B
			Z80._r._bit(0x20,memory[value]);
		},
		function(value) { //index + cb opcode 105 BIT 5,B
			Z80._r._bit(0x20,memory[value]);
		},
		function(value) { //index + cb opcode 106 BIT 5,B
			Z80._r._bit(0x20,memory[value]);
		},
		function(value) { //index + cb opcode 107 BIT 5,B
			Z80._r._bit(0x20,memory[value]);
		},
		function(value) { //index + cb opcode 108 BIT 5,B
			Z80._r._bit(0x20,memory[value]);
		},
		function(value) { //index + cb opcode 109 BIT 5,B
			Z80._r._bit(0x20,memory[value]);
		},
		function(value) { //index + cb opcode 110 BIT 5,B
			Z80._r._bit(0x20,memory[value]);
		},
		function(value) { //index + cb opcode 111 BIT 5,B
			Z80._r._bit(0x20,memory[value]);
		},
		function(value) { //index + cb opcode 112 BIT 6,B 
			Z80._r._bit(0x40,memory[value]);
		},
		function(value) { //index + cb opcode 113 BIT 6,B 
			Z80._r._bit(0x40,memory[value]);
		},
		function(value) { //index + cb opcode 114 BIT 6,B 
			Z80._r._bit(0x40,memory[value]);
		},
		function(value) { //index + cb opcode 115 BIT 6,B 
			Z80._r._bit(0x40,memory[value]);
		},
		function(value) { //index + cb opcode 116 BIT 6,B 
			Z80._r._bit(0x40,memory[value]);
		},
		function(value) { //index + cb opcode 117 BIT 6,B 
			Z80._r._bit(0x40,memory[value]);
		},
		function(value) { //index + cb opcode 118 BIT 6,B 
			Z80._r._bit(0x40,memory[value]);
		},
		function(value) { //index + cb opcode 119 BIT 6,B 
			Z80._r._bit(0x40,memory[value]);
		},
		function(value) { //index + cb opcode 120 BIT 7,B 
			Z80._r._bit(0x80,memory[value]);
		},
		function(value) { //index + cb opcode 121 BIT 7,B 
			Z80._r._bit(0x80,memory[value]);
		},
		function(value) { //index + cb opcode 122 BIT 7,B 
			Z80._r._bit(0x80,memory[value]);
		},
		function(value) { //index + cb opcode 123 BIT 7,B 
			Z80._r._bit(0x80,memory[value]);
		},
		function(value) { //index + cb opcode 124 BIT 7,B 
			Z80._r._bit(0x80,memory[value]);
		},
		function(value) { //index + cb opcode 125 BIT 7,B 
			Z80._r._bit(0x80,memory[value]);
		},
		function(value) { //index + cb opcode 126 BIT 7,B 
			Z80._r._bit(0x80,memory[value]);
		},
		function(value) { //index + cb opcode 127 BIT 7,B 
			Z80._r._bit(0x80,memory[value]);
		},
		function(value) { //index + cb opcode 128 RES 0,B 
			Z80._r._B = memory[value] & ~0x01;
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 129 RES 0,C 
			Z80._r._C = memory[value] & ~0x01;
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 130 RES 0,D 
			Z80._r._Dset(memory[value] & ~0x01);
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 131 RES 0,E 
			Z80._r._Eset(memory[value] & ~0x01);
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 132 RES 0,H
			Z80._r._Hset(memory[value] & ~0x01);
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 133 RES 0,L
			Z80._r._Lset(memory[value] & ~0x01);
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 134 RES 0,(HL)
			memory[value] = memory[value] & ~0x01;
		},
		function(value) { //index + cb opcode 135 RES 0,A
			Z80._r._A = memory[value] & ~0x01;
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 136 RES 1,B 
			Z80._r._B = memory[value] & ~0x02;
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 137 RES 1,C 
			Z80._r._C = memory[value] & ~0x02;
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 138 RES 1,D 
			Z80._r._Dset(memory[value] & ~0x02);
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 139 RES 1,E 
			Z80._r._Eset(memory[value] & ~0x02);
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 140 RES 1,H 
			Z80._r._Hset(memory[value] & ~0x02);
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 141 RES 1,L
			Z80._r._Lset(memory[value] & ~0x02);
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 142 RES 1,(HL) 
			memory[value] = memory[value] & ~0x02;
		},
		function(value) { //index + cb opcode 143 RES 1,A 
			Z80._r._A = memory[value] & ~0x02;
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 144 RES 2,B 
			Z80._r._B = memory[value] & ~0x04;
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 145 RES 2,C 
			Z80._r._C = memory[value] & ~0x04;
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 146 RES 2,D 
			Z80._r._Dset(memory[value] & ~0x04);
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 147 RES 2,E 
			Z80._r._Eset(memory[value] & ~0x04);
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 148 RES 2,H
			Z80._r._Hset(memory[value] & ~0x04);
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 149 RES 2,L
			Z80._r._Lset(memory[value] & ~0x04);
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 150 RES 2,(HL)
			memory[value] = memory[value] & ~0x04;
		},
		function(value) { //index + cb opcode 151 RES 2,A
			Z80._r._A = memory[value] & ~0x04;
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 152 RES 3,B
			Z80._r._B = memory[value] & ~0x08;
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 153 RES 3,C
			Z80._r._C = memory[value] & ~0x08;
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 154 RES 3,D
			Z80._r._Dset(memory[value] & ~0x08);
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 155 RES 3,E
			Z80._r._Eset(memory[value] & ~0x08);
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 156 RES 3,H
			Z80._r._Hset(memory[value] & ~0x08);
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 157 RES 3,L
			Z80._r._Lset(memory[value] & ~0x08);
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 158 RES 3,(HL)
			memory[value] = memory[value] & ~0x08;
		},
		function(value) { //index + cb opcode 159 RES 3,A
			Z80._r._A = memory[value] & ~0x08;
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 160 RES 4,B 
			Z80._r._B = memory[value] & ~0x10;
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 161 RES 4,C
			Z80._r._C = memory[value] & ~0x10;
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 162 RES 4,D
			Z80._r._Dset(memory[value] & ~0x10);
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 163 RES 4,E
			Z80._r._Eset(memory[value] & ~0x10);
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 164 RES 4,H
			Z80._r._Hset(memory[value] & ~0x10);
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 165 RES 4,L
			Z80._r._Lset(memory[value] & ~0x10);
			memory[value] = Z80._r._Lget();	
		},
		function(value) { //index + cb opcode 166 RES 4,(HL)
			memory[value] = memory[value] & ~0x10;
		},
		function(value) { //index + cb opcode 167 RES 4,A
			Z80._r._A = memory[value] & ~0x10;
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 168 RES 5,B
			Z80._r._B = memory[value] & ~0x20;
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 169 RES 5,C
			Z80._r._C = memory[value] & ~0x20;
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 170 RES 5,D
			Z80._r._Dset(memory[value] & ~0x20);
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 171 RES 5,E
			Z80._r._Eset(memory[value] & ~0x20);
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 172 RES 5,H
			Z80._r._Hset(memory[value] & ~0x20);
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 173 RES 5,L
			Z80._r._Lset(memory[value] & ~0x20);
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 174 RES 5,(HL)
			memory[value] = memory[value] & ~0x20;
		},
		function(value) { //index + cb opcode 175 RES 5,A
			Z80._r._A = memory[value] & ~0x20;
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 176 RES 6,B 
			Z80._r._B = memory[value] & ~0x40;
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 177 RES 6,C
			Z80._r._C = memory[value] & ~0x40;
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 178 RES 6,D
			Z80._r._Dset(memory[value] & ~0x40);
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 179 RES 6,E
			Z80._r._Eset(memory[value] & ~0x40);
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 180 RES 6,H
			Z80._r._Hset(memory[value] & ~0x40);
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 181 RES 6,L
			Z80._r._Lset(memory[value] & ~0x40);
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 182 RES 6,(HL)
			memory[value] = memory[value] & ~0x40;
		},
		function(value) { //index + cb opcode 183 RES 6,A
			Z80._r._A = memory[value] & ~0x40;
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 184 RES 7,B 
			Z80._r._B = memory[value] & ~0x80;
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 185 RES 7,C
			Z80._r._C = memory[value] & ~0x80;
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 186 RES 7,D
			Z80._r._Dset(memory[value] & ~0x80);
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 187 RES 7,E
			Z80._r._Eset(memory[value] & ~0x80);
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 188 RES 7,H 
			Z80._r._Hset(memory[value] & ~0x80);
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 189 RES 7,L
			Z80._r._Lset(memory[value] & ~0x80);
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 190 RES 7,(HL) 
			memory[value] = memory[value] & ~0x80;
		},
		function(value) { //index + cb opcode 191 RES 7,A
			Z80._r._A = memory[value] & ~0x80;
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 192 SET 0,B 
			Z80._r._B = memory[value] | 0x01;
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 193 SET 0,C
			Z80._r._C = memory[value] | 0x01;
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 194 SET 0,D
			Z80._r._Dset(memory[value] | 0x01);
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 195 SET 0,E
			Z80._r._Eset(memory[value] | 0x01);
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 196 SET 0,H
			Z80._r._Hset(memory[value] | 0x01);
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 197 SET 0,L
			Z80._r._Lset(memory[value] | 0x01);
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 198 SET 0,(HL)
			memory[value] = memory[value] | 0x01;
		},
		function(value) { //index + cb opcode 199 SET 0,A
			Z80._r._A = memory[value] | 0x01;
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 200 SET 1,B 
			Z80._r._B = memory[value] | 0x02;
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 201 SET 1,C
			Z80._r._C = memory[value] | 0x02;
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 202 SET 1,D
			Z80._r._Dset(memory[value] | 0x02);
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 203 SET 1,E
			Z80._r._Eset(memory[value] | 0x02);
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 204 SET 1,H
			Z80._r._Hset(memory[value] | 0x02);
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 205 SET 1,L
			Z80._r._Lset(memory[value] | 0x02);
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 206 SET 1,(HL)
			memory[value] = memory[value] | 0x02;
		},
		function(value) { //index + cb opcode 207 SET 1,A
			Z80._r._A = memory[value] | 0x02;
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 208 SET 2,B 
			Z80._r._B = memory[value] | 0x04;
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 209 SET 2,C
			Z80._r._C = memory[value] | 0x04;
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 210 SET 2,D
			Z80._r._Dset(memory[value] | 0x04);
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 211 SET 2,E
			Z80._r._Eset(memory[value] | 0x04);
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 212 SET 2,H
			Z80._r._Hset(memory[value] | 0x04);
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 213 SET 2,L
			Z80._r._Lset(memory[value] | 0x04);
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 214 SET 2,(HL)
			memory[value] = memory[value] | 0x04;
		},
		function(value) { //index + cb opcode 215 SET 2,A
			Z80._r._A = memory[value] | 0x04;
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 216 SET 3,B 
			Z80._r._B = memory[value] | 0x08;
			memory[value] = Z80._r._8;
		},
		function(value) { //index + cb opcode 217 SET 3,C
			Z80._r._C = memory[value] | 0x08;
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 218 SET 3,D
			Z80._r._Dset(memory[value] | 0x08);
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 219 SET 3,E
			Z80._r._Eset(memory[value] | 0x08);
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 220 SET 3,H
			Z80._r._Hset(memory[value] | 0x08);
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 221 SET 3,L
			Z80._r._Lset(memory[value] | 0x08);
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 222 SET 3,(HL)
			memory[value] = memory[value] | 0x08;
		},
		function(value) { //index + cb opcode 223 SET 3,A
			Z80._r._A = memory[value] | 0x08;
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 224 SET 4,B 
			Z80._r._B = memory[value] | 0x10;
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 225 SET 4,C
			Z80._r._C = memory[value] | 0x10;
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 226 SET 4,D
			Z80._r._Dset(memory[value] | 0x10);
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 227 SET 4,E
			Z80._r._Eset(memory[value] | 0x10);
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 228 SET 4,H
			Z80._r._Hset(memory[value] | 0x10);
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 229 SET 4,L
			Z80._r._Lset(memory[value] | 0x10);
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 230 SET 4,(HL)
			memory[value] = memory[value] | 0x10;
		},
		function(value) { //index + cb opcode 231 SET 4,A
			Z80._r._A = memory[value] | 0x10;
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 232 SET 5,B 
			Z80._r._B = memory[value] | 0x20;
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 233 SET 5,C
			Z80._r._C = memory[value] | 0x20;
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 234 SET 5,D
			Z80._r._Dset(memory[value] | 0x20);
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 235 SET 5,E
			Z80._r._Eset(memory[value] | 0x20);
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 236 SET 5,H
			Z80._r._Hset(memory[value] | 0x20);
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 237 SET 5,L
			Z80._r._Lset(memory[value] | 0x20);
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 238 SET 5,(HL)
			memory[value] = memory[value] | 0x20;
		},
		function(value) { //index + cb opcode 239 SET 5,A
			Z80._r._A = memory[value] | 0x20;
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 240 SET 6,B 
			Z80._r._B = memory[value] | 0x40;
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 241 SET 6,C
			Z80._r._C = memory[value] | 0x40;
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 242 SET 6,D
			Z80._r._Dset(memory[value] | 0x40);
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 243 SET 6,E
			Z80._r._Eset(memory[value] | 0x40);
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 244 SET 6,H
			Z80._r._Hset(memory[value] | 0x40);
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 245 SET 6,L
			Z80._r._Lset(memory[value] | 0x40);
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 246 SET 6,(HL)
			memory[value] = memory[value] | 0x40;
		},
		function(value) { //index + cb opcode 247 SET 6,A
			Z80._r._A = memory[value] | 0x40;
			memory[value] = Z80._r._A;
		},
		function(value) { //index + cb opcode 248 SET 7,B 
			Z80._r._B = memory[value] | 0x80;
			memory[value] = Z80._r._B;
		},
		function(value) { //index + cb opcode 249 SET 7,C
			Z80._r._C = memory[value] | 0x80;
			memory[value] = Z80._r._C;
		},
		function(value) { //index + cb opcode 250 SET 7,D
			Z80._r._Dset(memory[value] | 0x80);
			memory[value] = Z80._r._Dget();
		},
		function(value) { //index + cb opcode 251 SET 7,E
			Z80._r._Eset(memory[value] | 0x80);
			memory[value] = Z80._r._Eget();
		},
		function(value) { //index + cb opcode 252 SET 7,H
			Z80._r._Hset(memory[value] | 0x80);
			memory[value] = Z80._r._Hget();
		},
		function(value) { //index + cb opcode 253 SET 7,L
			Z80._r._Lset(memory[value] | 0x80);
			memory[value] = Z80._r._Lget();
		},
		function(value) { //index + cb opcode 254 SET 7,(HL)
			memory[value] = memory[value] | 0x80;
		},
		function(value) { //index + cb opcode 255 SET 7,A
			Z80._r._A = memory[value] | 0x80;
			memory[value] = Z80._r._A;
		},
		],
		
	setBorder: function() {
		
		// ToDo
		
	},	
			
	INT: function() {
		
		ULA.updateScreen();
		
		if (ULA.audioReady) {
			ULA.audioBufNumb = ULA.audioBufNumb + 1;
			for(var i = ULA.audioWavePtr; i < ULA.WAV_BUFFER_SIZE; i++){
				ULA.audioWaveOut[i] = ULA.audioWaveOut[ULA.audioWavePtr - 1];
				};
			ULA.audioWaveOutWrite();
			if (ULA.audioBufNumb >= ULA.NUM_WAV_BUFFERS) ULA.audioBufNumb = 0;	
			ULA.audioWavePtr = 0;	
			};
		
		if (!Z80._r._IFF1) return 0;
		if ( (Z80._r._IM == 0) || (Z80._r._IM == 1) ){
			Z80._r._push(Z80._r._PC);
			Z80._r._IFF1 = 0;
			Z80._r._IFF2 = 0;
			Z80._r._PC = 56;
			return 13;
		};
		if (Z80._r._IM == 2) {
			var addr = (Z80._r._I << 8) | 0xFF;
			var temp = memory[addr++];
			temp = temp | ((memory[addr] & 0xFFFF) << 8);
			Z80._r._push(Z80._r._PC);
			Z80._r._PC = temp;
			Z80._r._IFF1 = 0;
			Z80._r._IFF2 = 0;
			return 19;			
		};
	},	
	
	execute: function() {
		var opcode = memory[Z80._r._PC++];	
		Z80._r._R++; // Refresh RAM // ToDo
		if (Z80._op[opcode]) Z80._op[opcode](); // If the function exists call it
			 else console.log("Opcode not found...");
				
	},
	
	execute_cb: function() {
		var opcode = memory[Z80._r._PC++];	
		Z80._r._R++; 
		if (Z80._cb_op[opcode]) Z80._cb_op[opcode](); // If the function exists call it
			 else console.log("CB + Opcode not found...");
	},
	
	execute_ed: function() {
		var opcode = memory[Z80._r._PC++];
		Z80._r._R++; 
		if (Z80._ed_op[opcode]) Z80._ed_op[opcode](); // If the function exists call it
			 else console.log("ED + Opcode not found...");	
	},
	

	execute_index: function() {  
		var opcode = memory[Z80._r._PC++];
		Z80._r._R++; 
		if (Z80._index_op[opcode]) Z80._index_op[opcode](); // If the function exists call it
			 else console.log("INDEX + Opcode not found...");	
	},
	
	execute_index_cb: function(op, value) {
		var opcode = op;
		if (Z80._index_cb_op[opcode]){
			 Z80._index_cb_op[opcode](value); // If the function exists call it
			 Z80.tStates = Z80.tStates + (((opcode & 0xC0) == 0x40) ? 20: 23); // Bit instructions = 20 tStates. Default tStates = 23
		 }  else console.log("INDEX + CB Opcode not found...");
	},
	
	showRegisters: function() {
		
		console.log("A:" + Z80._r._A + "\tB:" + Z80._r._B + "\tC:" + Z80._r._C + "\tD:" + Z80._r._Dget() + "\tE:" + Z80._r._Eget() + "\tH:" + Z80._r._Hget() + "\tL:" + Z80._r._Lget() + "\n");
		 
		console.log("fS:" + (Z80._r._fS ? 1 : 0) + "\tfZ:" + (Z80._r._fZ ? 1 : 0) + "\tf5:" + (Z80._r._f5 ? 1 : 0) + "\tfH:" + (Z80._r._fH ? 1 : 0) + "\tf3:" + (Z80._r._f3 ? 1 : 0) + "\tfP:" + (Z80._r._fP ? 1 : 0) + "\tfN:" + (Z80._r._fN ? 1 : 0) + "\tfC:" + (Z80._r._fC ? 1 : 0) + "\n");
		
		console.log("BC:" + Z80._r._BCget() + "\tDE:" + Z80._r._DE + "\tHL:" + Z80._r._HL + "\n");
		
		console.log("_AF_:" + Z80._r._AF_ + "\t_HL_:" + Z80._r._HL_ + "\tBC:" + Z80._r._BC_ + "\t_DE_:" + Z80._r._DE_ + "\n");
		
		console.log("_PC:" + Z80._r._PC +  "\t_SP:" + Z80._r._SP + "\n");
		
		console.log("_IX:" + Z80._r._IX + "\t_IY:" + Z80._r._IY + "\t_IT:" + Z80._r._IT + "\n");
		
		console.log("_I:" + Z80._r._I + "\t_R:" + Z80._r._R + "\t_R7:" + Z80._r._R7 + "\n");
		
		console.log("_IFF1:" + Z80._r._IFF1 + "\t_IFF2:" + Z80._r._IFF2 + "\t_IM:" + Z80._r._IM + "\n");
		
		console.log("tStates:" + Z80.tStates + "\n");		
	},
	
	
	reset: function() { // Reset all registers to initial state
			
			Z80._r._A = Z80._r._B = Z80._r._C = Z80._r._DE = Z80._r._HL = Z80._r._fS = Z80._r._fZ = Z80._r._f5 = Z80._r._fH = Z80._r._f3 = Z80._r._fP = Z80._r._fN = Z80._r._fC = Z80._r._AF_ =  Z80._r._BC_ = Z80._r._DE_ = Z80._r._HL_ = Z80._r._I = Z80._r._R = Z80._r._R7 = Z80._r._IX = Z80._r._IY = Z80._r._IT = Z80._r._IFF1 = Z80._r._IFF2 = Z80._r._IM = Z80._r._SP = Z80._r._PC = 0;
		
			Z80._parity = [];
			Z80._r._halted = false;
			memory = bck_memory;
			Z80.tStates = 0;	
	},
	
	
	mainloop: function() {
		var tempBrowserRefresh = t = 0; 
		var tempStatesAudio = 0;		
		while (Z80.isRunning) {

			if (Z80.tStates >= 0) {
					/* Here we are going to paint a complete frame and then an interruption must be call */
					Z80.tStates = Z80.tStates - (Z80.tStatesXinterrupt - Z80.INT());
					while(true) { // In case the simulation runs too fast we apply a delay
						Z80.now = Date.now();
						Z80.delta = Z80.now - Z80.then;
						if (Z80.delta >= Z80.interval) break; 
					};
					Z80.then = Date.now();
					break;
					};
			if (tempBrowserRefresh < 10000) { 
					tempStatesAudio = t = Z80.tStates;
					Z80.execute();
					ULA.addSoundWave(Z80.tStates - tempStatesAudio); 
					tempBrowserRefresh = tempBrowserRefresh + ((t * (-1)) + Z80.tStates);
			} else { 
				break; // After 10000 states allow refresh the browser...
				};		
			
		  };
		
		  setTimeout(Z80.mainloop, 0);  // ...but calling the main loop again before.
			/* Browsers actually have a minimum timer interval which they can’t work any faster than. And that interval is not consistent between browsers.*/
	},
		
	start: function() {

		Z80.tStatesXinterrupt = ((clockFrequency * 1000000) / 50); // 50 Hz
		Z80.tStates = -Z80.tStatesXinterrupt;
		
		for(var i = 0; i < 256; i++){ // SetUp parity
			var p = true;
			for(var j = 0; j < 8; j++){
				if (( i & ( 1 << j )) != 0 ) p = !p;
				}
			Z80._r._parity[i] = p;				
		};
		
		
		if (!Z80.isRunning) {
			Z80.isRunning = 1;
			then = Date.now();
			Z80.mainloop();
		};
	},
	
}; 
