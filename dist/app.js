"use strict";
/**
 * A small server example who connects to a mysql server
 * @author Tommi Heino
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// 1) imports needed
const mysql_1 = __importDefault(require("mysql"));
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// 2) the app
const app = (0, express_1.default)();
// 3) json usage, extended:true --> nested objects
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// a class representing one row in table
class MyRow {
    constructor(id = 0, fname = "XXX", lname = "YYY", birth = new Date()) {
        this.id = id;
        this.fname = fname;
        this.lname = lname;
        this.birth = birth;
    }
    toString() {
        return `${this.id} ${this.fname} ${this.lname} ${this.birth.toString()}`;
    }
}
// connections can be created by a) mysql.createConnection() or b) mysql.createPool()
// pool has better performance 
const pool = mysql_1.default.createPool({
    host: process.env.DBSERVER,
    database: process.env.DBNAME,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD
});
// 4) REST api service
app.get('/', (req, res) => {
    res.json("Hello from MYSQL server");
});
app.get('/api/getall', (req, res) => {
    const queryStr = 'SELECT * FROM ??';
    const query = mysql_1.default.format(queryStr, [process.env.DBTABLE]);
    /**
     * pool.query() internally does: pool.getConnection() -> connection.query() -> connection release()
     */
    pool.query(query, (err, rows) => {
        if (err) {
            // throw err
            res.json({ "error": err });
        }
        else {
            console.log("All data returned from Person: ", rows);
            res.json(rows);
        }
    });
});
app.get('/api/getone/:id', (req, res) => {
    const id = Number(req.params.id);
    const queryStr = 'SELECT * FROM ?? where ?? = ?';
    const query = mysql_1.default.format(queryStr, [process.env.DBTABLE, 'id', id]);
    const myrow = new MyRow();
    pool.query(query, (err, rows) => {
        if (err) {
            // throw err
            res.json({ "error": err });
        }
        else {
            console.log(`pool.query by id: ${id}`, rows);
            if (rows.length > 0) {
                myrow.id = rows[0].id;
                myrow.fname = rows[0].fname;
                myrow.lname = rows[0].lname;
                myrow.birth = rows[0].birth;
                res.json(myrow);
            }
            else {
                res.json(rows);
            }
        }
    });
});
app.post('/api/insert', (req, res) => {
    // read all params from POST body
    const id = req.body.id;
    if (!id) {
        res.json({ "error": "missing id" });
        return;
    }
    const fname = req.body.fname;
    const lname = req.body.lname;
    const birth = req.body.birth;
    if (!fname || !lname || !birth) {
        res.json({ "error": "missing data" });
        return;
    }
    const queryStr = "insert into ?? (??,??,??,??) values (?,?,?,?)";
    const query = mysql_1.default.format(queryStr, [process.env.DBTABLE, "id", "fname", "lname", "birth", id, fname, lname, birth]);
    pool.query(query, (err, response) => {
        if (err) {
            res.json({ "error": err.code });
        }
        else {
            console.log("added row, response: ", response);
            res.json({ "affectedRows": response.affectedRows });
        }
    });
});
app.put('/api/update', (req, res) => {
    const id = req.body.id;
    if (!id) {
        res.json({ "error": "missing id" });
        return;
    }
    const fname = req.body.fname;
    const lname = req.body.lname;
    const birth = req.body.birth;
    // maybe better to check existence one by one rather than force everything to be updated
    if (!fname || !lname || !birth) {
        res.json({ "error": "missing data" });
        return;
    }
    const queryStr = "update ?? set ?? = ?, ?? = ?, ?? = ? where ?? = ?";
    const query = mysql_1.default.format(queryStr, [process.env.DBTABLE, "fname", fname, "lname", lname, "birth", birth, "id", id]);
    pool.query(query, (err, response) => {
        if (err) {
            res.json({ "error": err.code });
        }
        else {
            console.log("updated row, response: ", response);
            res.json({ "changedRows": response.changedRows });
        }
    });
});
app.delete('/api/del/:id', (req, res) => {
    const id = Number(req.params.id);
    const queryStr = "delete from ?? where ?? = ?";
    const query = mysql_1.default.format(queryStr, [process.env.DBTABLE, "id", id]);
    pool.query(query, (err, response) => {
        if (err) {
            res.json({ "error": err.code });
        }
        else {
            console.log("deleted row, response: ", response);
            res.json({ "affectedRows": response.affectedRows });
        }
    });
});
// 5) server start / listen
const PORT = process.env.SERVERPORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running, port: ${PORT}`);
});
