var lib = require('../own_modules/school_records');
var queryHelper = require('../own_modules/query_helper.js').queryHelper;
var assert = require('chai').assert;
var fs = require('fs');
var dbFileData = fs.readFileSync('tests/data/school.db.backup');
var sqlite3 = require("sqlite3").verbose();
var TEST_DB_PATH='tests/data/school.db';
//CREATE TABLE STUDENTS(name text, grade text);
//INSERT INTO STUDENTS VALUES ('Abu','one'), ('Babu','one')

var school_records;
describe('school_records',function(){
	beforeEach(function(){
		fs.writeFileSync(TEST_DB_PATH,dbFileData);
		school_records = lib.init(TEST_DB_PATH);
	});
	
	describe('#getGrades',function(){
		it('retrieves 2 grades',function(done){
			school_records.getGrades(function(err,grades){
				assert.deepEqual(grades,[{id:1,name:'1st std'},{id:2,name:'2nd std'}]);
				done();
			})
		})
	})

	describe('#getStudentsByGrade',function(){
		it('retrieves the students in the 2 grades',function(done){
			school_records.getStudentsByGrade(function(err,grades){
				assert.lengthOf(grades,2);
				assert.lengthOf(grades[0].students,4);
				assert.lengthOf(grades[1].students,3);
				done();
			})
		})
	})

	describe('#getSubjectsByGrade',function(){
		it('retrieves the subjects in the 2 grades',function(done){
			school_records.getSubjectsByGrade(function(err,grades){
				assert.lengthOf(grades,2);
				assert.lengthOf(grades[0].subjects,3);
				assert.lengthOf(grades[1].subjects,0);
				done();
			})
		})
	})

	describe('#getStudentSummary',function(){
		it('retrieves the summary of the student Abu',function(done){
			school_records.getStudentSummary(1, function(err,s){				
				assert.equal(s.name,'Abu');
				assert.equal(s.grade_name,'1st std');
				assert.deepEqual(s.subjects,[{id:1,name:'English-1',score:75,maxScore:100},
					{id:2,name:'Maths-1',score:50,maxScore:100},
					{id:3,name:'Moral Science',score:25,maxScore:50}]);
				assert.lengthOf(s.allGrades,2);
				done();
			})
		})

		it('retrieves nothing of the non existent student',function(done){
			school_records.getStudentSummary(9, function(err,s){
				assert.notOk(err);
				assert.notOk(s);				
				done();
			})
		})
	})
	describe('#getGradeSummary',function(){
		it('retrieves the summary of grade 1',function(done){
			school_records.getGradeSummary(1,function(err,grade){
				assert.notOk(err);
				assert.equal(grade.name,'1st std');
				assert.deepEqual(grade.subjects,[{id:1,name:'English-1'},
					{id:2,name:'Maths-1'},
					{id:3,name:'Moral Science'}]);
				assert.deepEqual(grade.students,[{id:1,name:'Abu'},
					{id:2,name:'Babu'},
					{id:3,name:'Kabu'},
					{id:4,name:'Dabu'}]);
				assert.equal(grade.id,1);
				done();
			})
		})
	})


	describe('#getSubjectSummary',function(){
		it('retrieves the summary of subject 1',function(done){
			school_records.getSubjectSummary(1,function(err,subject){
				assert.notOk(err);
				assert.equal(subject.name,'English-1');
				assert.deepEqual(subject.student, [ { id: 1, name: 'Abu', score: 75 }]);
				done();
			})
		})
	})

	describe('#updateGrade',function(){
		it('update grade name to g1 where id= 1',function(done){
			school_records.updateGradeName({id:1,name:"g1"},function(err){
				var db = new sqlite3.Database(TEST_DB_PATH);
				db.get("select name from grades where id=1 ",function(testErr,grade){
					assert.notOk(err);
					assert.equal(grade.name,"g1");
					done();
				})
				
			})
		})
	})
	describe('#updateStudent',function(){
		it('update student name to akbar gard_id = 2 where id= 1'+
			'and score of subject_id 1 to 35',function(done){
				var newStudent={id:1,name:"akbar",grade_id:2,scores:[ { subject_id:1, score: 35 }]};
			school_records.updateStudent(newStudent,function(err){
				var db = new sqlite3.Database(TEST_DB_PATH);
				db.get("select su.name,su.grade_id,sc.score from students su,scores sc where sc.student_id = 1 and sc.subject_id=1 and su.id=1",function(testErr,student){
					assert.notOk(testErr);
					assert.equal(student.name,"akbar");
					assert.equal(student.grade_id,2);
					assert.equal(student.score,35);
					done();
				})
				
			})
		})
	})
	describe('#updateSubject',function(){
		it('update subject name to history where id= 1'+
			'and max score of subject_id 1 to 50 and change grade to 2',function(done){
			var newSubject={id:1,name:"history",grade_id:2,maxScore:50};
			school_records.updateSubject(newSubject,function(err){
				var db = new sqlite3.Database(TEST_DB_PATH);
				db.get("select name, grade_id,maxScore from subjects  where id = 1",function(testErr,subject){
					assert.notOk(testErr);
					assert.equal(subject.name,"history");
					assert.equal(subject.grade_id,2);
					assert.equal(subject.maxScore,50);
					done();
				})	
			})
		})
	})
	describe('#Add Student',function(){
		it('add student name ="raj" gard_id=1 and score for subject 1 is 70',function(done){
			var newStudent={name:"raj",grade_id:1 ,
						scores:[{subject_id:1,score:30}]};
			school_records.addStudent(newStudent,function(err){
				var db = new sqlite3.Database(TEST_DB_PATH);
				db.get("select name , max(id) from students",function(err,student){
					db.get("select score from scores where subject_id = 1 and student_id ="+student['max(id)'],
						function(err,score){
							assert.equal(student.name,"raj");
							assert.typeOf(student['max(id)'],'number');
							assert.equal(score.score,30);
							done();
						});
				})
			})
		})

	});
	describe('#getSubjects',function(){
		it('retrive subjects for grade 1',function(done){
			school_records.getSubjects(1,function(err,subjects){
				var expected = [{id:1,name:'English-1',maxScore:100},
								{id:2,name:'Maths-1',maxScore:100},
								{id:3,name:'Moral Science',maxScore:50}]
				assert.deepEqual(subjects,expected);
				done();
			})
		})
		
	});

})