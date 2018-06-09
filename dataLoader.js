var fs = require('fs');
var DOMParser = new (require('xmldom')).DOMParser;

function findElements(element, xml) {
    var output = [];

    var nodes = xml.childNodes;

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


function structureComment2(comment){


    let result = []

    let parts = comment.split("–")

    parts.forEach(function(part){
        let r = /(?:\(|^)?(.*?) \[(.*?)\](?::|, an .+? gewandt:) (.*?)(?:\)|$)/g
        let match = r.exec(part);

        // TODO Armin Schuster	Weil am Rhein] [CDU/CSU	Das macht keinen Spaß!
        // Armin Schuster	Weil am Rhein] [CDU/CSU	Das würde ich aber auch empfehlen!
        if(match){

            let fullname = match[1].trim()
            let party = match[2].trim()
            let text = match[3].trim()
    
            // ... in case fullname is e.g. "Gegenruf des Abg. Karsten Hilse"
            fullname = fullname.replace(/Gegenrufe? de(s|r) Abg[.]?/, "").trim()
                
            // ... in case fullname has a predeceding "Abg" or "Abg."
            fullname = fullname.replace(/Abg.?/,"").trim()
    
            result.push({fullname:fullname, party:party, text:text})
        }
    })

    return result;
}





/**
 * Returns a structured comment object
 * e.g. 
 * (Beifall bei der AfD – Martin Schulz [SPD]: Da kennt ihr euch ja aus!)
 * ->
 * {fullName:"Martin Schulz", party:"SPD", text:"Da kennt ihr euch ja aus!"}
 * @param {*} comment the comment to categorize as a string 
 */
function structureComment(comment){ // TODO which party is talking? // TODO date
    /*
     * Regex will result in capturing groups, e.g. for "(Beifall bei der AfD – Martin Schulz [SPD]: Da kennt ihr euch ja aus!)"
     * 2. "Martin Schulz"
     * 3. "SPD"
     * 4. "Da kennt ihr euch ja aus!"
     * 
     * Some comments also include "an ... gewandt", e.g.
     * "Dr. Volker Ullrich [CDU/CSU], an DIE LINKE gewandt: Wo ist denn Frau Wagenknecht heute?)"
     * 
     * Good resource for testing regex: regex101.com
     */
    var myRegexp = /(?:\(|^)?(.*?) \[(.*?)\](?::|, an .+? gewandt:) (.*?)(?:\)|$)/g
    var match = myRegexp.exec(comment);

    if(match){

        let fullname = match[1]
        let party = match[2]
        let text = match[3]

        let result = []

        if(party.includes("[")){
            console.log(comment)
        }

        // Next, we have to deal with various special cases ... 

        // ... in case fullname is e.g. "Gegenruf des Abg. Karsten Hilse"
        fullname = fullname.replace(/Gegenrufe? de(s|r) Abg[.]?/, "").trim()
                  
        // ... in case fullname is e.g. "Abgeordnete der AfD erheben sich – Lachen bei der SPD und der LINKEN – Matthias W. Birkwald"
        fullname = fullname.split("–").pop().trim() // for double names e.g. "Michael Grosse-Brömer" a different kind of dash is used

        // ... in case fullname has a predeceding "Abg" or "Abg."
        fullname = fullname.replace(/Abg.?/,"").trim()
      
        // ... in case text is e.g. "Nein, das sind kommunale Investitionen! – Gegenrufe des Abg. Eckhardt Rehberg [CDU/CSU]"
        //                          "Das war gut! Treffer! – Christine Aschenberg-Dugnus [FDP]: Wir waren verantwortungsvoll!"
        let textArr = text.split("–")
        text = textArr.shift().trim()

        result.push({fullname:fullname, party:party, text:text})
        
        textArr.forEach(function(potentialComment){
            let additionalComments = structureComment(potentialComment.trim())
            if(additionalComments){
                additionalComments.forEach(function (c){
                    if(c){
                        result.push(c)
                    }
                })
            }  
        })
        
        // (Lachen bei der AfD – Dr. Alexander Gauland [AfD], an die CDU/CSU gewandt: Da seht ihr mal: Ihr kommt mit der Anpassung nicht weit! Da habt ihr den Salat! 
        // – Gegenruf des Abg. Michael Brand [Fulda] [CDU/CSU]: Das ist nicht unsere Anpassung, Herr Gauland! Sie sind denen näher als uns!)

        // {"fullname":"Dr. Alexander Gauland","party":"AfD","text":"„Faschistisch“ fehlt! – Gegenruf der Abg. Dagmar Ziegler [SPD]: Wenn Sie meinen, Herr Gauland!"}

        // TODO "Das ist nicht unsere Anpassung, Herr Gauland! Sie sind denen näher als uns!" does not work at all
        /*
        // Beifall bei der CDU/CSU sowie des Carsten Schneider	Erfurt] [SPD] – Johannes Vogel [Olpe] [FDP	Bedenke das Ende, Peter! Bedenke das Ende!

        // Beifall bei der CDU/CSU und der FDP sowie des Dr. Tobias Lindner	BÜNDNIS 90/DIE GRÜNEN] – Andreas Mattfeldt [CDU/CSU	Da hast du recht!
        Beifall bei der CDU/CSU sowie bei ordneten der SPD und der AfD und der Abg. Katrin Göring-Eckardt	BÜNDNIS 90/DIE GRÜNEN] – Armin-Paulus Hampel [AfD	Dann hat sich die Aktuelle Stunde ja schon gelohnt, Herr Abgeordneter!
*/

        
        return result;
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
                let resultArr = structureComment2(comment)
                if(resultArr){
                    resultArr.forEach(function(result){
                        structuredComments.push(result)
                    });   
                }
            });
        }

        callback(null, {data:structuredComments})
    });
};