/*
	COMMAND
	Command pattern objects that are used for history tracking. 
*/
function Command(){
	this.id = genMonsterId(); 
}
Command.prototype.execute = function(){}
Command.prototype.undo = function(){}


/*
	SetCreatureStatusCommand
	Sets the status of a creature. 
	UNDO - Sets the status of a creature to its original status
*/
SetCreatureStatusCommand.prototype = new Command(); 
SetCreatureStatusCommand.prototype.constructor = SetCreatureStatusCommand; 
function SetCreatureStatusCommand(creature, status){
	Command.call(this); 
	this.creature = creature; 
	this.originalStatus; 
	this.newStatus = status; 
}
SetCreatureStatusCommand.prototype.execute = function(){
	this.originalStatus = this.creature.status; 
	this.creature.status = this.newStatus; 
	drawCreatureStatus(this.creature); 
	currentBattle.logMessage(this.creature.toString() + " status set to " + this.creature.status + " from " + this.originalStatus, this.id); 
}
SetCreatureStatusCommand.prototype.undo = function(){
	this.creature.status = this.originalStatus; 
	drawCreatureStatus(this.creature); 
	currentBattle.logMessage(this.creature.toString() + " status set to " + this.creature.status + " from " + this.newStatus, this.id); 
}

/*
	DeleteCreatureCommand
	Deletes a creature in its current state (whatever that may be)
	UNDO - Restores the creature to its previous state. 
*/
DeleteCreatureCommand.prototype = new Command(); 
DeleteCreatureCommand.prototype.constructor = DeleteCreatureCommand; 
function DeleteCreatureCommand(creature){
	Command.call(this); 
	this.creature = creature; 
	this.originalCreatureStatus = creature.status;
}
DeleteCreatureCommand.prototype.execute = function(){
	this.creature.status = CREATURE_STATUS.DELETED; 
	//Undraw this creature
	drawDeleteCreature(this.creature); 
	currentBattle.logMessage("Deleted a creature: [" + this.creature.id + "]" + this.creature.name, this.id); 		
}
DeleteCreatureCommand.prototype.undo = function(){
	this.creature.status = this.originalCreatureStatus; 
	currentBattle.addCreature(this.creature); 
	currentBattle.logMessage("Undeleted a creature: " + this.creature.toString(), this.id); 
	bindEventsForCreature(this.creature.id); 
}

/*
	CreateCreatureCommand
	Creates a creature and inserts it into the initiative list. 
	UNDO - Deletes the creature from the initiative list.
*/
CreateCreatureCommand.prototype = new Command(); 
CreateCreatureCommand.prototype.constructor = CreateCreatureCommand;  

function CreateCreatureCommand(name, init, hp){
	Command.call(this); 
	this.creatureName = name; 
	this.init = init; 
	this.hp = hp; 
	this.resultingCreature = null;  
}

CreateCreatureCommand.prototype.execute = function(){
	if(this.resultingCreature != null){
		//This command was executed as a 'redo'. 
		this.resultingCreature.status = CREATURE_STATUS.ACTIVE; 
		currentBattle.addCreature(this.resultingCreature); 
		currentBattle.logMessage("Recreated a creature " + this.resultingCreature.toString(), this.id);
		bindEventsForCreature(this.resultingCreature.id); 
		return; 
	}

	var creature = createCreature(this.creatureName, this.init, this.hp); 
	var id = genMonsterId(); 
	while(currentBattle.creatures.id != undefined){
		id = genMonsterId(); 
	}
	creature.id = id; 
	currentBattle.creatures[creature.id] = creature; 
	var num = currentBattle.names[creature.name]; 
	if(num == undefined){
		currentBattle.names[creature.name] = 1; 
	}else{
		num++; 
		currentBattle.names[creature.name] = num; 
		creature.name = creature.name + " " + num; 
	}
	this.resultingCreature = creature; 

	currentBattle.addCreature(this.resultingCreature); 
	currentBattle.logMessage("Created a creature [" + this.resultingCreature.id + "]" + this.resultingCreature.name, this.id);
	bindEventsForCreature(this.resultingCreature.id); 
}

