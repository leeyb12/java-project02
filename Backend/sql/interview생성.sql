CREATE USER interview IDENTIFIED BY 1234;

GRANT CONNECT, resource TO interview;

GRANT unlimited TABLESPACE TO interview;