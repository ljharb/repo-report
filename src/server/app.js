'use strict';

const express = require('express');
const { executeCommand } = require('./controllers');
const path = require('path');
const open = require('open');

const server = (table) => {
	const app = express();
	const port = 3000;
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.set('view engine', 'ejs');
	app.get('/', (req, res) => {
		res.render('index', { table });
	});
	app.use('/static', express.static(path.join(__dirname, '../static')));
	app.post('/command', executeCommand);
	app.listen(port, () => {
		console.log(`app is listening on port ${port}`);
	});
	open('http://localhost:3000/');
};

module.exports = {
	server,
};
