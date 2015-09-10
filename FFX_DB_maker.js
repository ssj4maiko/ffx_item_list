'use strict';
//Stringified Indexes
var ITEMS		= [],
	MONSTERS	= [],
	CUSTOM		= [],
	AEONABILITY	= [],
	LOCATION	= [],

	//Normalized Indexes
	HASH_ITEMS			= {},
	HASH_MONSTERS		= {},
	HASH_CUSTOM			= {},
	HASH_AEONABILITY	= {},
	HASH_LOCATION		= {},

	ns = [
		 'Desc'		// 0
		,'Custom'	// 1
		,'Ability'	// 2
		,'Buy'		// 3
		,'Sell'		// 4
		,'Steal'	// 5
		,'Drop'		// 6
		,'Bribe'	// 7
		,'Found'	// 8
		,'Other'	// 9
	]
	;

var createHash = function(type, content){
	console.log(type);
	switch(type.toLowerCase()){
		case 'custom':
			if(typeof HASH_CUSTOM[content.name] == 'undefined'){
				CUSTOM.push(content);
				HASH_CUSTOM[content.name] = CUSTOM.length-1;
			}
			return HASH_CUSTOM[content.name];
		break;
		case 'ability':
			if(typeof HASH_AEONABILITY[content.name] == 'undefined'){
				AEONABILITY.push(content);
				HASH_AEONABILITY[content.name] = AEONABILITY.length-1;
			}
			return HASH_AEONABILITY[content.name];
		break;
		case 'monster':
			if(typeof HASH_MONSTERS[content.name] == 'undefined'){
				MONSTERS.push(content);
				HASH_MONSTERS[content.name] = MONSTERS.length-1;
			} else {
				//Steal

				//Drop
			}
			return HASH_MONSTERS[content.name];
		break;
		case 'location':
			if(typeof HASH_LOCATION[content.name] == 'undefined'){
				LOCATION.push(content);
				HASH_LOCATION[content.name] = LOCATION.length-1;
			}
			return HASH_LOCATION[content.name];
		break;
	}
}

var parse_data = function(nr,row,extra){
	//console.log('Parse data',nr,'e linha',row);
	var key,val, tmp = {};
	switch(nr){
		case 1:
		case 2:
		break;
		case 3: 	// Buy
			//Rin's Item Shop = Airship      (110 Gil)
			row = row.split('(');
			val = row[row.length-1];
			row.splice(-1);
			key = row.join('(');
			val = {	
				location : createHash('location',{ name : key.trim()}),
				price : parseInt(val.toLowerCase().replace('gil)','').trim())
			};
		break;
		case 5: 	// Steal
			//Evrae        - 1,2 = Airship
			row = row.split(' - ');
			console.log(row);
			val = row[1].split('=');
			val[0] = val[0].trim().split(',');
			val[1] = val[1].trim();

			key = {};
			key.name = row[0].trim();
			key.location = createHash('location', { name : val[1] });

			val = { monster : createHash('monster', key),
					normal : parseInt(val[0][0].trim()),
					rare : parseInt(val[0][1].trim())
			};
		break;
		case 6: 	// Drop
			//Evrae Atlana  - 1,2;1,2 = Via Purifico
			row = row.split(' - ');
			console.log(row);
			val = row[1].split('=');
			val[0] = val[0].trim().split(';');

			if(val[0][0] == '')
				val[0][0] = ['',''];
			else
				val[0][0] = val[0][0].split(',');

			if(!val[0][1] || val[0][1] == '')
				val[0][1] = ['',''];
			else
				val[0][1] = val[0][1].split(',');
			val[1] = val[1].trim();

			tmp = { 
				normal: {normal: 0, overkill: 0},
				rare: {normal: 0, overkill: 0}
			};

			key = {name:''};
			key.name = row[0].trim();

			row = val[0][0][0].trim();
			if(row != ''){
				tmp.normal.normal = parseInt(row);
			}
			row = val[0][0][1].trim();
			if(row != ''){
				tmp.normal.overkill = parseInt(row);
			}
			row = val[0][1][0].trim();
			if(row != ''){
				tmp.rare.normal = parseInt(row);
			}
			row = val[0][1][1].trim();
			if(row != ''){
				tmp.rare.overkill = parseInt(row);
			}
			
			key.location = createHash('location', { name : val[1] });
			if(extra != '')
				key.extra = extra;

			tmp.monster = createHash('monster', key),
			val = tmp;

			//ITEMS[current_item][ns[nr]].push(val);
		break;
		case 7: 	// Bribe
		 	//Octopus       - 20 ( 90,000 Gil) = Via Purifico     (4,500)
			key = {};
			row = row.split(' - ');
			key.name = row.shift().trim();
			
			row = row.join('-').split('=');
			row[0] = row[0].trim().split('(');

			row[1] = row[1].split('(')[0].trim();

			key.location = createHash('location', { name : row[1] });

			val = { monster : createHash('monster', key),
					qnt : parseInt(row[0][0].trim()),
					price : parseInt(row[0][1].replace(',','').replace('Gil','').replace(')','').trim())
				};
			val.ppi = val.price / val.qnt;
		 break;
		 case 8: 	// Found
			//Chest  - 8 = Sanubia Desert: West
			//Corpse - 2 = Home
			row = row.split(' - ');
			tmp.type = row.shift().trim();
			row = row.join(' - ').split('=');
			tmp.qnt = row.shift().trim();
			tmp.location = row[0].trim();

			val = { location : createHash('location', { name : tmp.location }),
					type : tmp.type,
					qnt : parseInt(tmp.qnt)
			}
		 break;
		 case 9: 	// Others
			//Prize  - 99 = Unlock Cactuar King
			// - Capture 1 of each fiend from Thunder Plains
			/*
			row = row.split('-');
			tmp.type = row.shift().trim();
			row = row.join('-').split('=');
			tmp.qnt = row.shift().trim();
			tmp.location = row[0].trim();

			key = {};
			key.location = createHash('location', { name : tmp.location });
			key.name = tmp.monster;
			*/
			val = row;
		 break;
	}
	return val;
}


