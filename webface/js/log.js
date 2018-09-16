function Log(parent_item)
{
	this.className='Log';
	this.mclass_prefix='l-';

	Log.parent.constructor.call(this,parent_item);

	this.bind('i',			v => this.value('index',v));
	this.bind('client',		v => this.value('client',v));
	this.bind('msg',		v => this.value('message',v));
	this.bind('tstamp_ms',	v => this.value('time',timeFormat(v,'y-m-d h:i:s.x',true)));
	this.bind('type',		v =>
	{
		switch(v)
		{
			case 'system':
				this.dom().classList.add('green');
			break;

			case 'stderr':
				this.dom().classList.add('red');
			break;
		}
	});
}

function Logs(parent_item)
{
	this.className='Logs';
	this.mclass_prefix='l-';

	Logs.parent.constructor.call(this,parent_item);

	this.lastIndex=0;

	this.addList=(jdata,back) =>
	{
		if(!back)
		{
			jdata.forEach(e =>
			{
				var log=new Log(this);

				log.loadData(e);

				this.lastIndex=e.i;
			});
		}
		else
		{
			console.log(jdata);
		}
	};
}

$(document).ready(() =>
{
	extend(Logs,Control);
	extend(Log,Control);

	var logs=new Logs('body');

	var autoscroll=true;

	logs.dom().addEventListener('onwheel' in document ? 'wheel' :
								'onmousewheel' in document ? 'mousewheel' : 'MozMousePixelScroll',
	e =>
	{
		e=e || window.event;
		var delta=e.deltaY || e.detail || e.wheelDelta;

		autoscroll=$('.logs')[0].scrollTop+$('.logs')[0].clientHeight==$('.logs')[0].scrollHeight;
		// console.log(delta>0 ? '+' : '-');
	});

	setInterval(() => autoscroll && $('.logs')[0].scrollBy(0,10),100);

	setInterval(() =>
	{
		$.get('/json/log',{ task: $('.task').text(), index: logs.lastIndex+1 },jdata => logs.addList(jdata),'json');
	},2000);

	$.get('/json/log',{ task: $('.task').text() },jdata => logs.addList(jdata),'json');
});