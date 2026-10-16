// Select production before Nest chooses an environment file.
process.env.NODE_ENV = 'production';
require('../dist/main.js');
