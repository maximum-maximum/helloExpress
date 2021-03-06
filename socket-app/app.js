// S01. 必要なモジュールを読み込む
var http = require('http');
var { Server } = require('socket.io');
var fs = require('fs');

// S02. HTTPサーバを生成する
var server = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type' : 'text/html'});
    res.end(fs.readFileSync(__dirname + '/index.html', 'utf-8'));
});  // ポート競合の場合は値を変更
server.listen(3333);

// S03. HTTPサーバにソケットをひも付ける（WebSocket有効化）
var io = new Server(server);
 
// チャット機能
// S04. connectionイベントを受信する
var chat = io.of('/chat').on('connection', function(socket) {
    var room = '';
    var name = '';
 
    // roomへの入室は、「socket.join(room名)」
    socket.on('client_to_server_join', function(data) {
        room = data.value;
        socket.join(room);
    });
    // S05. client_to_serverイベント・データを受信する
    socket.on('client_to_server', function(data) {
        // S06. server_to_clientイベント・データを送信する
        chat.to(room).emit('server_to_client', {value : data.value});
    });
    // S07. client_to_server_broadcastイベント・データを受信し、送信元以外に送信する
    socket.on('client_to_server_broadcast', function(data) {
        socket.broadcast.to(room).emit('server_to_client', {value : data.value});
    });
    // S08. client_to_server_personalイベント・データを受信し、送信元のみに送信する
    socket.on('client_to_server_personal', function(data) {
        var id = socket.id;
        name = data.value;
        var personalMessage = "あなたは、" + name + "さんとして入室しました。"
        chat.to(id).emit('server_to_client', {value : personalMessage});
    });
    // S09. dicconnectイベントを受信し、退出メッセージを送信する
    socket.on('disconnect', function() {
        if (name == '') {
            console.log("未入室のまま、どこかへ去っていきました。");
        } else {
            var endMessage = name + "さんが退出しました。"
            chat.to(room).emit('server_to_client', {value : endMessage});
        }
    });
});
 
// 今日の運勢機能
var fortune = io.of('/fortune').on('connection', function(socket) {
    var id = socket.id;
    // 運勢の配列からランダムで取得してアクセスしたクライアントに送信する
    var fortunes = ["大吉", "吉", "中吉", "小吉", "末吉", "凶", "大凶"];
    var selectedFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
    var todaysFortune = "今日のあなたの運勢は… " + selectedFortune + " です。"
    fortune.to(id).emit('server_to_client', {value : todaysFortune});
});