
function keyDown(evt) {
	evt.preventDefault(); evt.stopPropagation();
	switch(evt.keyCode) {
		case 49: ULA.pressKey(4,0x01,true); break; // Key 1
		case 50: ULA.pressKey(4,0x02,true); break; // Key 2
		case 51: ULA.pressKey(4,0x04,true); break; // Key 3
		case 52: ULA.pressKey(4,0x08,true); break; // Key 4
		case 53: ULA.pressKey(4,0x10,true); break; // Key 5
		case 54: ULA.pressKey(3,0x10,true); break; // Key 6
		case 55: ULA.pressKey(3,0x08,true); break; // Key 7
		case 56: ULA.pressKey(3,0x04,true); break; // Key 8
		case 57: ULA.pressKey(3,0x02,true); break; // Key 9
		case 48: ULA.pressKey(3,0x01,true); break; // Key 0
		
		case 81: ULA.pressKey(5,0x01,true); break; // Key Q	
		case 87: ULA.pressKey(5,0x02,true); break; // Key W
		case 69: ULA.pressKey(5,0x04,true); break; // Key E
		case 82: ULA.pressKey(5,0x08,true); break; // Key R
		case 84: ULA.pressKey(5,0x10,true); break; // Key T
		case 89: ULA.pressKey(2,0x10,true); break; // Key Y
		case 85: ULA.pressKey(2,0x08,true); break; // Key U
		case 73: ULA.pressKey(2,0x04,true); break; // Key I
		case 79: ULA.pressKey(2,0x02,true); break; // Key O
		case 80: ULA.pressKey(2,0x01,true); break; // Key P
		
		case 65: ULA.pressKey(6,0x01,true); break; // Key A
		case 83: ULA.pressKey(6,0x02,true); break; // Key S
		case 68: ULA.pressKey(6,0x04,true); break; // Key D
		case 70: ULA.pressKey(6,0x08,true); break; // Key F
		case 71: ULA.pressKey(6,0x10,true); break; // Key G
		case 72: ULA.pressKey(1,0x10,true); break; // Key H
		case 74: ULA.pressKey(1,0x08,true); break; // Key J
		case 75: ULA.pressKey(1,0x04,true); break; // Key K
		case 76: ULA.pressKey(1,0x02,true); break; // Key L
		case 13: ULA.pressKey(1,0x01,true); break; // Key ENTER
		
		case 16: ULA.pressKey(7,0x01,true); break; // Key CAPS SHIFT
		case 90: ULA.pressKey(7,0x02,true); break; // Key Z
		case 88: ULA.pressKey(7,0x04,true); break; // Key X
		case 67: ULA.pressKey(7,0x08,true); break; // Key C
		case 86: ULA.pressKey(7,0x10,true); break; // Key V
		case 66: ULA.pressKey(0,0x10,true); break; // Key B
		case 78: ULA.pressKey(0,0x08,true); break; // Key N
		case 77: ULA.pressKey(0,0x04,true); break; // Key M
		case 17: ULA.pressKey(0,0x02,true); break; // Key SYMBOL SHIFT
		case 32: ULA.pressKey(0,0x01,true); break; // Key SPACE
		
		// Misc
		
		case  8: ULA.pressKey(0,0x01,true); ULA.pressKey(4,0x01,true); break; // Delete = CAPS + 0
		case 37: ULA.pressKey(0,0x01,true); ULA.pressKey(3,0x10,true); break; // Left = CAPS + 5
		case 38: ULA.pressKey(0,0x01,true); ULA.pressKey(4,0x08,true); break; // Up = CAPS + 7
		case 39: ULA.pressKey(0,0x01,true); ULA.pressKey(4,0x04,true); break; // Right = CAPS + 8
		case 40: ULA.pressKey(0,0x01,true); ULA.pressKey(4,0x10,true); break; // Down = CAPS + 6


	};
}

function keyPress(evt) {
	
}

