var fs = require('fs');
var DOMParser = new (require('xmldom')).DOMParser;

function findElements(element, xml) {
    var output = [];

    var nodes = xml.childNodes;

    // console.log(nodes)

    if (nodes != null) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeName == element && nodes[i].childNodes.length == 1) {
                output.push(nodes[i].childNodes[0].nodeValue);
            } else {
                output = output.concat(findElements(element, nodes[i]));
            }
        }
    }
    return output;
}

/**
 * Returns a structured comment object
 * e.g. 
 * (Beifall bei der AfD – Martin Schulz [SPD]: Da kennt ihr euch ja aus!)
 * ->
 * {fullName:"Martin Schulz", party:"SPD", text:"Da kennt ihr euch ja aus!"}
 * @param {*} comment the comment to categorize as a string 
 */
function structureComment(comment){ // TODO which party is talking?
    /*
        * Regex to find comments w/ capture groups: \((.*? – .*?)?(.*?) \[(.*?)\]: (.*?)\)
        * This will result in 4 capturing groups, e.g. for (Beifall bei der AfD – Martin Schulz [SPD]: Da kennt ihr euch ja aus!)
        * 1. "Beifall bei der AfD – " 
        * 2. "Martin Schulz"
        * 3. "SPD"
        * 4. "Da kennt ihr euch ja aus!"
        */
    var myRegexp = /\((.*? – .*?)?(.*?) \[(.*?)\]: (.*?)\)/g;
    var match = myRegexp.exec(comment);

    if(match){
        return {fullName:match[2], party:match[3], text:match[4]}
    }

    return null
}

exports.comments = function(callback){
   
    var dirPath = "data"
    var files = ""

    fs.readdir(dirPath, function(err, items) {

        if(err){
            return callback(err);
        }

        var structuredComments = []

        for (var i=0; i<items.length; i++) {
            let fileName = items[i]
            let filePath = dirPath + "/" + fileName

            var fileContent = fs.readFileSync(filePath, "utf8")
           
            var document = DOMParser.parseFromString(fileContent);
            var comments = findElements("kommentar", document);

            comments.forEach(function(comment) {
                let structuredComment = structureComment(comment)
                if(structuredComment){
                    structuredComments.push(structuredComment)
                }
            });
        }

        // just for fun, list all comments for now:
        var allComments = ""
        structuredComments.forEach(function(comment){
            allComments += ("["+comment.fullName+",\t "+ comment.party+"]:\t " + comment.text + "<br>")
        })

        callback(null, allComments)
    });
};