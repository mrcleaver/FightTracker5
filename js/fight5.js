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
// LZW-compress a string
function lzw_encode(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i=1; i<data.length; i++) {
        currChar=data[i];
        if (dict[phrase + currChar] != null) {
            phrase += currChar;
        }
        else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase=currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (var i=0; i<out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}

// Decompress an LZW-encoded string
function lzw_decode(s) {
    var dict = {};
    var data = (s + "").split("");
    var currChar = data[0];
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;
    for (var i=1; i<data.length; i++) {
        var currCode = data[i].charCodeAt(0);
        if (currCode < 256) {
            phrase = data[i];
        }
        else {
           phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
        }
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
    }
    return out.join("");
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

/* Regenerates a battle from stringified battledata */
function loadBattle(battleData){
	var battle = createNewBattle(); 
	var initiatives = []; 
	for(var i = 0; i < battleData.initiatives.length; i++){
		var c = new Creature("",0,0); 
		c.fromData(battleData.initiatives[i]); 
		initiatives[i] = c;
		battle.creatures[c.id] = c; 
		if(battleData.cursorId == c.id){
			battle.cursor = c; 
		}
	}	
	battle.id = battleData.id; 
	battle.turn = battleData.turn; 
	battle.initiatives = initiatives; 
	battle.messages = battleData.messages; 
	battle.names = battleData.names;
	return battle; 
}

/* Converts a battle object into a string representation that can be regenerated */
function battleToData(battle){
	var inits = []; 

	for(var i = 0; i < battle.initiatives.length; i++){
		var c = battle.initiatives[i].toData(); 
		inits[i] = c; 
	}

	return {
		id: battle.id, 
		turn: battle.turn, 
		initiatives: inits,
		messages: battle.messages,
		cursorId: (battle.cursor == null) ? null : battle.cursor.id ,
		names: battle.names
	}
}

function createNewBattle(){
	var _id = genMonsterId(); 
	return {
		id: _id,
		turn: 0, 
		history: [], //History of commands
		undo: [], //List of undos (which may then be redone); 
		initiatives: [], //List of monster initiatives 
		messages: [], //List of messages
		names: {}, //List of creature names and how many of each there are. 
		creatures: {}, //Dictionary of creature IDs to creatures
		cursor: null, //The actively selected creature in the battle. 
		cursorNext: function(){
			if(this.initiatives.length == 0){
				this.cursor = null; 
				return null; 
			}
			if(this.cursor == null){
				if(this.initiatives[0].status == CREATURE_STATUS.ACTIVE || (this.initiatives[0].status == CREATURE_STATUS.DELAYING && APP_SETTINGS.CURSOR_SELECT_DELAYING)){
					this.cursor = this.initiatives[0]; 
					return this.cursor;
				}else{
					this.cursor = null; 
					return null; 
				} 
			}
			var cursorPosition; //Determine the true position of the cursor. 
			for(var i = 0; i < this.initiatives.length; i++){
				if(this.initiatives[i] == this.cursor){
					cursorPosition = i; 
					break; 
				}
			}
			for(var i = (cursorPosition + 1) % this.initiatives.length; i != cursorPosition;){
				if(this.initiatives[i].status == CREATURE_STATUS.ACTIVE || (this.initiatives[i].status == CREATURE_STATUS.DELAYING && APP_SETTINGS.CURSOR_SELECT_DELAYING)){
					this.cursor = this.initiatives[i]; 
					return this.cursor; 
				}

				i = (i + 1) % this.initiatives.length; 
				if(i == cursorPosition){
					if(this.initiatives[i].status == CREATURE_STATUS.ACTIVE || (this.initiatives[i].status == CREATURE_STATUS.DELAYING && APP_SETTINGS.CURSOR_SELECT_DELAYING)){
						this.cursor = this.initiatives[i]; 
						return this.cursor; 
					}else{
						this.cursor = null; 	
						return null; 
					}
				}
			}
			this.cursor = null; 	
			return null;
		},
		cursorPrev: function(){
			if(this.initiatives.length == 0){
				this.cursor = null; 
				return null; 
			}
			if(this.cursor == null){
				if(this.initiatives[this.initiatives.length-1].status == CREATURE_STATUS.ACTIVE || (this.initiatives[this.initiatives.length-1].status == CREATURE_STATUS.DELAYING && APP_SETTINGS.CURSOR_SELECT_DELAYING)){
					this.cursor = this.initiatives[this.initiatives.length-1]; 
					return this.cursor;
				}else{
					this.cursor = null; 
					return null; 
				} 
			}
			var cursorPosition; //Determine the true position of the cursor. 
			for(var i = 0; i < this.initiatives.length; i++){
				if(this.initiatives[i] == this.cursor){
					cursorPosition = i; 
					break; 
				}
			}
			//Go backwards to find the previous cursor position. 
			for(var i = (cursorPosition + this.initiatives.length -1) % this.initiatives.length; i != cursorPosition;){
				if(this.initiatives[i].status == CREATURE_STATUS.ACTIVE || (this.initiatives[i].status == CREATURE_STATUS.DELAYING && APP_SETTINGS.CURSOR_SELECT_DELAYING)){
					this.cursor = this.initiatives[i]; 
					return this.cursor; 
				}

				i = (i + this.initiatives.length - 1) % this.initiatives.length; 
				if(i == cursorPosition){
					if(this.initiatives[i].status == CREATURE_STATUS.ACTIVE || (this.initiatives[i].status == CREATURE_STATUS.DELAYING && APP_SETTINGS.CURSOR_SELECT_DELAYING)){
						this.cursor = this.initiatives[i]; 
						return this.cursor; 
					}else{
						this.cursor = null; 
						return null; 
					}
				}
			}
			this.cursor = null; 
			return null;		},
		getCreature: function(id){
			if(this.creatures[id] != undefined){
				return this.creatures[id]; 
			}
			return null; 
		},
		addCreature: function(creature){
			var nextInit = this.getNextAvailableInit(creature.init); 

			console.log("Computed next init to be: " + nextInit); 

			creature.init = this.getNextAvailableInit(creature.init); 

			var position = this.getPrevInitId(creature.init); 
			//Add the creature to the initiative list

			this.initiatives.push(creature); 
			this.initiatives.sort(sortInitiatives);  									
			drawCreature(creature, position); 
			drawCreatureEffects(creature); 
			drawCreatureRecords(creature); 
			drawCreatureStatus(creature); 
		},
		getNextAvailableInit: function(initiative){
			//Given an initiative value, returns the next 'best' value for it to take if an identical initiative already exists in the list. 
			//If two initiatives have the same value, the next available init is just above the existing initiative. 
			console.log(initiative); 
			initiative = parseFloat(initiative); 
			if(isNaN(initiative)){
				throw "Invalid initiative specified: " + initiative; 
			}
			if(this.initiatives.length == 0){
				return initiative; 
			}
			if(this.initiatives.length == 1){
				return (this.initiatives[0].init == initiative) ? initiative + 0.1 : initiative; 
			}
			var existingInitIndex = null; 
			for(var i = this.initiatives.length - 1; i >= 0; i--){
				if(this.initiatives[i].init == initiative){
					existingInitIndex = i; 
					break; 
				}
			}
			if(existingInitIndex == null) return initiative; 

			if(existingInitIndex == 0) return initiative + 0.1; 

			return (this.initiatives[existingInitIndex-1].init - this.initiatives[existingInitIndex].init) / 2 + initiative; 
		},
		//Given an initiative value, returns the ID of creature immediately before this initiative score. 
		//Returns null if no creatures before this initiative score 
		getPrevInitId: function(initiative){ 
			initiative = parseFloat(initiative); 
			if(isNaN(initiative)){
				throw "Invalid initiative specified"; 
			}
			//Just do a linear search since this initiative list is likely to be fairly small
			if(this.initiatives.length == 0){
				return null; 
			}
			if(this.initiatives.length == 1){
				return (this.initiatives[0].init > initiative && this.initiatives[0].status != CREATURE_STATUS.DELETED) ? this.initiatives[0].id : null; 
			} 
			for(var i = this.initiatives.length - 1; i >= 0; i--){; 
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

Creature.prototype.fromData = function(data){
	var effectsList = new DLinkedList(); 
	for(var i = 0; i < data.effects.length; i++){
		var node = new Node(data.effects[i]); 
		effectsList.insertEnd(node); 
		this.effectsHash[data.effects[i].id] = node; 
	}
	this.id = data.id; 
	this.name = data.name; 
	this.init = data.init; 
	this.initStart = data.initStart; 
	this.hpcur = data.hpcur; 
	this.hpmax = data.hpmax; 
	this.temp = data.temp; 
	this.ongoing = data.ongoing; 
	this.regen = data.regen; 
	this.ap = data.ap; 
	this.effects = effectsList; 
	this.status = data.status; 
}

Creature.prototype.toData = function(){
	var effectsArray = []; 
	var it = this.effects.iterator(); 

	while(it.hasNext()){
		var node = it.next(); 
		effectsArray.push(node.data); 
	}
	return {
		id: this.id, 
		name: this.name, 
		init: this.init,
		initStart: this.initStart, 
		hpcur: this.hpcur, 
		hpmax: this.hpmax, 
		temp: this.temp, 
		ongoing: this.ongoing,
		regen: this.regen, 
		ap: this.ap, 
		effects: effectsArray, 
		status: this.status
	}
}

function createCreature(name, init, hp){
	return new Creature(name, init, hp); 	
}

var currentBattle; 
var previousBattle; 