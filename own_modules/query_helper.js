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
		console.log("executing:",query.query);
		var callBack = function(err,result){
			err&&console.log("ERROR:",err);
			query.result = err||result;
			if(query.isQuery(query.next)){
				query.next.pre_result = err || result;
				query.next.fire(db);
				return;
			}
			query.next(err,result);
		}
		db[query.dbMethod](query.query,query.query_params,callBack); 
	}		
}

QueryHelper.each =function(query,parameters,onComplete,db){

	var queryHelpers =  parameters.map(function(parameter){
	 	return new QueryHelper(query,null,'run',parameter);
	});
	createChain(queryHelpers,onComplete);

	queryHelpers[0].fire(db);
}

var createChain = function(queryHelpers,last_element){
	queryHelpers.forEach(function(query,index){
		query.next = queryHelpers[index+1];
	});
	var lastQuery = queryHelpers[queryHelpers.length-1];
	lastQuery.next = last_element;
}


exports.queryHelper = QueryHelper;