var read_content = function(current_item, file,i){
	var  nr = 0, j
		,item = []

		,key
		,val
		,extra
		,test

		,tmp
		,tmp2
		,currentRow = {}
		,internalArray = [];

	console.log(i);

	//console.log(nr, file[i]);
	for(;nr != 10 && !(nr == 9 && file[i] == '');++i){
		console.log(nr,file[i]);
		/*
		if(!item[nr]){
			item[nr] = [];
		}
		*/

		// If still in the first 3 items
		/*if(i > 415){
			//console.log(i);
			break;
		}*/
		/*
		test = file[i].replace(/-/g,' ').trim();
		if(test == ''){
			continue;
		}
		*/
		//file[i] = file[i].replace('\r','');

		if(nr < 3){
			console.log(i, nr, file[i], file[i].trim());
			if(file[i].trim() == ''){
				console.log(i,'Next');
				nr = 3;
				continue;
			}

			tmp = file[i].substr(6);

			if(tmp.indexOf('Customization') != -1){
				nr = 1;
				//console.log('Customization ',tmp);
			}
			else if(tmp.indexOf('Aeon') != -1){
				nr = 2;
				//console.log('Aeon ',tmp);
			}

			if(typeof ITEMS[current_item][ns[nr]] == 'undefined')
				ITEMS[current_item][ns[nr]] = [];

			// Save Description of the item
			if(nr == 0){

				tmp = [];
				tmp.push(file[i].substr(6));
				console.log(i);

				while(file[i+1].indexOf('      ') > -1 && file[i+1].trim() != ''){
					++i;
					tmp.push(file[i].substr(6).trim());
					console.log(i, 'Inside While 1',current_item, nr);
				}
				ITEMS[current_item][ns[nr]].push(tmp.join(' '));
			}
			else {
				//Starts saving Custom and Description
				item[nr] = [];
				while(file[i+1].indexOf('      ') > -1 && file[i+1].trim() != ''){
					++i;
					tmp = file[i].split(':');
					/*
					console.log(ITEMS[current_item], ns[nr])
					console.log(current_item,nr,tmp[0].trim());

					console.log(tmp);
					*/
					tmp[1] = tmp[1].trim();
					tmp2 = tmp[1].split(' ');
					if(tmp2.indexOf('[') !== false){
						tmp2 = tmp[1];
					} else {
						tmp2 = tmp[1].split(' ').shift();
					}
					ITEMS[current_item][ns[nr]].push({
						//createHash('location', { name : val[1] })
						 name : createHash(ns[nr], {name: tmp[0].trim()})
						,qnt  : tmp2
					});
					console.log(i, 'Inside While 2',current_item, nr, tmp);
				}
			}
		}
		else {
			tmp = file[i];
			console.log(i);
			for(j = 3; j<ns.length; ++j){
				if(tmp.indexOf(ns[j]+':') != -1){
					nr = j;
					console.log(j,ns[j]);
					break;
				}
				console.log(nr,tmp,' and ',tmp.trim());
				if(nr==9 && tmp.trim() == ''){
					nr=10;
				}
			}
			if(typeof ITEMS[current_item][ns[nr]] == 'undefined'){
				if(nr == 4)
					ITEMS[current_item][ns[nr]] = null;
				else
					ITEMS[current_item][ns[nr]] = [];
			}

			tmp = file[i].substr(6).trim();

			console.log(i);
			switch(nr){
				case 3: 	// Buy
					console.log(i,file[i],' | ',tmp);
					if(tmp != 'N/A'){
						ITEMS[current_item][ns[nr]].push(		parse_data(nr,tmp)	);
						while(file[i+1].indexOf('      ') > -1 && file[i+1].trim() != ''){
							++i;
							tmp = file[i].substr(6);
							//console.log('Test buy',tmp);
							ITEMS[current_item][ns[nr]].push(	parse_data(nr,tmp)	);
						}
						/*
						console.log('Compra',i, ns[nr], ITEMS[current_item][ns[nr]]);
						if(i > 513){
							return file.length;
						}
						*/
					}
				break;
				case 4: 	// Sell
					if(tmp.indexOf('Gil') > 0){
						val = tmp.toLowerCase().replace('gil','').trim();
						ITEMS[current_item][ns[nr]] = val;
						//console.log('Sell',ns[nr], ITEMS[current_item][ns[nr]]);
					}
				break;
				case 5: 	// Steal
					if(tmp != 'N/A'){
						extra = '';
						while(file[i+1].indexOf('         -') === 0 || file[i+1].substr(0,10).trim() == ''){
							++i;
							extra+= file[i].substr(6).trim()+' ';
							console.log(i);

						}
						ITEMS[current_item][ns[nr]].push(	parse_data(nr,tmp,extra)	);
					}
				break;
				case 6: 	// Drop
					if(tmp != 'N/A'){
						extra = '';
						while(file[i+1].indexOf('         -') === 0 || file[i+1].substr(0,10).trim() == ''){
							++i;
							extra+= file[i].substr(6).trim()+' ';
							console.log(i);

						}
						if(extra != ''){
							console.log(extra);
						}
						ITEMS[current_item][ns[nr]].push(	parse_data(nr,tmp,extra)	);
					}
				break;
				case 7: 	// Bribe
					if(tmp != 'N/A'){
						ITEMS[current_item][ns[nr]].push(	parse_data(nr,tmp)	);
					}
				break;
				case 8: 	// Found
					if(tmp != 'N/A'){
						ITEMS[current_item][ns[nr]].push(	parse_data(nr,tmp)	);
					}
				break;
				case 9: 	// Others
					if(tmp != 'N/A'){
						ITEMS[current_item][ns[nr]].push(		parse_data(nr,tmp)	);
						while(file[i+1].indexOf('      ') > -1 && file[i+1].trim() != ''){
							++i;
							tmp = file[i].substr(6);
							ITEMS[current_item][ns[nr]].push(	parse_data(nr,tmp)	);
							console.log(i);
						}
						//console.log('Others',i, ns[nr], ITEMS[current_item][ns[nr]]);
					}
				break;
				default:
					console.log('Shouldn\'t have gotten here',nr,tmp);
			}
			console.log(i);
		}
	}
	// return to next line
	return i;
}

