var express = require('express');
var router = express.Router();
var uniqid = require('uniqid');
var mongo = require('mongodb');
var dbClient = require('mongodb').MongoClient
var url = 'mongodb://localhost:27017/bank_database';
var dbo = undefined;

dbClient.connect(url, function (err, client) {
  if (err) throw err;
  dbo = client.db("bank_database");
  dbo.createCollection("accounts", function(err, res) {
    console.log("account Collection created!");
  });
  
})

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', {success:10, reference_id: ""});
});

/* Dashboard page. */
router.post('/login', function(req, res) {
  dbo.collection("accounts").find({reference_id:req.body.reference_id}).toArray(function(err, result) {
    if (result.length == 0){
      res.render('index', { success: 2,reference_id: ""});
    }
    else{
     // res.render('dashboard', { user_name: req.body.reference_id});
      res.redirect('dashboard/'+req.body.reference_id);
    }
  });
  
});

/* Dashboard page. */
router.post('/signup', function(req, res) {
  dt = new Date();
  ref_id = req.body.first_name + "_"+uniqid.time();
  dbo.collection("accounts").find({email:req.body.user_email_id}).toArray(function(err, result) {
    if (err) throw err;
    if (result.length == 0)
    {
      dbo.collection("accounts").insertOne({first_name:req.body.first_name,last_name:req.body.last_name,email:req.body.user_email_id,address:req.body.user_address,
      submittedBy:req.body.first_name + " "+req.body.last_name , submittedDateTime: dt.toString() , modifiedBy:null , modifiedDateTime:null,
      reference_id: ref_id});
      dbo.createCollection(ref_id, function(err, res) {
        console.log("transaction Collection created!");
      });
      dbo.collection(ref_id).insertOne({deposit: 0 , balance: 0, timestamp:dt.toString()});
      res.render('index', { success: 1, reference_id: ref_id});
    }
    else{
      res.render('index', { success: 0, reference_id: ""});
    }
  });  
  
});

/* Dashboard page. */
router.get('/dashboard/:id', function(req, res) {
  res.render('dashboard', { reference_id: req.params.id  });
});

/*Deposit*/
router.get('/deposit_form/:id', function(req, res) {
  res.render('deposit_form', { reference_id:req.params.id });
});


/*Withdraw*/
router.get('/withdraw_form/:id', function(req, res) {
  
  
  res.render('withdraw_form', { reference_id:req.params.id });
});


/*check Balance*/
router.get('/balance/:id', function(req, res) {
  dbo.collection(req.params.id).find().limit(1).sort({$natural:-1}).toArray(function(err, result) {
    if (err) throw err;
    res.render('result', { balance: result[0].balance, reference_id:req.params.id, status: 1 });
  });
});


/*Withdraw*/
router.post('/deposit/:id', function(req, res) {
  dt = new Date();
  dbo.collection(req.params.id).find().limit(1).sort({$natural:-1}).toArray(function(err, result) {
    if (err) throw err;
    bal =parseInt(result[0].balance) + parseInt(req.body.deposit_amount);
    dbo.collection(req.params.id).insertOne({deposit: parseInt(req.body.deposit_amount) , balance: bal, timestamp:dt.toString()});
    res.render('result', { balance: bal, reference_id:req.params.id,status: 1  });
  });
});

/*Withdraw*/
router.post('/withdraw/:id', function(req, res) {
  dt = new Date();
  dbo.collection(req.params.id).find().limit(1).sort({$natural:-1}).toArray(function(err, result) {
    if (err) throw err;
    bal = parseInt(result[0].balance);
    if((parseInt(result[0].balance) - parseInt(req.body.withdraw_amount)) < 0){
      res.render('result', { balance: bal, reference_id:req.params.id,status: 0 });
    }
    else{
      bal = bal - parseInt(req.body.withdraw_amount);
      dbo.collection(req.params.id).insertOne({withdraw: parseInt(req.body.withdraw_amount) , balance: bal, timestamp:dt.toString()});
      res.render('result', { balance: bal, reference_id:req.params.id,status: 1 });
    }
  });
});

module.exports = router;
