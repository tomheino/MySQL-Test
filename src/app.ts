/**
 * A small server example who connects to a mysql server
 * @author Tommi Heino
 */

// 1) imports needed
import mysql from 'mysql'
import express from 'express'
import dotenv from 'dotenv'
dotenv.config()

// 2) the app
const app:express.Express = express()

// 3) json usage, extended:true --> nested objects
app.use(express.json())
app.use(express.urlencoded({extended:true}))

// a class representing one row in table
class MyRow {
    id:number
    fname:string
    lname:string
    birth:Date
    constructor(id:number=0,fname:string="XXX",lname:string="YYY",birth:Date=new Date()){
        this.id = id
        this.fname = fname
        this.lname = lname
        this.birth = birth
    }
    public toString():string {
        return `${this.id} ${this.fname} ${this.lname} ${this.birth.toString()}`
    }
}

// connections can be created by a) mysql.createConnection() or b) mysql.createPool()
// pool has better performance 

const pool = mysql.createPool({
    host: process.env.DBSERVER,
    database: process.env.DBNAME,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD
})

// 4) REST api service
app.get('/', (req:express.Request,res:express.Response) => {
    res.json("Hello from MYSQL server")
})

app.get('/api/getall', (req:express.Request,res:express.Response) => {
    const queryStr:string = 'SELECT * FROM ??'
    const query:string = mysql.format(queryStr,[process.env.DBTABLE])
    /**
     * pool.query() internally does: pool.getConnection() -> connection.query() -> connection release()
     */
    pool.query(query,(err:mysql.MysqlError, rows:MyRow[]) => {
        if(err) {
            // throw err
            res.json({"error":err})
        } else {
            console.log("All data returned from Person: ",rows)
            res.json(rows)
        }
    })
})

app.get('/api/getone/:id', (req:express.Request,res:express.Response) => {
    const id:number = Number(req.params.id)
    const queryStr:string = 'SELECT * FROM ?? where ?? = ?'
    const query:string = mysql.format(queryStr, [process.env.DBTABLE, 'id', id])
    const myrow:MyRow = new MyRow()
    pool.query(query,(err:mysql.MysqlError, rows:MyRow[]) => {
        if(err) {
            // throw err
            res.json({"error":err})
        } else {
            console.log(`pool.query by id: ${id}`,rows)
            if(rows.length > 0) {
                myrow.id = rows[0].id
                myrow.fname = rows[0].fname
                myrow.lname = rows[0].lname
                myrow.birth = rows[0].birth
                res.json(myrow)
            } else {
                res.json(rows)
            }
        }
    })
})

app.post('/api/insert', (req:express.Request,res:express.Response) => {
    // read all params from POST body
    const id:number = req.body.id
    if(!id) {
        res.json({"error":"missing id"})
        return;
    }
    const fname:string = req.body.fname
    const lname:string = req.body.lname
    const birth:Date = req.body.birth
    if(!fname || !lname || !birth) {
        res.json({"error":"missing data"})
        return;
    }
    const queryStr:string = "insert into ?? (??,??,??,??) values (?,?,?,?)"
    const query:string = mysql.format(queryStr,[process.env.DBTABLE, "id", "fname", "lname", "birth", id, fname, lname, birth])
    pool.query(query, (err:mysql.MysqlError, response:mysql.OkPacket) => {
        if(err) {
            res.json({"error":err.code})
        } else {
            console.log("added row, response: ", response)
            res.json({"affectedRows":response.affectedRows})
        }
    })
})

app.put('/api/update', (req:express.Request,res:express.Response) => {
    const id:number = req.body.id
    if(!id) {
        res.json({"error":"missing id"})
        return;
    }
    const fname:string = req.body.fname
    const lname:string = req.body.lname
    const birth:Date = req.body.birth
    // maybe better to check existence one by one rather than force everything to be updated
    if(!fname || !lname || !birth) {
        res.json({"error":"missing data"})
        return;
    }
    const queryStr:string = "update ?? set ?? = ?, ?? = ?, ?? = ? where ?? = ?"
    const query:string = mysql.format(queryStr, [process.env.DBTABLE, "fname", fname, "lname", lname, "birth", birth, "id", id])
    pool.query(query, (err:mysql.MysqlError, response:mysql.OkPacket) => {
        if(err) {
            res.json({"error":err.code})
        } else {
            console.log("updated row, response: ", response)
            res.json({"changedRows":response.changedRows})
        }
    })
})

app.delete('/api/del/:id', (req:express.Request, res:express.Response) => {
    const id:number = Number(req.params.id)
    const queryStr:string = "delete from ?? where ?? = ?"
    const query:string = mysql.format(queryStr, [process.env.DBTABLE, "id", id])
    pool.query(query, (err:mysql.MysqlError, response:mysql.OkPacket) => {
        if(err) {
            res.json({"error":err.code})
        } else {
            console.log("deleted row, response: ", response)
            res.json({"affectedRows":response.affectedRows})
        }
    })
})

// 5) server start / listen
const PORT = process.env.SERVERPORT || 3000
const server = app.listen(PORT, () => {
    console.log(`Server running, port: ${PORT}`)
})