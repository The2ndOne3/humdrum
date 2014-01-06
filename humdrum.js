#!/usr/bin/env node

var child = require('child_process')
  , spawn = child.spawn
  , exec = child.exec;

// CLI setup.
var program = require('commander')
  .version(require('./package').version)
  .usage('<command> [options] [nodemon-options]')
  .description('Continuously run a script against an expected output file.')
  .option('-o, --output <file>', 'expected output file')
  .option('--nodemon-help', 'show nodemon help')
  .option('--nodemon-version', 'show nodemon version');

// Access nodemon CLI texts.
var get_output_of_command = function(command, callback){
  exec(command, function(err, stdout){
    if(err){
      console.error(err);
    }
    callback(stdout.toString());
  });
};

if(program.nodemonHelp){
  get_output_of_command('node node_modules/nodemon/ --help', function(output){
    process.stdout.write(output);
    process.exit(0);
  });
}
if(program.nodemonVersion){
  get_output_of_command('node node_modules/nodemon/ --version', function(output){
    process.stdout.write(output);
    process.exit(0);
  });
}

// Do nothing with unknown options -- capture for nodemon.
program.unknownOption = function(){};

// See bug @ https://github.com/nitoyon/livereloadx/commit/521581279a1f1d840685d49729d6d0cf3a64d1b
// and hack @ https://github.com/visionmedia/commander.js/pull/121
program._name = 'humdrum';
var parsed = program.parseOptions(program.normalize(process.argv.slice(2)));
program.args = parsed.args;
if (parsed.unknown.length > 0) {
  program.parseArgs([], parsed.unknown);
}
// We don't want to die on unknown flags -- those may be intended for nodemon.
var monitor_flags = parsed.unknown;

// Force a `command` argument.
if(program.args.length < 1){
  var missing_args = ['<command>'].slice(program.args.length);
  return console.error(
    '\n' +
    '  error: ' + missing_args.join(', ') +
    ' argument' + (missing_args.length > 1 ? 's' : '') + ' missing' +
    '\n'
  );
}

// Force an output file option.
if(!program.output){
  return console.error(
    '\n' +
    'error: -o, --output <file> mandatory argument missing' +
    '\n'
  );
}

// Monitor setup.
var monitor = spawn('/usr/bin/env',
  ['node', 'node_modules/nodemon']
    .concat(monitor_flags)
    .concat(['--exec'])
    .concat(program.args),
  {
    stdio: [0, 'pipe', 2]
});

monitor.on('error', function(err){
  if(err.code == 'ENOENT'){
    console.error(
      '\n' +
      '  error: command does not exist.' +
      '\n'
    );
  }
  else{
    console.error();
    console.error('  fatal error occurred while executing command.');
    console.error(err);
    console.error();
  }
  process.exit(100);
});
monitor.on('exit', function(code){
  console.error('e with code', code);
});

process.on('exit', function(){
  monitor.kill('SIGHUP');
  monitor.kill('SIGKILL');
});

// Testing setup.
var diff = require('ansidiff')
  , chardet = require('jschardet')
  , fs = require('fs')
  , path = require('path');

// Get the output file.
try{
  var expected = fs.readFileSync(path.join(__dirname, program.output));
  expected = expected.toString(chardet.detect(expected).encoding);
}
catch(err){
  if(err.code == 'ENOENT'){
    console.error(
      '\n' +
      '  error: expected output file does not exist.' +
      '\n'
    );
  }
  else if(err.code == 'EACCES'){
    console.error(
      '\n' +
      '  error: you do not have permission to read the expected output file.' +
      '\n'
    );
  }
  else{
    console.error();
    console.error('  fatal error occurred while opening expected output file.');
    console.error(err);
    console.error();
  }
  process.exit(200);
}

// Validate output. If output is not valid, indicate which parts are not.
var check_output = function(output, expected){
  var difference = diff.chars(expected.trim(), output.trim());
  var correctness = difference.indexOf("\x1B") == -1;

  return {
    correct: correctness,
    diff: difference
  };
};

// Hook into stdout, compiling output until we have the full execution result.
// Then check the output against what we expect.
var current_output = '';
monitor.stdout.on('readable', function(){
  var chunk = monitor.stdout.read().toString();
  if(chunk.indexOf('[nodemon]') == -1){
    current_output += chunk;
  }
  else if(chunk.indexOf('clean exit') > -1){
    console.log();
    var check = check_output(current_output, expected);
    if(check.correct){
      console.log('\x1B[32mTest passed!\x1B[0m');
    }
    else{
      console.log('\x1B[1;31mTest failed:\x1B[0m');
      console.log(check.diff);
    }
    console.log('Waiting for changes...');
    current_output = '';
  }
  else if(chunk.indexOf('app crashed') > -1){
    console.log();
    current_output = '';
    console.log('\x1B[1;31mTest failed -- build crashed.\x1B[0m');
  }
});
