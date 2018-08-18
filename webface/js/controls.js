function Control(parent_item,parent_dom)
{
	var $this=this;
	// this.parentItem=parent_item;

	var template=document.getElementById(this.className);
	if(!template) throw new Error('Not found #'+this.className+' html template!');

	template=template.innerHTML;

	/**
	* Текстовый шаблон преобразованный в DOM, для дальнешей визуализации и использования.
	*/
	var dom=this.$(template)[0]; // todo: отвязаться от jq

	/**
	* Возвращает актуальный DOM.
	*
	* @returns {*}
	*/
	this.dom=function() { return dom; };

	this.show=function()
	{
		dom.style.display='block';
	};

	this.hide=function()
	{
		dom.style.display='none';
	};

	this.visible=function(showhide)
	{
		if(showhide!==undefined) showhide ? this.show() : this.hide();

		return dom.style.display!='none';
	};

	/**
	* Массив дочерних объектов Control.
	*
	* @type {Array}
	*/
	var items=[];

	/**
	* Возвращает все дочерние объекты.
	*
	* @returns {*}
	*/
	this.items=function() { return items; };

	/**
	* Возвращает дочерний объект по индексу в массиве.
	*
	* @param i индексу в массиве
	* @returns {*}
	*/
	this.item=function(i) { return items[i]; };

	/**
	* Добавление объекта Control в массив дочерних объектов items и добавление для отображения в контейнер dom родителя.
	*
	* @param obj
	*/
	this.add=function(obj)
	{
		if(obj instanceof Control) items.push(obj);
	};

	/**
	* Удаляет элемент из массива items
	*
	* @param obj_index
	*/
	this.delete=function(obj_index)
	{
		if(typeof obj_index=='object')
		{
			items.some((e,i) =>
			{
				if(obj_index===e)
				{
					this.delete(i);

					return true;
				}
				else return false;
			});
		}
		else if(typeof obj_index=='number')
			{
				var obj;
				if(obj=items[obj_index])
				{
					items.splice(obj_index,1);
					obj.remove();
				}
		 	}
	};


	/**
	* Изменяемые/рабочие элементы DOM шаблона.
	*
	* Собираются из всех существующих дочерних элементов шаблона, в которых присутствует заполненное поле class с префиксом mclass_prefix
	* и "складируется" в "ассоциативный массив" elements. Где "ключем" является 1й класс (masterclass) заданный
	* в свойстве элемента (за вычетом префикса mclass_prefix), а значением ссылка на сам элемент.
	*
	* @type {{}}
	*/
	var elements={};

	/**
	* Наполнение "ассоциативного массива" elements, ссылками на изменяемые элементы.
	*/
	this.$(dom).find('[class^='+this.mclass_prefix+']').toArray().forEach(e => elements[e.classList[0].replace(new RegExp('^'+this.mclass_prefix),'')]=e);  // todo: отвязаться от jq

	/**
	* Возвращает все изменяемые/рабочие элементы DOM шаблона.
	*
	* @returns {Array}
	*/
	this.elements=() => elements;

	/**
	* Выбор ссылки на нужный шаблон по 1му классу (masterclass) в элементе шаблона.
	*
	* @param masterclass
	* @returns {*}
	*/
	this.element=function(masterclass)
	{
		return elements[masterclass]!==undefined ? elements[masterclass] : undefined;
	};

	/**
	* Получение/установка основного изменяемого аттрибута тега. Для разных тегов основной аттрибут разный
	* input[type=checkbox|radio].checked
	* input.value
	* textarea.value
	* other.innerHTML (div|span|..etc)
	*
	* @param masterclass
	* @param val
	*/
	this.value=function(masterclass,val)
	{
		var e;

		if((e=elements[masterclass])!==undefined)
		{
			var f=(e,at,val) => val!==undefined && e[at]!=val ? e[at]=val : e[at];
			var tag=e.tagName.toLowerCase();

			if(['input','textarea'].indexOf(tag)>=0)
			{
				var type=f(e,'type');

				return f(e,['checkbox','radio'].indexOf(type)>=0 ? 'checked' : 'value',val);
			}
			else return f(e,'innerHTML',val);
		}
		else console.error('Element not found:',masterclass);
	};

	this.bindev=function(elementid,event,func)
	{
		if(typeof elementid!='string') return console.error('Invalid bindev argument elementid:',elementid);
		if(typeof event!='string') return console.error('Invalid bindev argument event:',event);
		if(typeof func!='function') return console.error('Invalid bindev argument function:',func);

		if(elements[elementid]===undefined) return console.error('Invalid elementid:',elementid);

		elements[elementid].addEventListener(event,func,false);
	};

	/**
	* Модель используемая в объекте.
	*
	* @type {{}}
	*/
	var data={};

	this.data=function(key,val)
	{
		return val===undefined ? data[key] : data[key]=val;
	};

	this.bind=function(key,func)
	{
		if(typeof key!='string') return console.error('Invalid bind key:',key);
		if(typeof func!='function') return console.error('Invalid bind function:',func);

		Object.defineProperty(data,key,
		{
			set: v => { data['_'+key]=v; func(v); },
			get: () => data['_'+key]
		});
	};

	this.loadData=function(data)
	{
		for(var k in data) this.data(k,data[k]);

		return this;
	};

	this.appendTo=function(target)
	{
		if(typeof target=='string') target=document.getElementById(target);

		if(target.appendChild) target.appendChild(dom);
	};

	this.insertAfter=function(target)
	{
		if(typeof target=='string') target=document.getElementById(target);

		if(target.insertAfter) target.insertAfter(dom);
	};

	this.insertBefore=function(target)
	{
		if(typeof target=='string') target=document.getElementById(target);

		if(target.insertBefore) target.insertBefore(dom);
	};

	this.remove=function()
	{
		dom.remove();
	};

	if(parent_item instanceof Control && parent_item.add)
	{
		parent_item.add(this);

		if(parent_dom!==undefined) this.appendTo(parent_dom);
		else this.appendTo(parent_item.dom());
	}
	else if(typeof parent_item=='string') this.appendTo(document.getElementById(parent_item));
}

Control.prototype.$=jQuery;

function extend(child,parent)
{
	var F=function() { };
	F.prototype=parent.prototype;
	child.prototype=new F();
	child.prototype.constructor = child;
	child.parent=parent.prototype;
}
