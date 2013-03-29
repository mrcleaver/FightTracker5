/* 
	Fight Tracker 5 Javascript
*/

/* Test functions */
function testCreateCreature(name, init, hp){
	c = new CreateCreatureCommand(name, init, hp); 
	executeCommand(c); 
	return c.resultingCreature; 
}

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



function genMonsterId() {
	var id = ""; 
	for(var i = 0; i < 8; i++){
		id = id + (Math.random()*36).toString(36).substr(0,1); 
	}
    return id; 
}

function testCollisions(tries){
	var test = {}; 
	var collide = false; 
	var i = 0; 
	while(collide == false){
		var id = genMonsterId(); 
		if(test[id] != undefined){
			collide = true;
			console.log("Collsion after: " + i + " tries. On value: " + id); 
			break;
		}
		test[id] = true; 
		i++; 
		if(i >= tries){
			console.log( tries + " tries"); 
			break; 
		}
	}
}

var sortInitiatives = function sortInitiatives(creatureA, creatureB){
	return creatureB.init - creatureA.init; 
}


function Node(data){
	this.prev = null; 
	this.next = null; 
	this.data = data; 
}

function DLinkedListIterator(list){
	this.list = list; 
	this.selected = null; 
}

DLinkedListIterator.prototype.next = function(){
	if(this.list.isEmpty()){
		throw "IndexOutOfRangeException"; 
	} 
	if(this.selected == null){
		this.selected = this.list.firstNode; 
		return this.selected; 
	}
	var toReturn = this.selected.next; 
	if(toReturn == null){
		throw "IndexOutOfRangeException"; 
	}
	this.selected = toReturn; 
	return toReturn; 
}

DLinkedListIterator.prototype.hasNext = function(){
	if(this.list.isEmpty()){
		return false; 
	}
	if(this.selected == null){
		return true; 
	}
	if(this.selected.next != null){
		return true; 
	}
	return false; 
}

function DLinkedList(){
	var firstNode = null; 
	var lastNode = null; 
}

DLinkedList.prototype.getLength = function(){
	if(this.firstNode == null){
		return 0; 
	}else{
		var cnt = 1; 
		var node = this.firstNode; 
		while(node.next != null){
			node = node.next; 
			cnt++; 
		}
		return cnt; 
	}
}

DLinkedList.prototype.iterator = function(){
	return new DLinkedListIterator(this); 
}

DLinkedList.prototype.isEmpty = function(){
	return (this.firstNode == null && this.lastNode == null) ? true : false; 
}

DLinkedList.prototype.insertAfter = function(node, newNode){
	newNode.prev = node; 
	newNode.next= node.next; 
	if(node.next == null){
		this.lastNode = newNode; 
	}else{
		node.next.prev = newNode; 
	}
	node.next = newNode; 
	return newNode; 
}

DLinkedList.prototype.insertBefore = function(node, newNode){
	newNode.prev = node.prev; 
	newNode.next = node;
	if(node.prev == null){
		this.firstNode = newNode; 
	}else{
		node.prev.next = newNode; 
	}
	node.prev = newNode; 
	return newNode; 
}

DLinkedList.prototype.insertBeginning = function(newNode){
	if(this.firstNode == null){
		this.firstNode = newNode; 
		this.lastNode = newNode; 
		newNode.prev = null; 
		newNode.next = null; 
		return newNode; 
	}else{
		return this.insertBefore(this.firstNode, newNode); 
	}
}

DLinkedList.prototype.insertEnd = function(newNode){
	if(this.lastNode == null){
		return this.insertBeginning(newNode); 
	}else{
		return this.insertAfter(this.lastNode, newNode); 
	}
}

DLinkedList.prototype.remove = function(node){
	if(node.prev == null){
		this.firstNode = node.next; 
	}else{
		node.prev.next = node.next;
	}

	if(node.next == null){
		this.lastNode = node.prev; 
	}else{
		node.next.prev = node.prev; 
	}
	return node; 
}


/* End helper functions */

function createNewBattle(){
	var _id = guid(); 
	return {
		id: _id,
		turn: 0, 
		history: [], //History of commands
		undo: [], //List of undos (which may then be redone); 
		initiatives: [], //List of monster initiatives 
		messages: [], //List of messages
		names: {}, //List of creature names and how many of each there are. 
		creatures: {}, //Dictionary of creature IDs to creatures
		getCreature: function(id){
			if(this.creatures[id] != undefined){
				return this.creatures[id]; 
			}
			return null; 
		},
		addCreature: function(creature){
			var position = this.getPrevInitId(creature.init); 
			if(this.creatures[creature.id] == undefined){
				//Add the creature to the initiative list
				this.initiatives.push(creature); 
			}
			this.initiatives.sort(sortInitiatives);  			
			drawCreature(creature, position); 
			drawCreatureEffects(creature); 
			drawCreatureRecords(creature); 
			
		},
		//Given an initiative value, returns the ID of creature immediately before this initiative score. 
		//Returns null if no creatures before this initiative score 
		getPrevInitId: function(initiative){ 
			//Just do a linear search since this initiative list is likely to be fairly small
			if(this.initiatives.length == 0){
				return null; 
			}
			if(this.initiatives.length == 1){
				return (this.initiatives[0].init > initiative && this.initiatives[0].status != CREATURE_STATUS.DELETED) ? this.initiatives[0].id : null; 
			} 
			for(var i = this.initiatives.length - 1; i >= 0; i--){
				if(this.initiatives[i].init >= initiative && this.initiatives[i].status != CREATURE_STATUS.DELETED){
					return this.initiatives[i].id; 
				}
			}
			return null; 
		},
		logMessage: function(message, source){
			this.messages.push({message: message, source: source, date: new Date()}); 
			console.log("<"+source+"> " + message); 
		}
	}
}

function Effect(name, type){
	this.id = genMonsterId(); 
	this.name = name; 
	this.type = type; 	
}

Effect.prototype.toString = function(){
	return "[" + this.type + " Effect: " + this.name + "]("+this.id+")"; 
}

function Creature(name, init, hp){
	this.id = null; 
	this.name = name; 
	this.init = init; 
	this.initStart = init; 
	this.hpcur = hp; 
	this.hpmax = hp; 
	this.temp = 0; 
	this.ongoing = 0; 
	this.regen = 0; 
	this.ap = 0; 
	this.effects = new DLinkedList(); 
	this.effectsHash = {}; 
	this.status = CREATURE_STATUS.ACTIVE;
}

Creature.prototype.toString = function(){
	return "[" + this.id + "]" + this.name; 
}


function createCreature(name, init, hp){
	return new Creature(name, init, hp); 	
}

var currentBattle; 