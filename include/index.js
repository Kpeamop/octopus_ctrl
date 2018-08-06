exports.extend=function extend(child,parent)
{
	var F=function() { };
	F.prototype=parent.prototype;
	child.prototype=new F();
	child.prototype.constructor = child;
	child.parent=parent.prototype;
};
