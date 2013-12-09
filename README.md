# Humdrum
A simple script that continuously compares a script's output against an expected output file.

## Installation
Install Node.js with `sudo apt-get install nodejs` or equivalent. Install salviati with `npm -g install salviati`.

## Usage
Run `salviati command -i input-file -o output-file` to start the daemon.

For example, `salviati python3 ./test/pytest.py -i ./test/test-input -o ./test/test-output` will run `pytest.py` with test input `test-input` and compare its output against `test-output`.

## Dependencies
* Node.js
* Commander.js
* Nodemon