// http://davidwalsh.name/javascript-clone
function clone(src) {
	function mixin(dest, source, copyFunc) {
		var name, s, i, empty = {};
		for(name in source){
			// the (!(name in empty) || empty[name] !== s) condition avoids copying properties in "source"
			// inherited from Object.prototype.	 For example, if dest has a custom toString() method,
			// don't overwrite it with the toString() method that source inherited from Object.prototype
			s = source[name];
			if(!(name in dest) || (dest[name] !== s && (!(name in empty) || empty[name] !== s))){
				dest[name] = copyFunc ? copyFunc(s) : s;
			}
		}
		return dest;
	}

	if(!src || typeof src != "object" || Object.prototype.toString.call(src) === "[object Function]"){
		// null, undefined, any non-object, or function
		return src;	// anything
	}
	if(src.nodeType && "cloneNode" in src){
		// DOM Node
		return src.cloneNode(true); // Node
	}
	if(src instanceof Date){
		// Date
		return new Date(src.getTime());	// Date
	}
	if(src instanceof RegExp){
		// RegExp
		return new RegExp(src);   // RegExp
	}
	var r, i, l;
	if(src instanceof Array){
		// array
		r = [];
		for(i = 0, l = src.length; i < l; ++i){
			if(i in src){
				r.push(clone(src[i]));
			}
		}
		// we don't clone functions for performance reasons
		//		}else if(d.isFunction(src)){
		//			// function
		//			r = function(){ return src.apply(this, arguments); };
	}else{
		// generic objects
		r = src.constructor ? new src.constructor() : {};
	}
	return mixin(r, src, clone);

}



// Loading
var DB = {	ITEMS				:[],
			LOCATIONS			:[],
			MONSTERS			:[],
			CUSTOMIZE			:[],
			AEONABILITY			:[],
			HASH_ITEMS			:[],
			HASH_AEONABILITY	:[],
			HASH_CUSTOMIZE		:[],
			HASH_LOCATIONS		:[],
			HASH_MONSTERS		:[]
};

var db_k = Object.keys(DB),
	load_count = 0;

function loadDB(type){
	var xhr = new XMLHttpRequest();
	console.log('_'+type+'.json');
	xhr.open("GET", '_'+type+'.json', true);
	xhr.onreadystatechange = function(){
		if (this.readyState != 4/* || this.status != 200*/)
			return;
		DB[type] = JSON.parse(this.responseText);
		++load_count;

		console.log(type,'load count',load_count)
		if(load_count == db_k.length){
			loadScreen();
		}
	}

	xhr.send();
}

for(var i in db_k){
	loadDB(db_k[i]);
}

// Functions
function ID(a){return document.getElementById(a);}
function createOption(val,name){
	var opt = document.createElement('option');
	opt.value = val;
	opt.textContent = name;
	return opt;
}
function sortStringByName(a,b){
	if ( a.name < b.name )
		return -1;
	if ( a.name > b.name )
		return 1;
	return 0;
}

function copyResult(e){
	if(!ID(e.target.parentNode.parentNode.id.substring(1))){
		var copyResult = e.target.parentNode.parentNode.cloneNode(true);
		copyResult.id = copyResult.id.substring(1);

		copyResult.children[1].children[1].addEventListener('click',deleteCopy);

		ID('copy_target').appendChild(copyResult);
		saveState.draft[copyResult.id] = 1;

		saveData();
	}
}
function deleteCopy(e){
	var fieldset = e.target.parentNode.parentNode,
		id = fieldset.id;

	fieldset.parentNode.removeChild(fieldset);

	delete(saveState.draft[id]);
	
	saveData();
}

