'use strict';

const express = require('express');
const { executeCommand } = require('./controllers');
const path = require('path');
const open = require('open');

const server = () => {
	const app = express();
	const { port } = process.env;
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.use('/', express.static(path.join(__dirname, '../static')));
	app.post('/command', executeCommand);
	app.listen(port, () => {
		console.log(`Api is listening on port ${port}`);
		console.log(`View the gui on: http://localhost:${port}/`);
	});
	open(`http://localhost:${port}/`);
};

module.exports = {
	server,
};
