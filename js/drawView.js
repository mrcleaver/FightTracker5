function drawCreatureRecords(creature){
	var byId = "#"+creature.id; 
	var temp = $(byId+ " .creature-temp-hp"); 
	var ongoing = $(byId+ " .creature-ongoing"); 
	var regen = $(byId+ " .creature-regen"); 
	var ap = $(byId+ " .creature-action-point"); 

	if(creature.temp != 0){
		temp.val(creature.temp); 
	}else{
		temp.val(""); 
	}

	if(creature.ongoing != 0){
		ongoing.val(creature.ongoing); 
	}else{
		ongoing.val(""); 
	}

	if(creature.regen != 0){
		regen.val(creature.regen); 
	}else{
		regen.val(""); 
	}

	if(creature.ap != 0){
		ap.val(creature.ap); 
	}else{
		ap.val(""); 
	}
}

function drawCreatureStatus(creature){
	var status = $("#"+creature.id);
	switch(creature.status){
		case CREATURE_STATUS.DELAYING:
			$(status).removeClass("active inactive").addClass("delaying"); 
			break; 
		case CREATURE_STATUS.INACTIVE:
			$(status).removeClass("delaying active").addClass("inactive"); 
			break;
		default:
			$(status).removeClass("active inactive delaying"); 			
	}
}

function drawCreatureEffects(creature){
	var effects = $("#"+creature.id + " ul.creature-effects").find("li>span"); 
	var it = creature.effects.iterator(); 
	effects.each(function(index){
		if(it.hasNext()){
			var effect = it.next().data; 
			switch(effect.type){
				case EFFECT_TYPE.POSITIVE:
					$(this).removeClass().addClass("label label-success").text(effect.name).attr("id",effect.id);
					break; 
				case EFFECT_TYPE.NEGATIVE:
					$(this).removeClass().addClass("label label-important").text(effect.name).attr("id",effect.id);
					break; 
				default:
					$(this).removeClass().addClass("label").text(effect.name).attr("id",effect.id); 
			}			
		}else{
			$(this).removeClass().addClass("label").text("Effect").removeAttr("id"); 
		}
	});
}

function drawUpdateCreatureName(id){
	var name = $("#"+id).find(".creature-name"); 
	var creature = currentBattle.getCreature(id); 
	name.text(creature.name); 
}

function drawUpdateCreatureHp(id){
	var stats = $("#"+id).find(".creature-left");
	var creature = currentBattle.getCreature(id); 
	stats.find("span.hp-cur").text(creature.hpcur); 
	stats.find("span.hp-max").text(creature.hpmax); 
	stats.find("span.hp-percent").text(((creature.hpcur / creature.hpmax) * 100).toPrecision(4)); 
}

function redrawCreature(creature, newAfterPosition){
	var creatureDom = $("#"+creature.id); 
	creatureDom.detach(); 
	if(newAfterPosition != null){
		creatureDom.insertAfter("#"+newAfterPosition); 
	}else{
		creatureDom.prependTo("#fightcontainer"); 
	}
	creatureDom.find(".creature-init").text(creature.init); 
}

function drawCreature(creature, afterPosition){
	var prototype = $("#creature-prototype").clone(); 
	prototype.attr("id", creature.id).removeClass("nodisplay"); 
	var innerCreature = prototype.find(".creature-left");
	
	prototype.find(".creature-name").text(creature.name); 
	prototype.find(".creature-init").text(creature.initStart); 
	innerCreature.find("span.hp-cur").text(creature.hpcur); 
	innerCreature.find("span.hp-max").text(creature.hpmax); 
	innerCreature.find("span.hp-percent").text(((creature.hpcur / creature.hpmax) * 100).toPrecision(4));

	if(afterPosition != null){
		prototype.insertAfter("#"+afterPosition); 
	}else{
		prototype.prependTo("#fightcontainer"); 
	}

}

function drawDeleteCreature(creature){
	$("#"+creature.id).remove(); 
}