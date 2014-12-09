var sqlite3 = require("sqlite3").verbose();
var queryHelper = require("./query_helper.js").queryHelper;

var _getGrades = function(db,next){
	var query = new queryHelper('select * from grades',next,'all');
	query.fire(db);
	return query;
};

var _getStudentsByGrade = function(db,onComplete){
	var next=function(err,students){			
		allocateToGrade(grades_query.result,students,'students');
		onComplete(null,grades_query.result);
	}
	var student_query = new queryHelper('select * from students',next,'all');
	var grades_query = _getGrades(db,student_query);	
};

var allocateToGrade = function(grades,resources,resource_name){
	grades.forEach(function(grade){
		grade[resource_name] = resources.filter(function(resource){
			return resource.grade_id==grade.id});
	})			
}

var _getSubjectsByGrade = function(db,onComplete){
	var next = function(err,subjects){
		allocateToGrade(grades_query.result,subjects,'subjects');			
		onComplete(null,grades_query.result);
	}
	var subject_query = new queryHelper('select * from subjects',next,'all')
	var grades_query= _getGrades(db,subject_query);	
};

var _updateSubject = function(subject,db,onComplete){
	var subject_query = "update subjects set name= $name, grade_id= $grade_id, maxScore = $maxScore where id =$id";
	var subject_query_params = {"$id":subject.id,"$name":subject.name,
			"$grade_id":subject.grade_id,"$maxScore":subject.maxScore};
	db.run(subject_query,subject_query_params,onComplete);
}

var _getStudentSummary = function(id, db,onComplete){
	var student_grade_query = 'select s.name as name, s.id as id, g.name as grade_name, g.id as grade_id '+
		'from students s, grades g where s.grade_id = g.id and s.id='+id;
	
	db.get(student_grade_query,function(est,student){
		if(student) {allocateSubjects(db,student,onComplete); return;}
		onComplete(null,null); 
	});

};

var allocateSubjects =function(db,student,onComplete){
	var subject_score_query = 'select su.name, su.id, su.maxScore, sc.score '+
		'from subjects su, scores sc where su.grade_id = '+student.grade_id+
		' and su.id = sc.subject_id and sc.student_id ='+student.id;
	var next = function(erg,subjects){
		student.subjects = subjects||[];
		student.allGrades = grades_query.result;
		onComplete(null,student);
	}
	var query =new queryHelper(subject_score_query,next,'all')	
	var grades_query=_getGrades(db,query);
	
}

var _getGradeSummary = function(id,db,onComplete){
	var grade_query = "select id, name from grades where id="+id;
	db.get(grade_query,function(err,grade){
		if(!grade){onComplete(null,grade); return;}
		populateGradeWithStudent(db,grade,onComplete);
	});
};

var populateGradeWithStudent = function(db,grade,onComplete){
	var param= {"$grade_id":grade.id};
	var allocate = function(esu,subjects){
		grade.students = student_query.result;
		grade.subjects = subject_query.result;
		onComplete(null,grade);		
	}
	var subject_query = new queryHelper("select id, name from subjects where grade_id=$grade_id",allocate,'all',param);
	var student_query = new queryHelper("select id, name from students where grade_id=$grade_id",subject_query,'all',param);	
	student_query.fire(db);
}
	
var _getSubjectSummary = function(id,db,onComplete){
	getSubjectDetails(id,db,function(err,subject){
		 var students = subject.students.filter(function(s){return s.score});
		 subject.students = students;
		 onComplete(err,subject);
	});
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
		updateScores(student.scores,student.id,db,onComplete);
	});
}

var updateScores = function(scores,student_id,db,onComplete){
	var scores = formatScores(scores,student_id);
	var score_query="update scores set score= $score where student_id = $stud_id and subject_id = $sub_id";
	queryHelper.each(score_query,scores,onComplete,db);	
}

var formatScores = function(scores,student_id){
	return scores.map(function(score){
		return {'$score':score.score,'$stud_id':student_id,'$sub_id':score.subject_id};
	});
}

var _addStudent = function(student,db,onComplete){
	var insert_query = "insert into students (name,grade_id) values($name,$grade_id);";
	var params = { '$name':student.name,"$grade_id":student.grade_id};
	var score_query = function(err,stud_id){
		insertScore(student,stud_id,onComplete,db);
	}
	var select_query= new queryHelper("select max(id) from students",score_query,'get');
	var insert_query = new queryHelper("insert into students (name,grade_id) values($name,$grade_id);",select_query,'run',params);
	insert_query.fire(db);
}

var insertScore =function(student,stud_id,onComplete,db){
	var scores = student.scores.map(function(sc){
		return {'$stud_id':stud_id['max(id)'],'$sub_id':sc.subject_id,"$score":sc.score};
	});
	var insert_query ="insert into scores(student_id,subject_id,score) values($stud_id,$sub_id,$score)";
	queryHelper.each(insert_query,scores,onComplete,db);
}

var _getSubjects = function(grade_id,db,onComplete){
	var query ="select id, name, maxScore from subjects where grade_id="+grade_id;
	new queryHelper(query,onComplete,'all').fire(db);
}

var _addSubject = function(subject,db,onComplete){
	var query = "insert into subjects (grade_id,name,maxScore) values($grade_id,$name,$maxScore);";
	var params ={"$grade_id":subject.grade_id,"$name":subject.name,"$maxScore":subject.maxScore};
	new queryHelper(query,onComplete,'run',params).fire(db);
}

var _addScore = function(score,db,onComplete){
	var query ="insert into scores (subject_id,student_id,score) values($subject_id,$student_id,$score);"
	var params={"$subject_id":score.subject_id,"$student_id":score.student_id,"$score":score.score};
  new queryHelper(query,onComplete,'run',params).fire(db);	
}

var getSubjectDetails = function(subject_id,db,onComplete){
	var populateSubject =function(err,scores){
		var students = student_query.result;
		var subject = subject_query.result;
		allocateScores(students,scores);
		subject.students = students;
		subject.grade = getSubjectGrade(subject.grade_id,grades_query.result);
		subject.allGrades = grades_query.result;
		onComplete(null,subject);
	}
	
	var score_query = new queryHelper("select score, student_id from scores where subject_id="+subject_id,populateSubject,'all');
	var student_query = new queryHelper("select id, name from students where grade_id = $grade_id",score_query,'all',function(){
		return {"$grade_id":subject_query.result.grade_id};
	});
	var subject_query =new queryHelper("select id, grade_id, name, maxScore from subjects where id="+subject_id,student_query,'get')
	var grades_query = _getGrades(db,subject_query);
}

var getSubjectGrade = function(grade_id,grades){
	return grades.filter(function(grade){return grade.id==grade_id});
}

var allocateScores = function(students,scores){
	students.forEach(function(student){
		student.score = scores.reduce(function(pv,currentScore){
			return (student.id==currentScore.student_id)?currentScore.score:pv;
		},undefined);
	});
}

var _getNewStudentsForSubject = function(subject_id,db,onComplete){
	getSubjectDetails(subject_id,db,function(err,subject){
		var newStudents= subject.students.filter(function(s){return !s.score});
		subject.students = newStudents.map(function(s){
			return {id:s.id,name:s.name};
		});
		onComplete(err,subject);
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
		updateStudent:operate(_updateStudent),
		updateSubject:operate(_updateSubject),
		addStudent:operate(_addStudent),
		getSubjects:operate(_getSubjects),
		addSubject:operate(_addSubject),
		addScore:operate(_addScore),
		getNewStudentsForSubject:operate(_getNewStudentsForSubject)
	};

	return records;
};

exports.init = init;