CreateCreatureCommand.prototype.undo = function(){
	//Delete this creature from the list. 
	if(currentBattle.creatures[this.resultingCreature.id] != undefined){
		currentBattle.creatures[this.resultingCreature.id].status = CREATURE_STATUS.DELETED; 
		//Undraw this creature
		drawDeleteCreature(this.resultingCreature); 
		currentBattle.logMessage("Deleted a creature: [" + this.resultingCreature.id + "]" + this.resultingCreature.name, this.id); 		
	}
}

/*
	SetCreatureInitCommand
	Sets the creature's initiative score to a new value. 
	UNDO - Sets the creature's initiative score to its original value. 
*/
SetCreatureInitCommand.prototype = new Command(); 
SetCreatureInitCommand.prototype.constructor = SetCreatureInitCommand; 
function SetCreatureInitCommand(creature, init){
	Command.call(this); 
	this.creature = creature; 
	this.init = init; 
	this.originalInit; 
}
SetCreatureInitCommand.prototype.execute = function(){
	this.originalInit = this.creature.init; 
	this.creature.init = this.init; 
	var originalStatus = this.creature.status; 
	this.creature.status = CREATURE_STATUS.DELETED; //Temporarily set the status to deleted for init calculations. 
	currentBattle.initiatives.sort(sortInitiatives); 
	var position = currentBattle.getPrevInitId(this.creature.init);
	this.creature.status = originalStatus;  
	redrawCreature(this.creature, position); 
	currentBattle.logMessage(this.creature.toString() + " initiative changed from: " + this.originalInit + " to " + this.creature.init, this.id); 
}
SetCreatureInitCommand.prototype.undo = function(){
	var originalStatus = this.creature.status; 
	this.creature.status = CREATURE_STATUS.DELETED; 
	this.creature.init = this.originalInit; 
	currentBattle.initiatives.sort(sortInitiatives); 
	var position = currentBattle.getPrevInitId(this.creature.init); 
	this.creature.status = originalStatus; 
	redrawCreature(this.creature, position); 
	currentBattle.logMessage(this.creature.toString() + " initiative changed from: " + this.init + " to " + this.creature.init, this.id); 

}

/*
	SetCreatureTempHpCommand
	Changes a creature's temp HP value 
*/
SetCreatureTempHpCommand.prototype = new Command(); 
SetCreatureTempHpCommand.prototype.constructor = SetCreatureTempHpCommand; 
function SetCreatureTempHpCommand(temp, creature){
	Command.call(this); 	
	this.creature = creature; 
	this.tempBeforeChange = creature.temp; 
	this.temp = temp; 
}
SetCreatureTempHpCommand.prototype.execute = function(){
	this.creature.temp = this.temp; 
	drawCreatureRecords(this.creature); 
	currentBattle.logMessage(this.creature.toString() + " temp hp set to: " + this.creature.temp + " from: " + this.tempBeforeChange, this.id); 
}
SetCreatureTempHpCommand.prototype.undo = function(){
	var oldTemp = this.creature.temp; 
	this.creature.temp = this.tempBeforeChange; 
	drawCreatureRecords(this.creature); 	
	currentBattle.logMessage(this.creature.toString() + " temp hp set to: " + this.creature.temp + " from: " + oldTemp, this.id); 
}

/*
	SetCreatureOngoingCommand
	Changes a creature's ongoing damage value 
*/
SetCreatureOngoingCommand.prototype = new Command(); 
SetCreatureOngoingCommand.prototype.constructor = SetCreatureOngoingCommand; 
function SetCreatureOngoingCommand(ongoing, creature){
	Command.call(this); 	
	this.creature = creature; 
	this.ongoingBeforeChange = creature.ongoing; 
	this.ongoing = ongoing; 
}
SetCreatureOngoingCommand.prototype.execute = function(){
	this.creature.ongoing = this.ongoing; 
	drawCreatureRecords(this.creature); 
	currentBattle.logMessage(this.creature.toString() + " ongoing set to: " + this.creature.ongoing + " from: " + this.ongoingBeforeChange, this.id); 
}
SetCreatureOngoingCommand.prototype.undo = function(){
	var oldOngoing = this.creature.ongoing; 
	this.creature.ongoing = this.ongoingBeforeChange; 
	drawCreatureRecords(this.creature); 	
	currentBattle.logMessage(this.creature.toString() + " ongoing set to: " + this.creature.ongoing + " from: " + oldOngoing, this.id); 
}