var parse_item_guide = function (file) {
	var i = 0, j, tmp, end = 3614//690//file.length
		,h_new
		,index = 0
		,current_item = false
		,name = ''
		,test
		,ul = document.createElement('ul');
	console.log('i',i,'end',end);

	for(;i < end;++i){
		h_new = file[i].indexOf('+ ') === 0;
		//console.log(i,h_new,file[i]);

		// Skip empty or useless lines
		test = file[i].replace(/-/g,' ').trim();
		if(test != ''){
			if(current_item !== false || h_new){
				if(h_new){
					current_item = index;
					++index;

					name = file[i].substr(2).replace('\r','');
					ITEMS.push({'name' : name});
					HASH_ITEMS[name] = current_item;
				}
				else {
					if(current_item != 0){
						console.log(i);
						i = read_content(current_item, file,i);
						console.log(i);
					}
				}
			}
		}
	}

	// Fixing some later stuff

	for(i=1;i<ITEMS.length;++i){
		if(ITEMS[i].Ability && ITEMS[i].Ability.length > 0){
			for(j in ITEMS[i].Ability){
				AEONABILITY[ITEMS[i].Ability[j].name].item = i;
			}
		}
		if(ITEMS[i].Custom && ITEMS[i].Custom.length > 0){
			for(j in ITEMS[i].Custom){
				CUSTOM[ITEMS[i].Custom[j].name].item = i;
			}
		}
		if(ITEMS[i].Drop && ITEMS[i].Drop.length > 0){
			for(j in ITEMS[i].Drop){
				tmp = ITEMS[i].Drop[j];
				if(!MONSTERS[tmp.monster].Drop)
					MONSTERS[tmp.monster].Drop = {};

				if(tmp.normal.normal > 0){
					MONSTERS[tmp.monster].Drop.normal = {item: i, normal: tmp.normal.normal, ok: tmp.normal.overkill};
				}
				if(tmp.rare.normal > 0){
					MONSTERS[tmp.monster].Drop.rare = {item: i, normal: tmp.rare.normal, ok: tmp.rare.overkill};
				}
				delete(ITEMS[i].Drop[j].normal.normal);
				delete(ITEMS[i].Drop[j].normal.overkill);
				delete(ITEMS[i].Drop[j].rare.normal);
				delete(ITEMS[i].Drop[j].rare.overkill);
				delete(ITEMS[i].Drop[j].normal);
				delete(ITEMS[i].Drop[j].rare);
			}
		}
		if(ITEMS[i].Bribe && ITEMS[i].Bribe.length > 0){
			for(j in ITEMS[i].Bribe){
				tmp = ITEMS[i].Bribe[j];

				MONSTERS[tmp.monster].Bribe = {}

				MONSTERS[tmp.monster].Bribe.item = i;
				MONSTERS[tmp.monster].Bribe.ppi = tmp.ppi;
				MONSTERS[tmp.monster].Bribe.price = tmp.price;
				MONSTERS[tmp.monster].Bribe.qnt = tmp.qnt;
				delete(ITEMS[i].Bribe[j].qnt);
				delete(ITEMS[i].Bribe[j].price);
				delete(ITEMS[i].Bribe[j].ppi);
			}
		}
		if(ITEMS[i].Steal && ITEMS[i].Steal.length > 0){
			for(j in ITEMS[i].Steal){
				tmp = ITEMS[i].Steal[j];

				if(!MONSTERS[tmp.monster].Steal)
					MONSTERS[tmp.monster].Steal = {};

				if(tmp.normal > 0)
					MONSTERS[tmp.monster].Steal.normal = {item:i, qnt: tmp.normal};
				delete(ITEMS[i].Steal[j].normal)
				if(tmp.rare > 0)
					MONSTERS[tmp.monster].Steal.rare = {item:i, qnt: tmp.rare};
				delete(ITEMS[i].Steal[j].rare)
			}
		}
		//Steal
		//
	}

	makeForm(ul,ITEMS,'ITEMS');
	makeForm(ul,MONSTERS,'MONSTERS');
	makeForm(ul,CUSTOM,'CUSTOMIZE');
	makeForm(ul,AEONABILITY,'AEONABILITY');
	makeForm(ul,LOCATION,'LOCATIONS');
	makeForm(ul,HASH_ITEMS,'HASH_ITEMS');
	makeForm(ul,HASH_MONSTERS,'HASH_MONSTERS');
	makeForm(ul,HASH_CUSTOM,'HASH_CUSTOMIZE');
	makeForm(ul,HASH_AEONABILITY,'HASH_AEONABILITY');
	makeForm(ul,HASH_LOCATION,'HASH_LOCATIONS');

	document.getElementById('corpo').appendChild(ul);
}

function makeForm(ul,json,name){
	var ol = document.createElement('ol'),
		text = document.createElement('textarea'),
		but = document.createElement('button');

	text.name = name;
	text.id = name;
	text.value = JSON.stringify(json);

	but.textContent = 'Download _'+name+'.json';
	but.setAttribute('onclick','download(document.getElementById(\''+name+'\'))');

	ol.textContent = name;
	ol.appendChild(text);
	ol.appendChild(but);

	ul.appendChild(ol);
}

function download(el) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(el.value));
	element.setAttribute('download', '_'+el.id+'.json');

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

var xhr = new XMLHttpRequest();
xhr.open("GET", 'final_fantasy_x_item_list_b.txt', true);
xhr.onreadystatechange = function(){
	if (this.readyState != 4/* || this.status != 200*/)
		return;
	parse_item_guide(this.responseText.split("\r\n"));
}

xhr.send();
