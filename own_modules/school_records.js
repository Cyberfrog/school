var sqlite3 = require("sqlite3").verbose();
var queryHelper = require("./query_helper.js").queryHelper;


var _getGrades = function(db,onComplete){
	var query = 'select * from grades';
	db.all(query,onComplete);
};

var _getStudentsByGrade = function(db,onComplete){
	_getGrades(db,function(err,grades){		
		db.all('select * from students', function(err1,students){			
			populateGradesWithStudents(grades,students,onComplete);
		})
	});	
};
var populateGradesWithStudents =function(grades,students,onComplete){
	grades.forEach(function(grade){
		grade.students = students.filter(function(student){
			return student.grade_id==grade.id});
	})			
	onComplete(null,grades);
}

var _getSubjectsByGrade = function(db,onComplete){
	_getGrades(db,function(err,grades){		
		db.all('select * from subjects', function(err1,subjects){
			grades.forEach(function(grade){
				grade.subjects = subjects.filter(function(subject){return subject.grade_id==grade.id});
			})			
			onComplete(null,grades);
		})
	});	
};

var _updateSubject = function(subject,db,onComplete){
	var subject_query = "update subjects set name= $name, grade_id= $grade_id, maxScore = $maxScore where id =$id";
	var subject_query_params = {"$id":subject.id,"$name":subject.name,"$grade_id":subject.grade_id,"$maxScore":subject.maxScore};
	db.run(subject_query,subject_query_params,function(err){
		onComplete(err);
	});
}
var _getStudentSummary = function(id, db,onComplete){
	var student_grade_query = 'select s.name as name, s.id as id, g.name as grade_name, g.id as grade_id '+
		'from students s, grades g where s.grade_id = g.id and s.id='+id;
	
	db.get(student_grade_query,function(est,student){
		if(student) {populateStudent(db,student,onComplete); return;}
		onComplete(null,null); 
	});

};

var populateStudent =function(db,student,onComplete){
	var subject_score_query = 'select su.name, su.id, su.maxScore, sc.score '+
		'from subjects su, scores sc where su.grade_id = '+student.grade_id+' and su.id = sc.subject_id and sc.student_id ='+student.id;
	db.all(subject_score_query,function(esc,subjects){			
		student.subjects = subjects||[];
		_getGrades(db,function(erg,grades){
			student.allGrades = grades;
			onComplete(null,student);
		});
	});
}
var _getGradeSummary = function(id,db,onComplete){
	var grade_query = "select id, name from grades where id="+id;
	db.get(grade_query,function(err,grade){
		if(!grade){onComplete(null,grade); return;}
		populateGradeWithStudent(db,grade,onComplete);
	});
};
var populateGradeWithStudent = function(db,grade,onComplete){
	var subject_query = "select id, name from subjects where grade_id="+grade.id;
	var student_query = "select id, name from students where grade_id="+grade.id;
	
	db.all(student_query,function(est,students){
		grade.students = students;
		db.all(subject_query,function(esu,subjects){
			grade.subjects = subjects;
			onComplete(null,grade);		
		});
	});
}
	
var _getSubjectSummary = function(id,db,onComplete){
	var subject_query = "select id, grade_id, name, maxScore from subjects where id="+id;
	db.get(subject_query,function(err,subject){
		var populateSubject =function(egr,grades){
			 var students = student_query.result;
			 var scores = score_query.result;
				students.forEach(function(s){
					s.score= scores.reduce(function(pv,currentScore){
						return (s.id==currentScore.student_id)?currentScore.score:pv;
					},undefined);
				});
				subject.student= students.filter(function(s){return s.score});
				subject.grade = grades.filter(function(grade){return grade.id==subject.grade_id});
				subject.allGrades = grades;
				onComplete(null,subject);
		}
		var grade_query = new queryHelper("select * from grades",populateSubject,'all')
		var score_query = new queryHelper("select score, student_id from scores where subject_id="+id,grade_query,'all');
		var student_query = new queryHelper("select id, name from students where grade_id = "+subject.grade_id,score_query,'all');
		student_query.fire(db);
	})
};
var _updateGradeName = function(grade,db,onComplete){
	     db.run("UPDATE grades SET name = $name WHERE id = $id",
	     	{'$id':grade.id,'$name':grade.name}, 
	     	onComplete);
}
var _updateStudent =function(student,db,onComplete){
	var student_query ="update students set name = $name, grade_id=$grade_id where id =$id";
	var student_query_params ={'$id':student.id,'$name':student.name,
								'$grade_id':student.grade_id};
	db.run(student_query,student_query_params,function(err){
		student.scores.forEach(function(score,index,scores){
			var score_query="update scores set score= $score where student_id = $stud_id and subject_id = $sub_id";
			var score_query_params={'$score':score.score,'$stud_id':student.id,'$sub_id':score.subject_id};
			db.run(score_query,score_query_params,function(esc){
					if(index>=scores.length-1){
						onComplete(err);
					}
				});
		})
	});
}
var _addStudent = function(student,db,onComplete){
	var insert_query = "insert into students (name,grade_id) values($name,$grade_id);";
	var params = { '$name':student.name,"$grade_id":student.grade_id};
	var score_query = function(err,stud_id){
		student.scores.forEach(function(sc,index){
			var params = {'$stud_id':stud_id['max(id)'],'$sub_id':sc.subject_id,"$score":sc.score};
			db.run("insert into scores(student_id,subject_id,score) values($stud_id,$sub_id,$score)",params,function(err){			
				if(index>=student.scores.length-1){
					onComplete(err);
				}
			});	
		});
	}
	var select_query= new queryHelper("select max(id) from students",score_query,'get');
	var insert_query = new queryHelper("insert into students (name,grade_id) values($name,$grade_id);",select_query,'run',params);
	insert_query.fire(db);
}
var _getSubjects = function(grade_id,db,onComplete){
	var query ="select id, name, maxScore from subjects where grade_id="+grade_id;
	new queryHelper(query,onComplete,'all').fire(db);
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
		updateStudent:operate(_updateStudent),
		updateSubject:operate(_updateSubject),
		addStudent:operate(_addStudent),
		getSubjects:operate(_getSubjects)
	};

	return records;
};

exports.init = init;
