const express = require('express');

const PORT = process.env.PORT || 3001;
const app = express();
const mysql = require('mysql2');
const { resourceLimits } = require('worker_threads');
const inputCheck = require('./utils/inputCheck');

//express middleware
app.use(express.urlencoded({extended: false}));
app.use(express.json());

//connect to database
const db = mysql.createConnection(
    {
        host: 'localhost',
        //Your MySQL username,
        user: 'root',
        //Your MySQL password
        password: 'password',
        database: 'election'
    },
    console.log('Connected to the election database.')
);

app.get('/api/candidates',(req,res)=>{
    const sql = `SELECT candidates.*, parties.name
                AS party_name
                FROM candidates
                LEFT JOIN parties
                ON candidates.party_id = parties.id`;
    db.query(sql, (err, rows)=>{
        if(err){
            res.statues(500).json({error: err.message});
            return;
        }
        res.json({
            message:'success',
            data:rows
        });
    });
});


//GET a single candidate
app.get(`/api/candidate/:id`,(req, res)=>{
    const sql = `SELECT candidates.*,parties.name
                AS party_name
                FROM candidates
                LEFT JOIN parties
                ON candidates.party_id = parties.id
                WHERE candidates.id = ?`;
    const params = [req.params.id]
    db.query(sql, params, (err, row)=>{
        if(err){
            res.status(400).json({error: err.message});
            return;
        }
        res.json({
            message:'success',
            data:row
        });
    });
});

app.get('/api/parties', (req, res)=>{
    const sql = `SELECT * FROM parties`;
    db.query(sql, (err, rows)=>{
        if(err){
            res.status(500).json({error: err.message});
            return;
        }
        res.json({
            message: 'success',
            data:rows
        });
    });
});

app.get('/api/party/:id', (req, res)=>{
    const sql = `SELECT * FROM parties WHERE id = ?`;
    const params = [req.params.id]
    db.query(sql,params,(err, row)=>{
        if(err){
            res.status(400).json({ error: err.messages});
            return;
        }
        res.json({
            messages: "success",
            data:row
        });
    });
});

app.delete('/api/party/:id', (req, res)=>{
    const sql = `DELETE FROM parties WHERE id =?`;
    const params = [req.params.id];
    db.query(sql, params, (err, result)=>{
        if(err){
            res.status(400).json({error: res.message});
        }else if(!result.affectedRows){
            res.json({
                message:'party not found'
            });
        }else{
            res.json({
                message:'deleted',
                changes: result.affectedRows,
                id:req.params.id
            });
        }
    });
});

//DELETE a candidates
app.delete('/api/candidate/:id', (req, res)=>{
    const sql = 'DELETE FROM candidates WHERE id = ?';
    const params = [req.params.id];

    db.query(sql, params, (err, result)=>{
        if(err){
            res.statusMessage(400).json({error: res.message });
        }else if(!result.affectedRows){
            res.json({
                message:'Candidates not found'
            });
        }else{
            res.json({
                message: 'deleted',
                changes: result.affectedRows,
                id: req.params.id
            });
        }
    });
});


// //create a candidate
app.post('/api/candidate',({body}, res)=>{
    const errors = inputCheck(body, 'first_name', 'last_name', 'industry_connected');
    const sql = `INSERT INTO candidates(first_name, last_name, industry_connected)
                VALUES(?,?,?)`;
    const params = [body.first_name, body.last_name, body.industry_connected];
    if (errors){
        res.status(400).json({ error: errors });
        return;
    }
    db.query(sql, params, (err, result) =>{
        if(err){
            res.status(400).json({ error: err.message});
            return;
        }
        res.json({
            message: 'success',
            data:body
        });
    });
});

//update a candidate's party
app.put('/api/candidate/:id', (req,res)=>{
    const error = inputCheck(req.body, 'party_id');
    const sql = `UPDATE candidates SET party_id = ?
                WHERE id = ?`;
    const params = [req.body.party_id, req.params.id];
    if(error){
        res.status(400).json({ error: errors});
        return;
    }
    db.query(sql, params, (err, result)=>{
        if(err){
            res.status(400).json({ error: err.message});
        }else if(!result.affectedRows){
            res.json({
                message: 'Candidates not found'
            });
        }else{
            res.json({
                message:"success",
                data: req.body,
                changes: result.affectRows
            });
        }
    });
});

// db.query(sql, params, (err, result)=>{
//     if(err){
//         console.log(err);
//     }
//     console.log(result);
// });

app.use((req,res)=>{
    res.status(404).end();
});

app.listen(PORT,() =>{
    console.log(`Server running on port ${PORT}`);
});