function keyUp(evt) {
	evt.preventDefault(); evt.stopPropagation();
	switch(evt.keyCode) {
		case 49: ULA.pressKey(4,0x01,false); break; // Key 1
		case 50: ULA.pressKey(4,0x02,false); break; // Key 2
		case 51: ULA.pressKey(4,0x04,false); break; // Key 3
		case 52: ULA.pressKey(4,0x08,false); break; // Key 4
		case 53: ULA.pressKey(4,0x10,false); break; // Key 5
		case 54: ULA.pressKey(3,0x10,false); break; // Key 6
		case 55: ULA.pressKey(3,0x08,false); break; // Key 7
		case 56: ULA.pressKey(3,0x04,false); break; // Key 8
		case 57: ULA.pressKey(3,0x02,false); break; // Key 9
		case 48: ULA.pressKey(3,0x01,false); break; // Key 0
		
		case 81: ULA.pressKey(5,0x01,false); break; // Key Q	
		case 87: ULA.pressKey(5,0x02,false); break; // Key W
		case 69: ULA.pressKey(5,0x04,false); break; // Key E
		case 82: ULA.pressKey(5,0x08,false); break; // Key R
		case 84: ULA.pressKey(5,0x10,false); break; // Key T
		case 89: ULA.pressKey(2,0x10,false); break; // Key Y
		case 85: ULA.pressKey(2,0x08,false); break; // Key U
		case 73: ULA.pressKey(2,0x04,false); break; // Key I
		case 79: ULA.pressKey(2,0x02,false); break; // Key O
		case 80: ULA.pressKey(2,0x01,false); break; // Key P
		
		case 65: ULA.pressKey(6,0x01,false); break; // Key A
		case 83: ULA.pressKey(6,0x02,false); break; // Key S
		case 68: ULA.pressKey(6,0x04,false); break; // Key D
		case 70: ULA.pressKey(6,0x08,false); break; // Key F
		case 71: ULA.pressKey(6,0x10,false); break; // Key G
		case 72: ULA.pressKey(1,0x10,false); break; // Key H
		case 74: ULA.pressKey(1,0x08,false); break; // Key J
		case 75: ULA.pressKey(1,0x04,false); break; // Key K
		case 76: ULA.pressKey(1,0x02,false); break; // Key L
		case 13: ULA.pressKey(1,0x01,false); break; // Key ENTER
		
		case 16: ULA.pressKey(7,0x01,false); break; // Key CAPS SHIFT
		case 90: ULA.pressKey(7,0x02,false); break; // Key Z
		case 88: ULA.pressKey(7,0x04,false); break; // Key X
		case 67: ULA.pressKey(7,0x08,false); break; // Key C
		case 86: ULA.pressKey(7,0x10,false); break; // Key V
		case 66: ULA.pressKey(0,0x10,false); break; // Key B
		case 78: ULA.pressKey(0,0x08,false); break; // Key N
		case 77: ULA.pressKey(0,0x04,false); break; // Key M
		case 17: ULA.pressKey(0,0x02,false); break; // Key SYMBOL SHIFT
		case 32: ULA.pressKey(0,0x01,false); break; // Key SPACE
		
		// Misc
		
		case  8: ULA.pressKey(0,0x01,false); ULA.pressKey(4,0x01,false); break; // Delete = CAPS + 0
		case 37: ULA.pressKey(0,0x01,false); ULA.pressKey(3,0x10,false); break; // Left = CAPS + 5
		case 38: ULA.pressKey(0,0x01,false); ULA.pressKey(4,0x08,false); break; // Up = CAPS + 7
		case 39: ULA.pressKey(0,0x01,false); ULA.pressKey(4,0x04,false); break; // Right = CAPS + 8
		case 40: ULA.pressKey(0,0x01,false); ULA.pressKey(4,0x10,false); break; // Down = CAPS + 6
	
	};
}

