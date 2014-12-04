var location = process.argv[2];
var sqlite3 = require("sqlite3");
var db = new sqlite3.Database(location);
var runAllQueries = function(){	
	var runQuery = function(q){
		console.log(q);
		db.run(q,function(err){
			if(err){
				console.log(err);
				process.exit(1);
			}
		});
	};

	[	"create table grades(id integer primary key autoincrement, name text);",
		"create table students(id integer primary key autoincrement, name text, grade_id integer not null,foreign key(grade_id) references grades(id));",
		"create table subjects(id integer primary key autoincrement, name text,maxScore integer, grade_id integer not null,foreign key(grade_id) references grades(id));",
		"create table scores(student_id integer not null, subject_id integer not null, score integer,foreign key(student_id) references students(id),foreign key(subject_id) references subjects(id))"	
	].forEach(runQuery)	;
};
db.serialize(runAllQueries);