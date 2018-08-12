function Tasks(parent_item)
{
	this.className='Tasks';
	this.mclass_prefix='x-';

	Tasks.parent.constructor.call(this,parent_item);

	var $this=this;

}

extend(Tasks,Control);

function Task(parent_item)
{
	this.className='Task';
	this.mclass_prefix='t-';

	Task.parent.constructor.call(this,parent_item);

	var $this=this;

	var time=new TaskTime(this,this.element('time'));
	// time.show();

}

extend(Task,Control);

function TaskTime(parent_item,parent_dom)
{
	this.className='TaskTime';
	this.mclass_prefix='tt-';

	TaskTime.parent.constructor.call(this,parent_item,parent_dom);

	var $this=this;

}

extend(TaskTime,Control);