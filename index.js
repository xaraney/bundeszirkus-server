const express = require('express')
const app = express()



app.use(express.static('public'))

app.get('/politicians', function(req, res){
    res.send('angela merkel')
})

app.listen(3000, () => console.log('Server running on port 3000'))

  