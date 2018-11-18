function totime(ts)
{
	var second=ts%60;
	var minute=Math.floor(ts/=60)%60;
	var hour=Math.floor(ts/=60)%60;
	var day=Math.floor(ts/24);

	return 	(day>0 ? day+' ' : '')+
			(hour<10 ? '0'+hour : hour)+':'+
			(minute<10 ? '0'+minute : minute)+':'+
			(second<10 ? '0'+second : second);
};

function timeFormat(ts,format,ms)
{
	format=format || 'y-m-d h:i:s';

	var d=new Date(ms ? ts : ts*1000);

	var dt=s => (i => { s=='Month' && i++; r=i<10 ? '0'+i : i; return s=='Milliseconds' && i<100 ? '0'+r : r; })(d['get'+s]());

	return format.replace(/[ymdhisx]/g,i => dt({y:'FullYear',m:'Month',d:'Date',h:'Hours',i:'Minutes',s:'Seconds',x:'Milliseconds'}[i]) );
}

function jsonRequest(url,data,async_cb)
{
	var a=new XMLHttpRequest();

	a.open('POST',url,async_cb instanceof Function);
	a.setRequestHeader('Content-Type','application/json');

	if(async_cb instanceof Function)
	{
		a.onload=() =>
		{
			if(a.readyState===4) async_cb(false,a.responseText);
		};
		a.onerror=() =>
		{
			async_cb(true);
		};
	}

	try
	{
		a.send(JSON.stringify(data));

		return async_cb instanceof Function ? true : a.responseText;
	}
	catch(e)
	{
		console.error('Invalid jsonRequest',url);
	}
}