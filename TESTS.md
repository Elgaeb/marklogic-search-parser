clear ; ./test.sh "(FirstName:John OR LastName:Doe-Long) BirthDate FROM 6/2/76 TO 6-4-76 LastName CONTAINS 'Doe' OR LastName IS Purple"
./test.sh "(FirstName:John OR LastName:Doe-Long) BirthDate FROM 6/2/76 TO 6-4-76 LastName CONTAINS 'Doe' OR LastName IS Purple"
./test.sh "(FirstName:John OR LastName:Doe-Long) BirthDate FROM 6/2/76 TO 6-4-76 LastName CONTAINS 'Doe' foo*"