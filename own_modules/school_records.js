var sqlite3 = require("sqlite3").verbose();

var _getGrades = function(db,onComplete){
	var q = 'select * from grades';
	db.all(q,onComplete);
};

var _getStudentsByGrade = function(db,onComplete){
	_getGrades(db,function(err,grades){		
		db.all('select * from students', function(err1,students){
			
			grades.forEach(function(g){
				g.students = students.filter(function(s){return s.grade_id==g.id});
			})			
			onComplete(null,grades);
		})
	});	
};

var _getSubjectsByGrade = function(db,onComplete){
	_getGrades(db,function(err,grades){		
		db.all('select * from subjects', function(err1,subjects){
			
			grades.forEach(function(g){
				g.subjects = subjects.filter(function(s){return s.grade_id==g.id});
			})			
			onComplete(null,grades);
		})
	});	
};

var _getStudentSummary = function(id, db,onComplete){
	var student_grade_query = 'select s.name as name, s.id as id, g.name as grade_name, g.id as grade_id '+
		'from students s, grades g where s.grade_id = g.id and s.id='+id;
	var subject_score_query = 'select su.name, su.id, su.maxScore, sc.score '+
		'from subjects su, scores sc '+
		'where su.id = sc.subject_id and sc.student_id ='+id;
	var grade_query='select * from grades';
	db.get(student_grade_query,function(est,student){
		if(!student){
			onComplete(null,null);
			return;
		}
		db.all(subject_score_query,function(esc,subjects){			
			student.subjects = subjects;
			db.all(grade_query,function(erg,grades){
				student.allGrades = grades;
				onComplete(null,student);
			})
		})
	});
};

var _getGradeSummary = function(id,db,onComplete){
	var student_query = "select id,name from students where grade_id="+id;
	var subject_query = "select id,name from subjects where grade_id="+id;
	var grade_query = "select id,name from grades where id="+id;
	db.get(grade_query,function(err,grade){
		if(!grade){onComplete(null,grade); return;}
		db.all(student_query,function(est,students){
			grade.students = students;
			db.all(subject_query,function(esu,subjects){
				grade.subjects = subjects;
				onComplete(null,grade);		
			});
		});
	});
};


var _getSubjectSummary = function(id,db,onComplete){
	var subject_query = "select name, grade_id, maxScore from subjects where id ="+id;
	db.get(subject_query,function(err,subject){
		var student_query = "select id,name from students where grade_id="+subject.grade_id;
		db.all(student_query,function(est,student){
			subject.student = student;
			subject.student.forEach(function(st){
				db.get('select score from scores where student_id ='+st.id+' and subject_id = '+ id,function(esc,score){
					score && (st.score=score.score);
				});
			});
			var grade_query = "select name from grades where id="+subject.grade_id;
			db.all(grade_query,function(egr,grade){
				subject.grade = grade;
				onComplete(null,subject);
			});
		});
	});
};
var _updateGradeName = function(grade,db,onComplete){
	     db.run("UPDATE grades SET name = $name WHERE id = $id",
	     	{'$id':grade.id,'$name':grade.name}, 
	     	onComplete);
}
var _updateStudent =function(student,db,onComplete){
	var student_query ="update students set name = $name, grade_id=$grade_id where id =$id"
	db.run(student_query,{'$id':student.id,'$name':student.name,'$grade_id':student.grade_id},
	function(err){
		student.scores.forEach(function(score,index,scores){
			db.run("update scores set score=$score where student_id = $stud_id and subject_id = $sub_id",
				{'$score':score.score,'$stud_id':student.id,'$sub_id':score.subject_id},function(esc){
					if(index>=scores.length-1){
						onComplete(err);
					}
				});
		})
	});
}
var init = function(location){	
	var operate = function(operation){
		return function(){
			var onComplete = (arguments.length == 2)?arguments[1]:arguments[0];
			var arg = (arguments.length == 2) && arguments[0];

			var onDBOpen = function(err){
				if(err){onComplete(err);return;}
				db.run("PRAGMA foreign_keys = 'ON';");
				arg && operation(arg,db,onComplete);
				arg || operation(db,onComplete);
				db.close();
			};
			var db = new sqlite3.Database(location,onDBOpen);
		};	
	};

	var records = {		
		getGrades: operate(_getGrades),
		getStudentsByGrade: operate(_getStudentsByGrade),
		getSubjectsByGrade: operate(_getSubjectsByGrade),
		getStudentSummary: operate(_getStudentSummary),
		getGradeSummary: operate(_getGradeSummary),
		getSubjectSummary: operate(_getSubjectSummary),
		updateGradeName: operate(_updateGradeName),
		updateStudent:operate(_updateStudent)
	};

	return records;
};

exports.init = init;
////////////////////////////////////
exports.getSubjects = function(grade,callback){
	var subjects = grade == 'one' && [
		{name:'english-1',grade:'one',max:125},
		{name:'moral science',grade:'one',max:50},
		{name:'general science',grade:'one',max:100},
		{name:'maths-1',grade:'one',max:100},
		{name:'craft',grade:'one',max:25},
		{name:'music',grade:'one',max:25},
		{name:'hindi-1',grade:'one',max:75}
	] || [];
	callback(null,subjects);
};

exports.getScoresBySubject = function(subject,callback){
	var scores = subject != 'craft' && [] || [
		{name:'Abu',score:20},
		{name:'Babu',score:18},
		{name:'Ababu',score:21},
		{name:'Dababu',score:22},
		{name:'Badadadababu',score:23},
		{name:'babudada',score:24}
	];
	callback(null,scores);
};