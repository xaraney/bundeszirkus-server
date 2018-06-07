var fs = require('fs');

exports.fileNames = function(callback){
   
    var files = ""

    fs.readdir('data', function(err, items) {

        if(err){
            return callback(err);
        }

        for (var i=0; i<items.length; i++) {
            files += (items[i] + "|")     
        }

        callback(null, files)
    });
};