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

function timeFormat(ts,format)
{
	format=format || 'y-m-d h:i:s';

	var d=new Date(ts*1000);

	var dt=s => (i => { s=='Month' && i++; return i<10 ? '0'+i : i; })(d['get'+s]());

	return format.replace(/[ymdhis]/g,i => dt({y:'FullYear',m:'Month',d:'Date',h:'Hours',i:'Minutes',s:'Seconds'}[i]) );
}