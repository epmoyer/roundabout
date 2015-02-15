
// var UnimplementedChar = [0,0,0,-6,4,-6,4,0,0,0,4,-6,4,0,0,-6,0,0];
var UnimplementedChar =  [0,6,0,0,4,0,4,6,0,6,4,0,4,6,0,0,0,6];

var Points = {

	ASTEROIDS: [
		[-4,-2,-2,-4,0,-2,2,-4,4,-2,3,0,4,2,1,4,-2,4,-4,2,-4,-2],
		[-3,0,-4,-2,-2,-4,0,-3,2,-4,4,-2,2,-1,4,1,2,4,-1,3,-2,4,-4,2,-3,0],
		[-2,0,-4,-1,-1,-4,2,-4,4,-1,4,1,2,4,0,4,0,1,-2,4,-4,1,-2,0],
		[-1,-2,-2,-4,1,-4,4,-2,4,-1,1,0,4,2,2,4,1,3,-2,4,-4,1,-4,-2,-1,-2],
		//[-4,-2,-2,-4,2,-4,4,-2,4,2,2,4,-2,4,-4,2,-4,-2]
	],

	SHIP:   [6,0,-3,-3,-2,0,-3,3,6,0],
	FLAMES: [-2,0,-3,-1,-5,0,-3,1,-2,0],
	SHIPB:  [0,-6,1,-3,2,-4,3,2,0,1,-3,2,-2,-4,-1,-3,0,-6],
	
	SHIELD_TYPE: [0,-3,2,-2,6,-2,6,-6,4,-8,5,-9,8,-6,8,6,5,9,4,8,6,6,6,2,2,2,0,3,-1,2,1,1,6,1,6,-1,1,-1,-1,-2,0,-3],
	SHIELD_CORE: [-1,2,1,1,1,-1,-1,-2,-4,-2,-6,-1,-6,1,-4,2,-1,2],
	SHIELD_TYPE_SHORT: [1,0,1,-2,-1,-3,0,-4,2,-3,3,-1,6,-1,6,-4,5,-5,6,-6,8,-4,8,4,6,6,5,5,6,4,6,1,3,1,2,3,0,4,-1,3,1,2,1,0],
	SHIELD_CORE_SHORT: [1,-2,1,2,-1,3,-3,2,-3,-2,-1,-3,1,-2],

	WIDE_SHIP_FLAMES: [-2,0,-3,-2,-6,0,-3,2,-2,0],
	PICKUP: [4,0,2,-1,0,-3,-2,-1,-4,0,-2,1,0,3,2,1,4,0],
	WIDE_SHIP: [2,0,3,-1,3,-2,6,-2,6,-3,2,-3,0,-4,-2,-7,-1,-2,-2,-1,-1,0,-2,1,-1,2,-2,7,0,4,2,3,6,3,6,2,3,2,3,1,2,0],
    POINTY_SHIP: [3,0,5,-2,1,-1,2,-3,-3,-6,0,-3,-1,-1,-2,-1,-1,0,-2,1,-1,1,0,3,-3,6,2,3,1,1,5,2,3,0],
    STAR_WING: [7, 0,4,-2,2,-1,0,-2,1,-4,-1,-2,-1,7,-2,-1,-1,0,-2,1,-1,7,-1,2,1,4,0,2,2,1,4,2,7,0],
	BALL: [-1,3,1,3,3,1,3,-1,1,-3,-1,-3,-3,-1,-3,1,-1,3],
	ABSTRACT: [5,-1,5,1,2,2,2,-2,-2,2,-2,-2,-5,-1,-5,1,-2,2,2,2,-2,-2,-1,-5,1,-5,2,-2,-2,-2,-2,2,-1,5,1,5,2,2,2,-2,5,-1],

	UNIMPLEMENTED_CHAR: UnimplementedChar,
	ASCII: [
		[1,0,2,5,1.5,5,1.5,6,2.5,6,2.5,5,2,5,3,0,1,0],     // !
		UnimplementedChar,                                 // "
		[1,5,1,1,1,2,0,2,4,2,3,2,3,1,3,5,3,                // #
			4,4,4,0,4,1,4,1,5],
		[0,6,3,6,4,5,4,4,3,3,1,3,0,2,0,1,1,0,4,0,2,0,2,6], // $        
		[0,6,4,0,2,3,2,1,0,1,0,3,4,3,4,5,2,5,2,3,0,6],     // %  
		UnimplementedChar,                                 // &  
		[2,0,2,1,2,0],                                     // '  
		[4,6,3,6,2,5,2,1,3,0,4,0],                         // (  
		[1,0,2,0,3,1,3,5,2,6,1,6],                         // )  
		[0,1,2,3,2,1,2,3,4,1,2,3,4,3,2,3,4,5,2,3,          // *
			2,5,2,3,0,5,2,3,0,3],
		[2,5,2,1,2,3,0,3,4,3,2,3,2,5],                     // +  
		[2,5,1,6,2,5],                                     // ,  
		[1,3,3,3],                                         // -  
		[1.5,6,1.5,5,2.5,5,2.5,6,1.5,6],                   // .  
		[1,6,3,0,1,6],                                     // /  
		[0,0,0,6,4,6,4,0,0,0],                             // 0
		[2,0,2,6],                                         // 1
		[0,0,4,0,4,3,0,3,0,6,4,6],                         // 2
		[0,0,4,0,4,3,0,3,4,3,4,6,0,6],                     // 3
		[0,0,0,3,4,3,4,0,4,6],                             // 4
		[4,0,0,0,0,3,4,3,4,6,0,6],                         // 5
		[0,0,0,6,4,6,4,3,0,3],                             // 6
		[0,0,4,0,4,6],                                     // 7
		[0,3,4,3,4,6,0,6,0,0,4,0,4,3],                     // 8
		[4,3,0,3,0,0,4,0,4,6],                             // 9
		UnimplementedChar,                                 // :
		UnimplementedChar,                                 // ; 
		[4,1,0,3,4,5,0,3,4,1],                             // <  
		UnimplementedChar,                                 // = 
		[0,1,4,3,0,5,4,3,0,1],                             // >  
		[0,2,0,1,1,0,3,0,4,1,4,2,2,3,2,6,2,3,4,2,4,
			1,3,0,1,0,0,1,0,2],                            // ?  
		// [3,4,3,2,1,2,1,4,4,4,4,0,0,0,0,6,4,6],             // @  
		[3,4,3,2,1,2,1,4,4,4,4,2,3,1,1,1,0,2,0,4,1,5,3,5], // @
		[0,6,0,2,2,0,4,2,4,4,0,4,4,4,4,6],                 // A
		[0,3,0,6,2,6,3,5,3,4,2,3,0,3,0,0,2,0,3,1,3,2,2,3], // B
		[4,0,0,0,0,6,4,6],                                 // C
		[0,0,0,6,2,6,4,4,4,2,2,0,0,0],                     // D
		[4,0,0,0,0,3,3,3,0,3,0,6,4,6],                     // E
		[4,0,0,0,0,3,3,3,0,3,0,6],                         // F
		[4,2,4,0,0,0,0,6,4,6,4,4,2,4],                     // G
		[0,0,0,6,0,3,4,3,4,0,4,6],                         // H
		[0,0,4,0,2,0,2,6,4,6,0,6],                         // I
		[4,0,4,6,2,6,0,4],                                 // J
		[3,0,0,3,0,0,0,6,0,3,3,6],                         // K
		[0,0,0,6,4,6],                                     // L
		[0,6,0,0,2,2,4,0,4,6],                             // M
		[0,6,0,0,4,6,4,0],                                 // N
		[0,0,4,0,4,6,0,6,0,0],                             // O
		[0,6,0,0,4,0,4,3,0,3],                             // P
		[0,0,0,6,2,6,3,5,4,6,2,4,3,5,4,4,4,0,0,0],         // Q
		[0,6,0,0,4,0,4,3,0,3,1,3,4,6],                     // R
		[4,0,0,0,0,3,4,3,4,6,0,6],                         // S
		[0,0,4,0,2,0,2,6],                                 // T
		[0,0,0,6,4,6,4,0],                                 // U
		[0,0,2,6,4,0],                                     // V
		[0,0,0,6,2,4,4,6,4,0],                             // W
		[0,0,4,6,2,3,4,0,0,6],                             // X
		[0,0,2,2,4,0,2,2,2,6],                             // Y
		[0,0,4,0,0,6,4,6],                                 // Z
		[3,0,1,0,1,6,3,6],                                 // [  
		[1,0,3,6],                                         // /  
		[1,0,3,0,3,6,1,6],                                 // ]  
		[1,1,2,0,3,1],                                     // ^ 
		[0,6,4,6],                                         // _
		[1.5,0,2.5,1],                                     // `
	],

	LETTERS: [
		[0,6,0,2,2,0,4,2,4,4,0,4,4,4,4,6],                 //A
		[0,3,0,6,2,6,3,5,3,4,2,3,0,3,0,0,2,0,3,1,3,2,2,3], //B
		[4,0,0,0,0,6,4,6],                                 //C
		[0,0,0,6,2,6,4,4,4,2,2,0,0,0],                     //D
		[4,0,0,0,0,3,3,3,0,3,0,6,4,6],                     //E
		[4,0,0,0,0,3,3,3,0,3,0,6],                         //F
		[4,2,4,0,0,0,0,6,4,6,4,4,2,4],                     //G
		[0,0,0,6,0,3,4,3,4,0,4,6],                         //H
		[0,0,4,0,2,0,2,6,4,6,0,6],                         //I
		[4,0,4,6,2,6,0,4],                                 //J
		[3,0,0,3,0,0,0,6,0,3,3,6],                         //K
		[0,0,0,6,4,6],                                     //L
		[0,6,0,0,2,2,4,0,4,6],                             //M
		[0,6,0,0,4,6,4,0],                                 //N
		[0,0,4,0,4,6,0,6,0,0],                             //O
		[0,6,0,0,4,0,4,3,0,3],                             //P
		[0,0,0,6,2,6,3,5,4,6,2,4,3,5,4,4,4,0,0,0],         //Q
		[0,6,0,0,4,0,4,3,0,3,1,3,4,6],                     //R
		[4,0,0,0,0,3,4,3,4,6,0,6],                         //S
		[0,0,4,0,2,0,2,6],                                 //T
		[0,0,0,6,4,6,4,0],                                 //U
		[0,0,2,6,4,0],                                     //V
		[0,0,0,6,2,4,4,6,4,0],                             //W
		[0,0,4,6,2,3,4,0,0,6],                             //X
		[0,0,2,2,4,0,2,2,2,6],                             //Y
		[0,0,4,0,0,6,4,6]                                  //Z
	],

	NUMBERS: [
		[0,0,0,6,4,6,4,0,0,0],                             //0
		[2,0,2,6],                                         //1
		[0,0,4,0,4,3,0,3,0,6,4,6],                         //2
		[0,0,4,0,4,3,0,3,4,3,4,6,0,6],                     //3
		[0,0,0,3,4,3,4,0,4,6],                             //4
		[4,0,0,0,0,3,4,3,4,6,0,6],                         //5
		[0,0,0,6,4,6,4,3,0,3],                             //6
		[0,0,4,0,4,6],                                     //7
		[0,3,4,3,4,6,0,6,0,0,4,0,4,3],                     //8
		[4,3,0,3,0,0,4,0,4,6],                             //9
	]
};