/*
	SetCreatureRegenCommand
	Changes a creature's regen value 
*/
SetCreatureRegenCommand.prototype = new Command(); 
SetCreatureRegenCommand.prototype.constructor = SetCreatureRegenCommand; 
function SetCreatureRegenCommand(regen, creature){
	Command.call(this); 	
	this.creature = creature; 
	this.regenBeforeChange = creature.regen; 
	this.regen = regen; 
}
SetCreatureRegenCommand.prototype.execute = function(){
	this.creature.regen = this.regen; 
	drawCreatureRecords(this.creature); 
	currentBattle.logMessage(this.creature.toString() + " regen set to: " + this.creature.regen + " from: " + this.regenBeforeChange, this.id); 
}
SetCreatureRegenCommand.prototype.undo = function(){
	var oldRegen = this.creature.regen; 
	this.creature.regen = this.regenBeforeChange; 
	drawCreatureRecords(this.creature); 	
	currentBattle.logMessage(this.creature.toString() + " ongoing set to: " + this.creature.regen + " from: " + oldRegen, this.id); 
}

/*
	SetCreatureAPCommand
	Changes a creature's ap value 
*/
SetCreatureAPCommand.prototype = new Command(); 
SetCreatureAPCommand.prototype.constructor = SetCreatureAPCommand; 
function SetCreatureAPCommand(ap, creature){
	Command.call(this); 	
	this.creature = creature; 
	this.apBeforeChange = creature.ap; 
	this.ap = ap; 
}
SetCreatureAPCommand.prototype.execute = function(){
	this.creature.ap = this.ap; 
	drawCreatureRecords(this.creature); 
	currentBattle.logMessage(this.creature.toString() + " ap set to: " + this.creature.ap + " from: " + this.apBeforeChange, this.id); 
}
SetCreatureAPCommand.prototype.undo = function(){
	var oldAp = this.creature.ap; 
	this.creature.ap = this.apBeforeChange; 
	drawCreatureRecords(this.creature); 	
	currentBattle.logMessage(this.creature.toString() + " ap set to: " + this.creature.ap + " from: " + oldAp, this.id); 
}

/*
	SetCreatureNameCommand
	Sets a creature's name to a specific value, ignoring the unique name generator. 
	UNDO - Resets the creature to its original name.
*/
SetCreatureNameCommand.prototype = new Command(); 
SetCreatureNameCommand.prototype.constructor = SetCreatureNameCommand; 
function SetCreatureNameCommand(creature, name){
	Command.call(this); 
	this.creature = creature; 
	this.newName = name; 
	this.oldName = creature.name; 
}
SetCreatureNameCommand.prototype.execute = function(){
	this.creature.name = this.newName; 
	drawUpdateCreatureName(this.creature.id); 
	currentBattle.logMessage(this.creature.toString() + " name was changed to: " + this.creature.name + " from " + this.oldName, this.id); 
}
SetCreatureNameCommand.prototype.undo = function(){
	this.creature.name = this.oldName; 
	drawUpdateCreatureName(this.creature.id); 
	currentBattle.logMessage(this.creature.toString() + " name was changed to: " + this.creature.name + " from " + this.newName, this.id); 
}

/*
	SetCreatureMaxHpCommand
	Sets a creature's max hp to a specific value. 
	UNDO - Sets the creature's max HP to the value prior to this set. 
*/

SetCreatureMaxHpCommand.prototype = new Command(); 
SetCreatureMaxHpCommand.prototype.constructor = SetCreatureMaxHpCommand; 
function SetCreatureMaxHpCommand(creature, newHp){
	Command.call(this); 
	this.creature = creature; 
	this.newMaxHp = newHp; 
	this.oldMaxHp = creature.hpmax; 
}
SetCreatureMaxHpCommand.prototype.execute = function(){
	this.creature.hpmax = this.newMaxHp; 
	drawUpdateCreatureHp(this.creature.id); 
	currentBattle.logMessage(this.creature.toString() + " max hp set to: " + this.creature.hpmax + " from " + this.oldMaxHp, this.id); 
}
SetCreatureMaxHpCommand.prototype.undo = function(){
	this.creature.hpmax = this.oldMaxHp; 
	drawUpdateCreatureHp(this.creature.id); 
	currentBattle.logMessage(this.creature.toString() + " max hp set to: " + this.creature.hpmax + " from " + this.newMaxHp, this.id); 
}

