function Clients(parent_item)
{
	this.className='Clients';
	this.mclass_prefix='x-';

	Clients.parent.constructor.call(this,parent_item);

	var $this=this;


}

extend(Clients,Control);

function Client(parent_item)
{
	this.className='Client';
	this.mclass_prefix='c-';

	Client.parent.constructor.call(this,parent_item);

	var $this=this;


}

extend(Client,Control);

