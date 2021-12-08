'use strict';

const express = require('express');
const { executeCommand } = require('./controllers');
const path = require('path');
const open = require('open');

const server = () => {
	const app = express();
	const port = 3000;
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.use('/', express.static(path.join(__dirname, '../static')));
	app.post('/command', executeCommand);
	app.listen(port, () => {
		console.log(`app is listening on port ${port}`);
	});
	open('http://localhost:3000/index.html');
};

module.exports = {
	server,
};
