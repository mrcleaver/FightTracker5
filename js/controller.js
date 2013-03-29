var CREATURE_STATUS = {
	ACTIVE: "ACTIVE",
	DELAYING: "DELAYING",
	INACTIVE: "INACTIVE",
	DELETED: "DELETED"
}

var EFFECT_TYPE = {
	POSITIVE: "POSITIVE",
	NEGATIVE: "NEGATIVE",
	NEUTRAL: "NETURAL"
}

function executeCommand(command){
	command.execute(); 
	currentBattle.history.push(command); 
}

function undoCommand(){
	if(currentBattle.history.length != 0){
		var command = currentBattle.history.pop();
		command.undo(); 
		currentBattle.undo.push(command); 
		currentBattle.logMessage("Undid a command: " + command.id, "Controller");  
	}
}

function redoCommand(){
	if(currentBattle.undo.length != 0){
		var command = currentBattle.undo.pop(); 
		executeCommand(command); 
		currentBattle.logMessage("Redid a command: " + command.id, "Controller"); 
	}
}

//Do initial setup here
$(document).ready(function(){
	currentBattle = createNewBattle(); 
	//Bind keys
	$("#create-creature").click(controllerCreateCreature); 
	$("#undo").click(undoCommand); 
	$("#redo").click(redoCommand); 	
});

function bindEventsForCreature(id){
	var byId = "#"+id; 
	$(byId +" .caw-pos").on("click", function(){
		controllerAddEffect(this, EFFECT_TYPE.POSITIVE, id); 
	}); 
	$(byId +" .caw-neg").on("click", function(){
		controllerAddEffect(this, EFFECT_TYPE.NEGATIVE, id); 
	});
	$(byId + " .caw-add").on("click", function(){
		controllerChangeHp(this, false, id); 
	});
	$(byId + " .caw-sub").on("click", function(){
		controllerChangeHp(this, true, id); 
	});	
	$(byId + " .creature-temp-hp").on("blur", function(){
		controllerModTemp(this, id); 
	});

	$(byId + " div.creature-close").on("click", function(){
		controllerDeleteCreature(this, id); 
	});

	$(byId + " span.hp-cur").editable(function(value, settings){
		return controllerSetCurrentHp(id, value); 
	});

	$(byId + " ul.creature-effects").find("li>span").editable(function(value, settings){
		var effectId = $(this).attr("id"); 
		var newEffectName; 
		if(effectId != undefined){
			var e = getEffectFromString(value); 
			newEffectName = controllerEditEffect(id, effectId, e.name, e.type); 
		}else{
			var e = getEffectFromString(value); 
			newEffectName = controllerAddEffect(this, e.type, id, e.name); 
		}
		return newEffectName; 
	});

	$(byId + " ul.creature-effects").find("li>span").bind("click", function(e){
		var effectId = $(this).attr("id"); 
		if(e.metaKey){
			var effectId = $(this).attr("id");
			if(effectId != undefined){
				controllerDeleteEffect(id, effectId);
			} 
			return false; 	
		} 
	});

}

function getEffectFromString(effectString){
	var effectType; 
	var effectName;
	var sign = effectString.substr(0,1); 

	if(effectString == "") return null; 

	if(sign == '+'){
		effectType = EFFECT_TYPE.POSITIVE; 
		effectName = effectString.substr(1,effectString.length); 
	}else if(sign == '-'){
		effectType = EFFECT_TYPE.NEGATIVE;
		effectName = effectString.substr(1,effectString.length); 				 
	}else{
		effectType = EFFECT_TYPE.NEUTRAL;
		effectName = effectString;  
	}	

	return {name: effectName, type: effectType};
}

function controllerDeleteEffect(creatureId, effectId){
	var command = new RemoveEffectCommand(creatureId, effectId); 
	executeCommand(command); 
}

function controllerEditEffect(creatureId, effectId, newName, newType){
	if(newName == ""){
		return; 
	}
	var command = new EditEffectCommand(creatureId, effectId, newName, newType); 
	executeCommand(command); 
}

function controllerDeleteCreature(event, id){
	var creature = currentBattle.getCreature(id); 
	var optionYes = confirm("Delete creature: " + creature.name + "?"); 

	if(optionYes){
		var command = new DeleteCreatureCommand(creature); 
		executeCommand(command);
	} 
}

function controllerSetCurrentHp(id, hp){
	var value = parseInt(hp); 
	if(!isNaN(value)){
		var command = new SetCreatureCurrentHpCommand(currentBattle.getCreature(id), hp); 
		executeCommand(command); 
		return value; 		
	}else{
		return currentBattle.getCreature(id).hpcur; 
	}	
}

function controllerModTemp(event, id){
	var val = $("#"+id + " .creature-temp-hp").val(); 
	var tempVal = parseInt(val);
	if(!isNaN(tempVal)){
		tempVal = Math.abs(tempVal); 
		var command = new SetCreatureTempHpCommand(tempVal, currentBattle.getCreature(id));
		executeCommand(command); 
	}else{
		drawCreatureRecords(currentBattle.getCreature(id)); 
	}
}

function controllerCreateCreature(){
	var name = $("#control-creature-name-input").val(); 
	var init = $("#control-creature-initiative-input").val(); 
	var hp = $("#control-creature-hp-input").val(); 	
	if(name == "" || init == "" || hp == ""){ 
		return; 
	}
	var command = new CreateCreatureCommand(name, init, hp); 
	executeCommand(command); 
}

function controllerChangeHp(event, subtraction, id){
	var val = parseInt($("#"+id + " input.caw-input").val()); 
	var damageCreature = subtraction; 
	if(!isNaN(val)){
		if(val < 0 && !subtraction){
			damageCreature = true; 
		}
		if(val < 0 && subtraction){
			damageCreature = false; 
		}
		val = Math.abs(val); 
		var command; 
		if(damageCreature){
			command = new DamageCreatureCommand(currentBattle.getCreature(id), val); 
		}else{
			command = new HealCreatureCommand(currentBattle.getCreature(id), val); 
		}
		executeCommand(command); 
	}
}

function controllerAddEffect(event, effectType, id, value){
	var effectName = (value == undefined) ? $("#"+id +" input.caw-input").val() : value; 
	if(effectName == ""){
		return; 
	}
	var command = new AddEffectCommand(effectName, effectType, id); 
	executeCommand(command);  
}