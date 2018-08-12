function Control(parent_item,parent_dom)
{
	var $this=this;
	// this.parentItem=parent_item;

	var template=document.getElementById(this.className);
	if(!template) return console.error('Not found #'+this.className+' html template!');

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
	* @param index
	*/
	this.delete=function(index)
	{
		if(typeof index=='number')
		{
			var obj;
			if(obj=items[index])
			{
				items.splice(index,1);
				obj.remove();
			}
		}
	};

	/**
	* Изменяемые/рабочие элементы DOM шаблона.
	*
	* Собираются из всех существующих дочерних элементов шаблона, в которых присутствует заполненное поле class
	* и "складируется" в "ассоциативный массив" elements. Где "ключем" является 1й класс (masterclass) заданный
	* в свойстве элемента, а значением ссылка на сам элемент.
	*
	* @type {{}}
	*/
	var elements={};

	/**
	* Наполнение "ассоциативного массива" elements, ссылками на изменяемые элементы.
	*/
	this.$(dom).find('[class^='+this.mclass_prefix+']').toArray().forEach((e) => { elements[e.classList[0].replace(new RegExp('^'+this.mclass_prefix),'')]=e; });  // todo: отвязаться от jq

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
	* Получение/установка основного аттрибута тега. Для разных тегов основной аттрибут разный
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
		if(elements[masterclass]!==undefined)
		{
			var f=function(at) { return val===undefined ? elements[masterclass][at] : elements[masterclass][at]=val; };
			var tag=elements[masterclass].tagName.toLowerCase();

			if(tag=='input' || tag=='textarea')
			{
				var type=f('type');

				if(type=='checkbox' || type=='radio') return f('checked');
				else  return f('value');
			}
			else return f('innerHTML');
		}
	};

	this.valueInt=function(masterclass,val)
	{
		if(elements[masterclass]!==undefined)
		{
			return val!==undefined ? this.value(masterclass,parseInt(val)) : parseInt(this.value(masterclass)) ;
		}
	};

	/**
	* Дополнительные данные используемые в объекте.
	*
	* @type {{}}
	*/
	var data={};

	this.data=function(key,val)
	{
		return val===undefined ? data[key] : data[key]=val;
	};

	/**
	* Одновременная установка data (дополнительных, внутренних данных) & value (визуальных элементов) по схожим названиям ключей.
	*
	* @param key
	* @param val
	*/
	this.datanval=function(key,val)
	{
		if(val===undefined || val===undefined) return;

		this.value(key,val);
		this.data(key,val);
	};

	// this.loadData=function(data)
	// {
	// 	for(var k in data) this.datanval(k,data[k]);
	// };

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