/*
	SetCreatureCurrentHpCommand
	Sets a creature's current HP to a specific value. 
	UNDO - Sets the creature's current HP to the value prior to this set. 
*/
SetCreatureCurrentHpCommand.prototype = new Command(); 
SetCreatureCurrentHpCommand.prototype.constructor = SetCreatureCurrentHpCommand; 
function SetCreatureCurrentHpCommand(creature, newHp){
	Command.call(this); 	
	this.creature = creature; 
	this.newHp = newHp; 
	this.oldHp = creature.hpcur;
}
SetCreatureCurrentHpCommand.prototype.execute = function(){
	this.creature.hpcur = this.newHp; 
	drawUpdateCreatureHp(this.creature.id); 
	currentBattle.logMessage(this.creature.toString() + " hp set to: " + this.creature.hpcur + " from " + this.oldHp, this.id); 
}
SetCreatureCurrentHpCommand.prototype.undo = function(){
	this.creature.hpcur = this.oldHp; 
	drawUpdateCreatureHp(this.creature.id); 
	currentBattle.logMessage(this.creature.toString() + " hp set to: " + this.creature.hpcur + " from " + this.newHp, this.id); 
}

/*
	HealCreatureCommand
	Increases a creature's hp by value given. May also restore temporary hp. 
	UNDO - Reduces the creature's total hp by amount healed, also reduces temporary HP. 
*/
HealCreatureCommand.prototype = new Command(); 
HealCreatureCommand.prototype.constructor = HealCreatureCommand; 
function HealCreatureCommand(creature, hpHeal, tempHeal){
	Command.call(this); 
	this.creature = creature; 
	this.hpHeal = parseInt(hpHeal); 
	this.tempHeal = parseInt(tempHeal); 
	this.actualHeal = 0; 
}
HealCreatureCommand.prototype.execute = function(){
	var curHp = this.creature.hpcur; 
	var curTemp = this.creature.temp; 

	if(!isNaN(this.tempHeal)){
		//Restore creature's temporary hp. 
		this.creature.temp = this.tempHeal + curTemp; 
		currentBattle.logMessage(this.creature.toString() + " gained: " + this.tempHeal + " temp hp " + curTemp + " -> " + this.creature.temp, this.id); 
	}

	if(!isNaN(this.hpHeal)){
		//Restore creature's hp. 
		this.actualHeal = Math.min(this.creature.hpmax - this.creature.hpcur, this.hpHeal); 
		var overHeal = this.hpHeal - this.actualHeal; 

		this.creature.hpcur = parseInt(curHp) + parseInt(this.actualHeal); 
		var overHealString = (overHeal > 0) ? "(" + overHeal + ") hp overheal. " : ""; 

		currentBattle.logMessage(this.creature.toString() + " was healed for " + this.hpHeal + " hp. " + overHealString + curHp + " -> " + this.creature.hpcur, this.id);
	}
	drawCreatureRecords(this.creature); 
	drawUpdateCreatureHp(this.creature.id); 
}
HealCreatureCommand.prototype.undo = function(){
	var curHp = this.creature.hpcur; 
	var curTemp = this.creature.temp; 
	if(!isNaN(this.tempHeal)){
		//Reduce creature's temp hp. 
		this.creature.temp = curTemp - this.tempHeal; 
		currentBattle.logMessage("UNDO " + this.creature.toString() + " gained: " + this.tempHeal + " temp hp. " + curTemp + " -> " + this.creature.temp, this.id); 		
	}
	if(!isNaN(this.hpHeal)){
		this.creature.hpcur = this.creature.hpcur - this.actualHeal; 
		var overHeal = this.hpHeal - this.actualHeal; 
		var overHealString = (overHeal > 0) ? "(" + overHeal + ") hp overheal. " : ""; 		
		currentBattle.logMessage("UNDO " + this.creature.toString() + " was healed for " + this.hpHeal + " hp. " + overHealString + curHp + " -> " + this.creature.hpcur, this.id);
	}
	drawCreatureRecords(this.creature); 
	drawUpdateCreatureHp(this.creature.id); 
}

