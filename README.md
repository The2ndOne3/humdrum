# Humdrum
A simple script that continuously compares a script's output against an expected output file.

## Installation
Install Node.js, then install Humdrum with `npm -g install humdrum`.

## Usage
Run `humdrum <command> -o <output-file>` to start. Humdrum captures `stdout`, comparing execution output against a file of expected output. For example, to compare the output of a Python script, you can run `humdrum python3 script.py -o expected-output`.

Humdrum is built on top of [Nodemon](https://github.com/remy/nodemon), and will accept any flag that Nodemon accepts. For example, to watch `.coffee` files as well as `.js` files, you can run `humdrum node script.js -e js,coffee,litcoffee`. Humdrum's file watching behaviour is identical to that of Nodemon's.

## Known Issues
1. Running humdrum with invalid commands causes a `spawn ENOENT`. A `SIGINT` will then cause a further error when killing the child process and input to that terminal will produce a `read EIO` error.

## License
&copy; 2013 Lehao Zhang
Released under the MIT license.
