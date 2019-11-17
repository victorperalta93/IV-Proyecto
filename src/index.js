const express = require('express');
const fileUpload = require('express-fileupload');
const app  = express();
const uniqueFilename = require('unique-filename');
const amqp = require('amqplib/callback_api');
const worker = require('./worker');

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(fileUpload());

app.get('/status',(req,res) =>{
    res.json({status: 'OK'})
});

app.post('/compilar',(req,res) =>{
    if(!req.files)
        return res.status(400).send('No se encontró el archivo fuente.');

    if(!req.files.documento)
        return res.status(400).send("Nombre incorrecto.");

    let documento = req.files.documento;
    let destino = uniqueFilename('doc') + ".tex";

    documento.mv(destino, function(err) {
        if (err)
            return res.status(500).send(err);

        amqp.connect('amqp://localhost', function(error0, connection) {
            if (error0) 
                throw error0;

            connection.createChannel(function(error1, channel) {
                if (error1)
                    throw error1;
                
                channel.assertQueue('', {
                    exclusive: true
                }, function(error2, q) {
                    if (error2) {
                        throw error2;
                    }
                    var correlationId = generateUuid();
                    console.log("Enviando petición de compilar...");
        
                    channel.consume(q.queue, function(msg) {
                        if (msg.properties.correlationId === correlationId) 
                            res.download(msg.content.toString());
                    }, {
                        noAck: true
                    });
        
                    channel.sendToQueue('compiler_queue',
                        Buffer.from(destino), {
                            correlationId: correlationId,
                            replyTo: q.queue
                        });
                });
            });
        });
    });
});

function generateUuid() {
    return Math.random().toString() +
        Math.random().toString() +
        Math.random().toString();
}

worker();
app.listen(PORT, () => console.log(`Servidor iniciado en puerto: ${PORT}`));

module.exports = app;