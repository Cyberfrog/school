var QueryHelper  = function(query,next,method,query_params){
	this.query = query;
	this.next = next;
	this.dbMethod = method;
	this.query_params = query_params;
}
QueryHelper.prototype = {
	isQuery:function(query){
		return ((query.query)&&(query.next)&&true)||false;
	},
	fire:function(db){
		var query = this;
		console.log("exicuting:",query.query);
		db[query.dbMethod](query.query,query.query_params,function(err,result){
			query.result = err||result;
			if(query.isQuery(query.next)){
				query.next.pre_result = err || result;
				query.next.fire(db);
				return;
			}
			query.next(err,result);
		});
	}
}
exports.queryHelper = QueryHelper;