function loadSelect(type){
	var select = ID('_'+type),
		tmpArr = clone(DB[type]),
		i, extra_buttons;
	
	select.children[0].textContent = '---';
	if(type == 'ITEMS')
		delete(tmpArr[0]);
	tmpArr.sort(sortStringByName);
	console.log('Sorted ',type,tmpArr);
	for(i in tmpArr){
		select.appendChild(createOption(DB['HASH_'+type][tmpArr[i].name],tmpArr[i].name))
	}

	select.addEventListener('change',searchBy);

	extra_buttons = select.parentNode	//fieldset
						  .children[2]	//fieldset > fieldset.result_content
						  .children[1];	//fieldset > fieldset.result_content > div.top_right_buttons

	extra_buttons.children[0].addEventListener('click',copyResult);

	ID('loadState').addEventListener('click',loadState);
}
function loadScreen(){
	ID('loading').style.display = 'none';

	loadSelect('ITEMS');
	loadSelect('AEONABILITY');
	loadSelect('CUSTOMIZE');
	loadSelect('MONSTERS');

	loadData();
}
/**
	Text description formatting
**/
function textBuy(item){
	return item.price+' Gil : '+DB.LOCATIONS[item.location].name;
}
function textCustom(item){
	return item.qnt+(item.qnt.length > 3 ? '' : 'x')+' - '+DB.CUSTOMIZE[item.name].name;
}
function textAeon(item){
	return item.qnt+(item.qnt.length > 3 ? '' : 'x')+' - '+DB.AEONABILITY[item.name].name;
}
function textFound(item){
	return item.type+' - '+item.qnt+' = '+DB.LOCATIONS[item.location].name;
}
function textBribe(item,extId){
	var monster = DB.MONSTERS[item.monster].Bribe;
	return DB.MONSTERS[item.monster].name+': '+monster.qnt+'x - '+monster.price.toLocaleString()+' Gil ('+Math.ceil(monster.ppi.toLocaleString())+' Gil per item)';
}
function textSteal(item,extId){
	var monster = DB.MONSTERS[item.monster].Steal,
		tmp = ['<b>'+DB.MONSTERS[item.monster].name+'</b>'],
		normal = false;

	if(monster.normal && (extId === null || monster.normal.item == extId)){
		normal = true;
		tmp.push(monster.normal.qnt);
	} else {
		tmp.push('');
	}
	if(monster.rare && (extId === null || monster.rare.item == extId)){
		normal = true;
		tmp.push(monster.rare.qnt);
	} else {
		tmp.push('');
	}

	console.log(tmp, monster, extId);
	if(normal == false)
		return false;

	return tmp;
}
function textDrop(item, extId){
	var monster = DB.MONSTERS[item.monster].Drop,
		tmp = ['<b>'+DB.MONSTERS[item.monster].name+'</b>'],
		normal = false;

	if(monster.normal && (extId === null || monster.normal.item == extId)){
		tmp.push(monster.normal.normal+' ('+monster.normal.ok+')');
		normal = true;
	} else {
		tmp.push('');
	}
	if(monster.rare && (extId === null || monster.rare.item == extId)){
		tmp.push(monster.rare.normal+' ('+monster.rare.ok+')');
		normal = true;
	} else {
		tmp.push('');
	}

	console.log(tmp, monster, extId);
	if(normal == false)
		return false;

	return tmp;
}
/**
	Structure makers
**/
function createP(title,value){
	var p = document.createElement('p');
	p.innerHTML = (title ? '<b>'+title+'</b>: ' : '')+(value ? value : '');
	return p;
}
function createList(data,func,extId){
	var ul = document.createElement('ul'),
		li, i, tmp = [];

	if(func){
		for(i in data){
			tmp[i] = func(data[i],extId);
		}
	} else {
		// Need to clone or it will overwrite the BD
		tmp = clone(data);
	}

	for(i in tmp){
		if(tmp[i]){
			li = document.createElement('li');
			li.innerHTML = tmp[i];
			ul.appendChild(li);
		}
	}
	return ul;
}
function createTable(data,func,extId,header){
	var table = document.createElement('table'),
		tr, td, i, j, tmp = [];

	console.log(data);
	if(func){
		for(i in data){
			tmp[i] = func(data[i],extId);
		}
	} else {
		// Need to clone or it will overwrite the BD
		tmp = clone(data);
	}
	console.log(tmp);

	if(header){
		tr = document.createElement('tr');
		for(j in header){
			td = document.createElement('th');
			td.innerHTML = header[j];
			tr.appendChild(td);
		}
		table.appendChild(tr);
	}
	for(i in tmp){
		if(tmp[i]){
			tr = document.createElement('tr');
			for(j in tmp[i]){
				td = document.createElement('td');
				td.innerHTML = tmp[i][j];
				tr.appendChild(td);
			}
			table.appendChild(tr);
		}
	}
	return table;
}
/**
	User searches
**/
function printItem(db_row, ul, id_item){
	ul.appendChild(createP('Item Name', db_row.name));

	if(db_row.Desc && db_row.Desc.length > 0){
		ul.appendChild(createP('Description'));
		ul.appendChild(createList(db_row.Desc));
	}

	if(db_row.Custom && db_row.Custom.length > 0){
		ul.appendChild(createP('Customization'));
		ul.appendChild(createList(db_row.Custom, textCustom));
	}

	if(db_row.Ability && db_row.Ability.length > 0){
		ul.appendChild(createP('Aeon Abilities'));
		ul.appendChild(createList(db_row.Ability, textAeon));
	}

	if(db_row.Steal && db_row.Steal.length > 0){
		ul.appendChild(createP('Steal'));
		ul.appendChild(createTable(db_row.Steal, textSteal, id_item, ['Monster', 'Normal', 'Rare']));
	}

	if(db_row.Drop && db_row.Drop.length > 0){
		ul.appendChild(createP('Drop'));
		ul.appendChild(createTable(db_row.Drop, textDrop, id_item, ['Monster', 'Normal', 'Rare']));
	}

	if(db_row.Bribe && db_row.Bribe.length > 0){
		ul.appendChild(createP('Bribe'));
		ul.appendChild(createList(db_row.Bribe, textBribe, id_item));
	}

	if(db_row.Buy && db_row.Buy.length > 0){
		ul.appendChild(createP('Buy'));
		ul.appendChild(createList(db_row.Buy,textBuy));
	}

	if(db_row.Sell && db_row.Sell.length > 0){
		ul.appendChild(createP('Sell',db_row.Sell+' Gil'));
	}

	if(db_row.Found && db_row.Found.length > 0){
		ul.appendChild(createP('Found'));
		ul.appendChild(createList(db_row.Found,textFound));
	}

	if(db_row.Other && db_row.Other.length > 0){
		ul.appendChild(createList(db_row.Other));
	}

	return ul;
}
function printMonster(db_row, ul, id_item){
	var tmp = [];//, item;
	ul.appendChild(createP('Monster Name', db_row.name));

	ul.appendChild(createP('Location',DB.LOCATIONS[db_row.location].name));
	if(db_row.extra)
		ul.appendChild(createP('',db_row.extra));

	if(db_row.Bribe && db_row.Bribe.item){
		ul.appendChild(createP('Bribe','('+Math.round(db_row.Bribe.ppi)+'Gil) '+db_row.Bribe.qnt+'x '+DB.ITEMS[db_row.Bribe.item].name+' for '+db_row.Bribe.price+'Gil'));
	}

	if(db_row.Steal){
		ul.appendChild(createP('Steal'));
		tmp = [];
		if(db_row.Steal.normal){
			//item = db_row.Steal.normal.item
			tmp.push('Normal: '+db_row.Steal.normal.qnt+'x '+DB.ITEMS[db_row.Steal.normal.item].name);
		}
		if(db_row.Steal.rare){
			tmp.push('Rare: '+db_row.Steal.rare.qnt+'x '+DB.ITEMS[db_row.Steal.rare.item].name);
		}

		ul.appendChild(createList(tmp));
	}

	if(db_row.Drop){
		ul.appendChild(createP('Drop'));
		tmp = [];
		if(db_row.Drop.normal){
			tmp.push('Normal: '+db_row.Drop.normal.normal+'x '+DB.ITEMS[db_row.Drop.normal.item].name+' (OK '+db_row.Drop.normal.ok+'x)');
		}
		if(db_row.Drop.rare){
			tmp.push('Rare: '+db_row.Drop.rare.normal+'x '+DB.ITEMS[db_row.Drop.rare.item].name+' (OK '+db_row.Drop.rare.ok+'x)');
		}

		ul.appendChild(createList(tmp));
	}

	return ul;
}
function loadState(){
	var SS = JSON.parse(ID('saveState').value),
		tmp,
		fieldset, legend, div;
	/*
			<fieldset class='result_content' id='ITEMS_RESULT'>
				<legend>Customize</legend>
				<div class="top_right_buttons">
					<div class='copy'>Copy</div>
					<div class='delete'>Delete</div>
				</div>
				<div class="results"></div>				
			</fieldset>
	*/
	for(var i in SS.draft){
		tmp = i.split('|');

		fieldset = document.createElement('fieldset');
		fieldset.id = i;
		fieldset.className = 'result_content';

		legend = document.createElement('legend');
		legend.textContent = tmp[i];

		div = [document.createElement('div'),document.createElement('div')];
		div[0].className = 'top_right_buttons';
		div[1].className = 'delete';
		div[1].addEventListener('click',deleteCopy);
		div[1].textContent = 'Delete';
		div[0].appendChild(div[1]);

		fieldset.appendChild(legend);
		fieldset.appendChild(div[0]);

		div = document.createElement('div');
		div.className = 'results';
		
		fieldset.appendChild(div);

		ID('copy_target').appendChild(fieldset);
		searchBy(null,fieldset,div)
	}
}
function searchBy(e,copyFieldset,result){
	if(!e){
		var tmp = copyFieldset.id.split('|'),
			value = tmp[1],
			type = tmp[0],
			result = result,
			copyFieldset = copyFieldset;
	} else {
		var type = e.target.id.substring(1),
			copyFieldset = e.target.parentNode.children[2],
			result = copyFieldset.children[2],
			value = e.target.value;
		
		copyFieldset.id = '_'+type+'|'+value;
	}
	var db_row,
		tmp, i,

		hash;

	while(result.children.length > 0){
		result.removeChild(result.children[0]);
	}


	if(DB[type][value]){
		db_row = DB[type][value];
		console.log(db_row);

		switch(type){
			case 'ITEMS':
				printItem(db_row, result, value);
				//result.appendChild(createP('RAW JSON',JSON.stringify(DB['ITEMS'][value])));
			break;
			case 'AEONABILITY':
				tmp = {};
				tmp.hash = DB.HASH_AEONABILITY[db_row.name];
				tmp.item = DB.ITEMS[db_row.item];

				result.appendChild(createP('Ability Name', db_row.name));
				printItem(tmp.item, result, null);
			break;
			case 'CUSTOMIZE':
				tmp = {};
				tmp.hash = DB.HASH_CUSTOMIZE[db_row.name];
				tmp.item = DB.ITEMS[db_row.item];

				result.appendChild(createP('Customization Ability', db_row.name));
				printItem(tmp.item, result, null);
			break;
			case 'MONSTERS':
			default:
				tmp = {};
				tmp.hash = DB.HASH_MONSTERS[db_row.name];
				//tmp.item = DB.ITEMS[db_row.item];

				printMonster(db_row, result, null)
			break;
		}
	}

	//result.textContent = type;
}


function saveData(){
	var tmp = JSON.stringify(saveState);
	localStorage.setItem('storeData',tmp);
	ID('saveState').value = tmp;
}
function loadData(){
	var tmp = localStorage.getItem('storeData');
	if(tmp){
		saveState = JSON.parse(tmp);
		ID('saveState').value = tmp;
		loadState();
	}
}

var saveState = {draft : {}};
