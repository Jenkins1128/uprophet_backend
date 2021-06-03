const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const signin = require('handleSignin');

const db = require('knex')({
	client: 'mysql',
	connection: {
		host: '127.0.0.1',
		user: 'root',
		password: 'Ij112897',
		database: 'uprophet'
	}
});

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
	res.send('it is working!');
});

app.post('/signin', (req, res) => signin.handleSignin(req, res, db, bcrypt));

/*
 / --> res = this is working
*/
