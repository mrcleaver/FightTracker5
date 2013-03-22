/* 
	Fight Tracker 5 Javascript
*/

/*Helper functions*/
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}

var sortInitiatives = function sortInitiatives(creatureA, creatureB){
	return creatureB.init - creatureA.init; 
}

var CREATURE_STATUS = {
	ACTIVE: 0,
	DELAYING: 1,
	INACTIVE: 2,
	DELETED: 3
}
/* End helper functions */

function createNewBattle(){
	var _id = guid(); 
	return {
		id: _id,
		turn: 0, 
		history: [],
		initiatives: [],
		names: {},
		creatures: {},
		addCreature: function(creature){
			this.initiatives.push(creature); 
			this.initiatives.sort(sortInitiatives); 
			
			var num = this.names[creature.name]; 
			if(num == undefined){
				this.names[creature.name] = 1; 
			}else{
				num++; 
				this.names[creature.name] = num;
				creature.name = creature.name + " " + num;  
			}	


			this.creatures[creature.name] = creature; 
			
		},
		deleteCreature: function(creatureName){
			if(this.creatures[creatureName] != undefined){
				this.creatures[creatureName].status = CREATURE_STATUS.DELETED; 
				delete this.creatures[creatureName]; 
			}
		}
	}
}

function createCreature(name, init, hp){
	var creature = {
		name: name, 
		init: init,
		initStart: init,
		hpcur: hp,
		hpmax: hp,
		temp: 0,
		ongoing: 0,
		regen: 0,
		effects:[],
		status: CREATURE_STATUS.ACTIVE
	}
	return creature; 	
}

var currentBattle; 

//Do initial setup here
$(document).ready(function(){
	currentBattle = createNewBattle(); 
});