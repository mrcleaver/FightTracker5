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

RECORD_TYPE = {
	TEMP_HP: "TEMP_HP",
	REGEN: "REGEN",
	ONGOING: "ONGOING",
	AP: "AP"
}

var help = false; 

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
	$("#fightcontainer").sortable({items: "> div.creature",
									handle: "> div.creature-name",
									stop: initMove});
	$("#keyboard-dialog").dialog({
      autoOpen: false
	});
	bindGlobalEvents(); 
});

var zheld = false; 

function bindGlobalEvents(){
	$(document).on("keydown", function(event){
		/* The [ and ] keys move initiative */
		if(event.which == 221){
			event.preventDefault(); 
			return false; 
		}
		if(event.which == 219){
			event.preventDefault(); 
			return false; 
		}		

		/* The \ key delays a creature */
		if(event.which == 220 && currentBattle.cursor != null){
			event.preventDefault(); 
			return false; 
		}

		/*The ; key triggers upkeep*/
		if(event.which == 186 && currentBattle.cursor != null){
			event.preventDefault(); 
			return false; 	
		}	

	});

	$(document).on("keyup", function(event){
		if(event.which == 9 && currentBattle.cursor != null){
			//Tab to this creature's input
			$("#"+currentBattle.cursor.id + " .caw-input").focus(); 
			$("#"+currentBattle.cursor.id + " .caw-input").select(); 
			event.preventDefault(); 
		}

		/* The [ and ] keys move initiative */
		if(event.which == 221){
			controllerCursorNext(); 
			event.preventDefault(); 
			return false; 
		}
		if(event.which == 219){
			controllerCursorPrev(); 
			event.preventDefault(); 
			return false; 
		}

		/* The \ key delays a creature */
		if(event.which == 220 && currentBattle.cursor != null){
			controllerSetStatus(currentBattle.cursor.id, CREATURE_STATUS.DELAYING); 
			event.preventDefault(); 
			return false; 
		}

		/*The ; key triggers upkeep*/
		if(event.which == 186 && currentBattle.cursor != null){
			controllerUpkeep(currentBattle.cursor.id); 
			event.preventDefault(); 
			return false; 	
		}

		if(event.which == 191){
			 if(!help){
				$("#keyboard-dialog").modal({persist:true});
				help = true; 
			} else{
				$.modal.close();
				help = false; 
			}
		}
	})	

	$("#control-creature-name-input, #control-creature-hp-input").on("keypress", function(event){
		if(event.which == 13){
			controllerCreateCreature();
			$("#control-creature-name-input").focus();
			$("#control-creature-name-input").select();
			event.preventDefault(); 
			return; 
		}
	});

	$("#control-creature-hp-input").on("keydown", function(event){
		if(event.which == 9){
			$("#control-creature-name-input").focus(); 
			$("#control-creature-name-input").select(); 
			event.preventDefault(); 
			return; 
		}
	})

	$("#control-creature-initiative-input").on("keypress", function(event){
		if(event.which == 13){
			controllerCreateCreature();
			$("#control-creature-initiative-input").focus();
			$("#control-creature-initiative-input").select();
			event.preventDefault();	
		}
	})


}

