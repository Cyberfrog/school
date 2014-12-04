pragma foreign_keys = 'ON';
insert into grades (id,name) 
	values (1,'class 1'), (2,'class 2');
insert into students (id,name,grade_id)
	values (1,'Vishnu',1), (2,'Mahesh',1), (3,'Parmatma',1);
insert into subjects (id,name,maxScore,grade_id)
	values (1,'Cricket',100,1), (2,'Hockey',50,1), (3,'KhoKho',25,1);
insert into scores (student_id, subject_id, score)
	values (1,1,65), (1,2,30), (1,3,10), (2,1,66), (2,2,29), (2,3,11),(3,1,55), (3,2,25), (3,3,15);