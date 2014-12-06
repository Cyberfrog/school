var school_records = require('./school_records').init('./data/school.db');
exports.get_grades = function(req,res){
	school_records.getGrades(function(err,grades){
		res.render('grades',{grades:grades});
	});
};

exports.get_students = function(req,res){
	school_records.getStudentsByGrade(function(err,grades){
		res.render('students',{grades:grades});
	});
};

exports.get_subjects = function(req,res){
	school_records.getSubjectsByGrade(function(err,grades){
		res.render('subjects',{grades:grades});
	});
};

exports.get_student = function(req,res,next){
	school_records.getStudentSummary(req.params.id,
	function(err,student){
		if(!student) 
			next();
		else 
			res.render('student',student);
	});
};
exports.editStudent = function(req,res,next){
	school_records.getStudentSummary(req.params.id,
	function(err,student){
		if(!student) 
			next();
		else 
			res.render('edit_student',student);
	});	
}
exports.editSubject = function(req,res){
	school_records.getSubjectSummary(req.params.id,function(err,subject){
		res.render('edit_subject',subject);
	});
}
exports.get_subject_summary = function(req,res,next){
	school_records.getSubjectSummary(req.params.id,
	function(err,subject){
		if(!subject) 
			next();
		else 
			res.render('subject',subject);
	});
};

exports.get_grade_summary = function(req,res,next){
	school_records.getGradeSummary(req.params.id,
		function(err,grade){
			if(!grade)
				next();
			else
				res.render('grade',grade);
		});
};
exports.updateGrade = function(req,res,next){
	var grade={id:req.params.id,name:req.body.grade_name};
	school_records.updateGradeName(grade,function(err){
		if(!err){res.redirect('/grade/'+grade.id);}
	});

}
exports.updateStudent=function(req,res,next){
	var student = modifyStudentBody(req.params.id,req.body);
	school_records.updateStudent(student,function(err){
		res.redirect('/student/'+student.id);
	});
}
var modifyStudentBody = function(id,body){
	debugger;
	var student = {id:id,
		name : body.student_name, 
		grade_id :body.grade}
		populate_with_Score(student,body);
	return student;
} 
var populate_with_Score = function(student,body){
	var scores_keys = Object.keys(body).filter(function(key){return key.indexOf("score")>=0});
	var scores =  scores_keys.map(function(key){
		return {subject_id:key.split('_')[1],score:body[key]};
	}) ;
	student.scores = scores;
}
exports.updateSubject =function(req,res,next){
	var subject = req.body;
	subject.id= req.params.id;
	school_records.updateSubject(subject,function(err){
		res.redirect('/subject/'+subject.id);
	})
}

exports.newStudent =function(req,res){
	school_records.getSubjects(req.params.id,function(err,subjects){
		res.render('newStudent',{subjects:subjects,grade_id:req.params.id});
	})
}
exports.addStudent = function(req,res){
	var newStudent = {grade_id:req.params.id,name:req.body.name};
	populate_with_Score(newStudent,req.body);
	school_records.addStudent(newStudent,function(err){
		res.redirect('/grades');
	})
}