function bindEventsForCreature(id){
	var byId = "#"+id; 

	$(byId + " .caw-input").on("focus", function(){
		$(byId + " .caw-input").select(); 
	});

	$(byId + " .caw-input").on("keypress", function(event){
		if(event.which == 13){
			controllerActionInputParse(this, id); 
			event.preventDefault(); 
			return; 
		}
	});

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
		var val = $("#"+id + " input.creature-temp-hp").val(); 
		controllerModCreatureRecord(this, id, val, RECORD_TYPE.TEMP_HP); 
	});
	$(byId + " .creature-ongoing").on("blur", function(){
		var val = $("#"+id + " input.creature-ongoing").val(); 
		controllerModCreatureRecord(this, id, val, RECORD_TYPE.ONGOING); 
	});
	$(byId + " .creature-regen").on("blur", function(){
		var val = $("#"+id + " input.creature-regen").val(); 
		controllerModCreatureRecord(this, id, val, RECORD_TYPE.REGEN); 
	});			
	$(byId + " .creature-action-point").on("blur", function(){
		var val = $("#"+id + " input.creature-action-point").val(); 
		controllerModCreatureRecord(this, id, val, RECORD_TYPE.AP); 
	});				
	$(byId + " div.creature-close").on("click", function(){
		controllerDeleteCreature(this, id); 
	});

	$(byId + " div.creature-name").editable(function(value, settings){
		return controllerSetCreatureName(id, value); 
	});	

	$(byId + " div.creature-init").editable(function(value, settings){
		return controllerSetCreatureInit(id, value); 
	});		

	$(byId + " span.hp-cur").editable(function(value, settings){
		return controllerSetCurrentHp(id, value); 
	});

	$(byId + " span.hp-max").editable(function(value, settings){
		return controllerSetMaxHp(id, value); 
	});

	$(byId + " div.creature-delay").on("click", function(){
		controllerSetStatus(id, CREATURE_STATUS.DELAYING); 
	});

	$(byId + " div.creature-resume").on("click", function(){
		controllerSetStatus(id, CREATURE_STATUS.ACTIVE); 
	});	

	$(byId + " div.creature-upkeep").on("click", function(){
		controllerUpkeep(id); 
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

function animatedScroll(position){
	$('body').animate({
	    scrollTop: position
	 }, 300);
}

function controllerCursorPrev(){
	var cursor = currentBattle.cursorPrev(); 
	if(cursor != null){
		$("div.active").removeClass("active"); 
		$("#"+cursor.id).addClass("active"); 
		var pixel = $("#"+cursor.id).offset().top - $("#"+cursor.id).height() * 2 - 12; 
		animatedScroll(pixel);
	}else{
		$("div.active").removeClass("active"); d
	}
}

function controllerCursorNext(){
	var cursor = currentBattle.cursorNext(); 
	if(cursor != null){
		$("div.active").removeClass("active"); 
		$("#"+cursor.id).addClass("active");
		var pixel = $("#"+cursor.id).offset().top - $("#"+cursor.id).height() * 2 -12; 
		animatedScroll(pixel);
	}else{
		$("div.active").removeClass("active"); 
	}
}

function controllerUpkeep(creatureId){
	var creature = currentBattle.getCreature(creatureId); 

	//First deal ongoing damage. 
	var ongoing = creature.ongoing; 
	if(ongoing > 0){
		currentBattle.logMessage(creature.toString() + " is taking: " + ongoing + " ongoing damage.", "Controller"); 
		changeHp(ongoing, true, creatureId); 
	}
	if(creature.hpcur <= 0 && creature.regen > 0){
		currentBattle.logMessage(creature.toString() + " cannot regenerate hp because it is dying", "Controller"); 
	}else if(creature.regen > 0){
		currentBattle.logMessage(creature.toString() + " regenerating: " + creature.regen + " hp", "Controller"); 
		changeHp(creature.regen, false, creatureId); 
	}
}

function controllerSetStatus(creatureId, status){
	var creature = currentBattle.getCreature(creatureId); 

	if(creature.status == status){
		return; 
	}

	if(this.currentBattle.cursor != null && this.currentBattle.cursor.id == creatureId && status == CREATURE_STATUS.DELAYING){
		controllerCursorNext(); 
	}

	if(creature.status != status){
		var command = new SetCreatureStatusCommand(currentBattle.getCreature(creatureId), status); 
		executeCommand(command);
	} 

	if(this.currentBattle.cursor != null && status == CREATURE_STATUS.ACTIVE){
		//Calculate a new initiative, as this creature is dropping out. 
		var init = currentBattle.getNextAvailableInit(this.currentBattle.cursor.init);
		controllerSetCreatureInit(creature.id, init);
		drawEffectBounceCreature(creatureId); 
	}	
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

function initMove(event, ui){
	var prevCreatureId = $(ui.item).prevAll(".creature:not(.delaying):first").attr("id");
	var nextCreatureId = $(ui.item).nextAll(".creature:not(.delaying):first").attr("id");

	var prevCreature = (prevCreatureId == undefined) ? null : currentBattle.getCreature(prevCreatureId); 
	var nextCreature = (nextCreatureId == undefined) ? null : currentBattle.getCreature(nextCreatureId); 

	//Both creatures have appropriate initiative scores.
	//The new initiative score for this creature is the difference between the two creatures  
	var newInit = null;
	if(prevCreature == null && nextCreature == null){
		return; 
	} 

	if(prevCreature != null && nextCreature != null){
		newInit = (prevCreature.init - nextCreature.init) / 2 + nextCreature.init; 
	}else if(nextCreature == null){
		newInit = prevCreature.init - 1; 
	}else if(prevCreature == null){
		newInit = nextCreature.init + 1; 
	}

	controllerSetCreatureInit($(ui.item).attr("id"), newInit); 

}

function controllerSetCreatureInit(id, init){
	var init = parseFloat(init); 
	if(!isNaN(init)){
		var command = new SetCreatureInitCommand(currentBattle.getCreature(id), init); 
		executeCommand(command); 
		return init; 
	}
	return currentBattle.getCreature(id).init;
}

function controllerSetCreatureName(id, name){
	if(name.length != 0){
		var command = new SetCreatureNameCommand(currentBattle.getCreature(id), name); 
		executeCommand(command); 
		return name; 
	}else{
		return currentBattle.getCreature(id).name; 
	}
}

function controllerSetMaxHp(id, hp){
	var value = parseInt(hp); 
	if(!isNaN(value)){
		var command = new SetCreatureMaxHpCommand(currentBattle.getCreature(id), hp); 
		executeCommand(command); 
		return value; 		
	}else{
		return currentBattle.getCreature(id).hpmax; 
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

function controllerModCreatureRecord(event, id, value, record){
	var val = parseInt(value); 
	var command; 
	if(!isNaN(val)){
		switch(record){
			case RECORD_TYPE.TEMP_HP:
				command = new SetCreatureTempHpCommand(val, currentBattle.getCreature(id));
				break; 
			case RECORD_TYPE.REGEN:
				command = new SetCreatureRegenCommand(val, currentBattle.getCreature(id));
				break; 
			case RECORD_TYPE.ONGOING:
				command = new SetCreatureOngoingCommand(val, currentBattle.getCreature(id)); 
				break;
			case RECORD_TYPE.AP:
				command = new SetCreatureAPCommand(val, currentBattle.getCreature(id)); 
				break; 
			default: 
				throw "Record change not recognized"; 
		}
		executeCommand(command); 
	}else{
		drawCreatureRecords(currentBattle.getCreature(id)); 
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

function changeHp(val, subtraction, id){
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

function controllerActionInputParse(event, id){
	var val = $("#"+id + " input.caw-input").val();

	var isHp = /^[+-]?[0-9]*[0-9]$/.test(val);

	if(isHp){
		var sign = val.substr(0,1); 

		switch(sign){
			case '+':
				changeHp(parseInt(val), false, id); 
				break; 
			case '-':
				changeHp(parseInt(val), false, id);
				break; 
			default:
				changeHp(parseInt(val), true, id);  
		}
	}else{
		//var isEffect = /[A-Za-z-$]/.test(val); 
		var newEffectName; 
		var e = getEffectFromString(val); 
		controllerAddEffect(null, e.type, id, e.name); 	
	}
}



function controllerChangeHp(event, subtraction, id){
	var val = parseInt($("#"+id + " input.caw-input").val()); 
	changeHp(val, subtraction, id); 
}


function controllerAddEffect(event, effectType, id, value){
	var effectName = (value == undefined) ? $("#"+id +" input.caw-input").val() : value; 
	if(effectName == ""){
		return; 
	}
	var command = new AddEffectCommand(effectName, effectType, id); 
	executeCommand(command);  
}