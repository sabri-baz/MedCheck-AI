import sqlite3
import os

def create_database():
    if os.path.exists("students.db"):
        os.remove("students.db")

    conn = sqlite3.connect("students.db")#veritabanı baglantisi saglamak
    cursor = conn.cursor()# veritabanı üzerinde değişiklik yapmamızı sağlayan imleç denilebilir
    return  conn,cursor
def create_table(cursor):
    cursor.execute("""
    create table students(
    id integer primary key,
    name text not null,
    age integer,
    email text unique,
    city varchar
    )
    """)
    cursor.execute("""
    create table courses(
    id integer primary key,
    course_name text,
    instructor_name text,
    credit integer)
        
    """)


def insert_data(cursor):
    student=[(1,'alice',20,'alice@gmail.com','new york'),
             (2, 'david', 20, 'david@gmail.com', 'cichagpo'),
             (3, 'ace', 20, 'ace@gmail.com', 'teksas'),
             ( 4, 'klein', 20, 'klein@gmail.com', 'paris'),
             (5, 'isagi', 20, 'isagi@gmail.com', 'münih')]

    cursor.executemany("insert into students values (?,?,?,?,?)", student)

    courses=[(1,"programing language","dr. jhanson",4),
             (2, "since", "dr. klaus", 4),
             (3, "fight", "dr.lufyy", 4),
             (4, "warior strategy", "dr.thanos", 4)
             ]
    cursor.executemany("insert into courses values (?,?,?,?)", courses)
    print("succesfully insterdet data")

def main():
    conn , cursor = create_database()
    try:
        create_table(cursor)
        insert_data(cursor)
        conn.commit()
    except sqlite3.error as e:
        print(e)
    finally:
        conn.close()

if __name__=="__main__":
    main()