/*
	DamageCreatureCommand
	Deals damage to a creature, first to tempHp then to realHp. 
	UNDO - Restores hp and tempHP equal to amount damaged. 
*/
DamageCreatureCommand.prototype = new Command(); 
DamageCreatureCommand.prototype.constructor = HealCreatureCommand; 
function DamageCreatureCommand(creature, damage){
	Command.call(this); 	
	this.creature = creature; 
	this.damage = parseInt(damage); 
	this.hpDamage = 0; 
	this.tempDamage = 0; 
}
DamageCreatureCommand.prototype.execute = function(){
	var curHp = this.creature.hpcur; 
	var curTemp = this.creature.temp; 
	if(!isNaN(this.damage)){
		var absorbedDamage = Math.min(curTemp, this.damage); //Determine how much damage is absorbed by tempHp. 
		this.creature.temp = curTemp - absorbedDamage; 
		this.tempDamage = absorbedDamage; 
		
		var carryOver = this.damage - absorbedDamage; //Determine how much HP damage is done. 
		this.creature.hpcur = curHp - carryOver; 
		this.hpDamage = carryOver; 
 
		var absorbedString = (this.tempDamage == 0) ? "" : "(" +this.tempDamage + ") absorbed. ";

		currentBattle.logMessage(this.creature.toString() + " was dealt: " + this.damage + " damage. " + absorbedString + curHp + " -> " + this.creature.hpcur, this.id);
		drawCreatureRecords(this.creature); 

		if((curHp / this.creature.hpmax) > 0.5 && (this.creature.hpcur / this.creature.hpmax) <= 0.5){
			drawEffectShakeCreature(this.creature.id); 
			currentBattle.logMessage(this.creature.toString() + " was bloodied!");
		}

		drawUpdateCreatureHp(this.creature.id); 
	}
	else{
		currentBattle.logMessage("Invalid damage", this.id); 
	}

}
DamageCreatureCommand.prototype.undo = function(){
	var curHp = this.creature.hpcur; 
	var curTemp = this.creature.temp; 
	if(!isNaN(this.damage)){
		this.creature.temp = curTemp + this.tempDamage; 
		this.creature.hpcur = Math.min(curHp + this.hpDamage, this.creature.hpmax); 

		var absorbedString = (this.tempDamage == 0) ? "" : "(" +this.tempDamage + ") absorbed. ";

		currentBattle.logMessage("UNDO " + this.creature.toString() + " was dealt: " + this.damage + " damage. " + absorbedString + curHp + " -> " + this.creature.hpcur, this.id);
		drawCreatureRecords(this.creature); 
		drawUpdateCreatureHp(this.creature.id); 
	}
	else{
		currentBattle.logMessage("UNDO invalid command"); 
	}
}


/*
	AddEffectCommand
	Adds an effect to the corresponding creature. 
	UNDO - Removes the effect from the corresponding creature. 
*/
AddEffectCommand.prototype = new Command(); 
AddEffectCommand.prototype.constructor = AddEffectCommand; 
function AddEffectCommand(effectName, effectType, creatureId){
	Command.call(this); 
	this.effect = new Effect(effectName, effectType);
	this.creatureId = creatureId; 
	this.wasValidExecution = false; 
}
AddEffectCommand.prototype.execute = function(){
	var creature = currentBattle.getCreature(this.creatureId); 
	if(creature.effects.getLength() < 8){
		var effectNode = creature.effects.insertEnd(new Node(this.effect)); 
		creature.effectsHash[this.effect.id] = effectNode; 
		this.wasValidExecution = true; 
		drawCreatureEffects(creature); 
		currentBattle.logMessage(creature.toString() + " gained " + this.effect.toString(), this.id); 
	}else{
		this.wasValidExecution = false; 
		currentBattle.logMessage(creature.toString() + " could not gain " + this.effect.toString() + " too many effects on creature", this.id); 
	}
}
AddEffectCommand.prototype.undo = function(){
	var creature = currentBattle.getCreature(this.creatureId); 	
	if(this.wasValidExecution){
		var effectNode = creature.effectsHash[this.effect.id]; 

		var removedNode = creature.effects.remove(effectNode); 

		if(removedNode != undefined){
			delete creature.effectsHash[this.effect.id]; 
			drawCreatureEffects(creature); 
			currentBattle.logMessage(creature.toString() + " removed effect " + this.effect.toString(), this.id); 
		}else{
			currentBattle.logMessage(creature.toString() + " could not remove effect " + this.effect.toString() + " effect not found", this.id);
		}
	}
}

