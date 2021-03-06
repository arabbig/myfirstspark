/*
 This example code I find it at :
 https://github.com/Blackmist/hdinsight-eventhub-example/blob/master/dashboard/server.js
*/

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
var exec = require('exec');

//Serve up static files
//app.use(express.static(__dirname + '/public'));
app.use('/dashboard', express.static('public'));

server.listen(port, function() {
  console.log('server listening at port %d', port)
});

//Handle Socket.io connections
var blankCnt = 0;
var pathToJAR = '../../java2/out/artifacts/TweetTopTagByLanguage_jar/';
var startcmd = 'spark-submit --class TopTagByLanguage --master local[4] ' + pathToJAR + 'TweetTopTagByLanguage.jar';
var sparkOn = false;
io.on('connection', function(socket) {
  socket.emit('server',{});
  socket.on('browser' ,function(data) {
     console.log('Visited while sparkOn='+sparkOn);
     if(sparkOn) return;
     sparkOn = true;
     exec('find /tmp -name "blockmgr*" | xargs rm -r', function(err,out,code){});
     exec(startcmd, function(err, out, code) {
       if (err instanceof Error) throw err;
       process.stderr.write(err);
       //process.stdout.write(out);
       //process.exit(code);
     })
  });

  socket.on('topTags', function(data) {
  	console.log('Get blank input ' + blankCnt + ' times');
  	//var rnd = Math.random()*10 
  	//console.log('Random value = ' + rnd);
  	if(blankCnt > 3) {
            console.log('Shutdown');
  	        socket.emit('shutdown', {});
            blankCnt = 0;
            sparkOn = false;
            socket.broadcast.emit('server',{});
            return;
  	}
  	else if(!data.length) blankCnt++;

    //console.log('topTags N=' + data.length );
    socket.broadcast.emit('topTags', data);

  });

  socket.on('topTagByLangs', function(data) {
    //console.log('got topLangsByTag' );
    socket.broadcast.emit('topTagByLangs', data);
  });

});
