var QueryHelper = require('../own_modules/query_helper.js').queryHelper;
var assert = require('chai').assert;
var sqlite3 = require("sqlite3").verbose();

describe('#queryHelper',function(){
		it('create query object with query, query_params next and DBmethod ',function(done){
			var query = new QueryHelper("select * form student where id=$id",function(err,x){},'get',{'$id':1});
			assert.property(query, 'query');
			assert.property(query,'query_params');
			assert.property(query, 'next');
			assert.property(query,'dbMethod');
			done();
		});
		it('query has fire and isQuery function ',function(done){
			var query = new QueryHelper("select * form student where id=$id",function(err,x){},'get',{'$id':1});
			assert.typeOf(query.fire, 'Function');
			assert.typeOf(query.isQuery,'Function');
		    done();
		});
		it('isQuery function returns true for query Object',function(done){
			var query = new QueryHelper("select * form student where id=$id",function(err,x){},'get',{'$id':1});
			assert.ok(query.isQuery(query));
			assert.notOk(query.isQuery(new Function()));
		    done();
		});
		it('fire function executes the query on given db and call next',function(done){
			var db = new sqlite3.Database(':memory:');
			var onComplete = function(err,students){
				assert.lengthOf(students,1)
				assert.property(students[0],'name');
				assert.property(students[0],'id');
		        done();
			}
			var select_query = new QueryHelper("select * from student where id= $id",onComplete,'all',{'$id':1});
			var insert_query = new QueryHelper("insert into student (id , name) values($id, $name);",select_query,'run',{"$id":1,"$name":'bunti'});
			var create_query = new QueryHelper("create table student (id integer , name text); ",insert_query,'run');
			create_query.fire(db);
		});
		it('nextQuery has previous Query Results',function(done){
			var db = new sqlite3.Database(':memory:');
			var onComplete = function(err,student){
				assert.property(student,'name');
				assert.lengthOf(select_name.pre_result,1);	
		        done();
			}
			var select_name = new QueryHelper("select name from student",onComplete,'get');
			var select_query = new QueryHelper("select * from student where id= $id",select_name,'all',{'$id':1});
			var insert_query = new QueryHelper("insert into student (id , name) values($id, $name);",select_query,'run',{"$id":1,"$name":'bunti'});
			var create_query = new QueryHelper("create table student (id integer , name text); ",insert_query,'run');
			create_query.fire(db);
		});		
	})