/* EditEffectCommand
   Edits a specific effect from a creature (by ID)
   UNDO: Reverts the effect to the state prior to edit
 */
 EditEffectCommand.prototype = new Command(); 
 EditEffectCommand.prototype.constructor = EditEffectCommand; 
 function EditEffectCommand(creatureId, effectId, newName, newType){
 	Command.call(this); 
	this.effectId = effectId; 
 	this.creatureId = creatureId;
 	this.newName = newName;
 	this.newType = newType; 

 	this.oldName; 
 	this.oldType; 
 }
 EditEffectCommand.prototype.execute = function(){
 	var creature = currentBattle.getCreature(this.creatureId); 
 	var node = creature.effectsHash[this.effectId]; 

 	if(node != undefined){
 		this.oldName = node.data.name; 
 		this.oldType = node.data.type; 
 		
 		var oldEffectName = node.data.toString(); 
 		node.data.name = (this.newName == null) ? this.oldName : this.newName; 
 		node.data.type = (this.newType == null) ? this.oldType : this.newType; 
		drawCreatureEffects(creature); 
 		currentBattle.logMessage(creature.toString() + " effect: " + oldEffectName + " -> " + node.data.toString(), this.id); 
 	}else{
 		throw "Could not modify effect: " + this.effectId + ". Effect not found"; 
 	}
 }

 EditEffectCommand.prototype.undo = function(){
 	var creature = currentBattle.getCreature(this.creatureId); 
 	var node = creature.effectsHash[this.effectId]; 

 	if(node != undefined){
 		var newEffectName = node.data.toString(); 
 		node.data.name = this.oldName; 
 		node.data.type = this.oldType; 
 		drawCreatureEffects(creature); 		
 		currentBattle.logMessage(creature.toString() + " effect: " + newEffectName + " revert-> " + node.data.toString(), this.id);  
 	}else{
 		throw "Could not revert effect: " + this.effectId + ". Effect not found"; 
 	}
 }

/* RemoveEffectCommand 
	Removes a specific effect from a creature (by ID)
	UNDO: Adds the effect back onto the creature. 
*/
RemoveEffectCommand.prototype = new Command(); 
RemoveEffectCommand.prototype.constructor = RemoveEffectCommand; 
function RemoveEffectCommand(creatureId, effectId){
	Command.call(this); 
	this.effectId = effectId; 
	this.creatureId = creatureId; 
	this.removedEffect = null; 
}
RemoveEffectCommand.prototype.execute = function(){
	//Find the effect from the creature and delete it. 
	var creature = currentBattle.getCreature(this.creatureId); 
	var node = creature.effectsHash[this.effectId]; 
	if(node != null){
		creature.effects.remove(node); 
		this.removedEffect = node.data;
		delete creature.effectsHash[this.effectId];  
		drawCreatureEffects(creature); 		
		currentBattle.logMessage(creature.toString() + " removed effect " + this.removedEffect.toString(), this.id); 
	}else{
		currentBattle.logMessage(creature.toString() + " could not remove effect " + this.effectId + " effect not found",this.id); 
	}
}
RemoveEffectCommand.prototype.undo = function(){
	if(this.removedEffect != null){
		var creature = currentBattle.getCreature(this.creatureId); 
		if(creature.effects.getLength() < 8){
			var node = new Node(this.removedEffect); 
			creature.effects.insertEnd(node);
			creature.effectsHash[this.effectId] = node;  
			drawCreatureEffects(creature); 			
			currentBattle.logMessage(creature.toString() + " gained " + this.removedEffect.toString(), this.id); 
		}else{
			currentBattle.logMessage(creature.toString() + " could not gain " + this.removedEffect.toString() + " too many effects on creature", this.id);  
		}	
	}
}