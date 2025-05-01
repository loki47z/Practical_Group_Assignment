const express = require("express")
const fs = require("fs")
const session = require('express-session')
const app = express()

const PORT = 4000

app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))
app.set("view engine", "ejs")
app.use(session({
    secret: 'fjdsfsjdf',
    resave: false,
    saveUninitialized: true
}))

function adminOnly(req, res, next){
    if(req.session.user && req.session.user.role === "admin"){
        next()
    }
    else{
        res.redirect("/home")
    }
}

let products = fs.readFileSync('public/data.json', 'utf8')
let jsonProducts = JSON.parse(products)

app.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`)
})

app.get("/", (req, res) =>{
    res.redirect("/login")
})
app.get("/products", (req,res) =>{
    res.send(jsonProducts)
})
app.get("/home", (req,res) =>{
    res.render("home1")
})
app.get("/login", (req,res) =>{
    res.render("login")
})
app.post("/login", (req,res) =>{
    const admin = 
        {
            username: "admin",
            password: "12345"
        }
    const standard = 
        {
            username: "standard",
            password: "12345"
        }
    const err = "Incorrent Username or Password"
    if(admin.username === req.body.username && admin.password === req.body.password){
        req.session.user = {
            username: admin.username,
            role: 'admin'
        }
        res.render("home", {user: admin.username})
    }
    else if(standard.username === req.body.username && standard.password === req.body.password){
        req.session.user = {
            username: standard.username,
            role: "standard"
        }        
        res.render("home", {user: standard.username})
    }
    else{
        res.render("login", {error: err})
    }
})
app.get("/products/add", (req,res) =>{
    res.render("addProducts")
})
app.post("/products/add", (req,res) =>{
    const prodName = req.body.productName
    const category = req.body.category
    const quantity = req.body.quantity
    const price = req.body.price
    const id = jsonProducts.length + 1
    const prodData = {
            "Id": id,
            "Name": prodName,
            "Category": category,
            "Quantity": quantity,
            "Price": price
    }
    jsonProducts.push(prodData)
    console.log(id)
    fs.writeFile('public/data.json', JSON.stringify(jsonProducts, null, 2), (err) => {
        if (err) {
            console.error("Error writing to file:", err);
            return res.status(500).send("Error saving product");
        }
        res.redirect("/products/view");
    });
})

app.get("/products/view", (req,res)=>{
    console.log(jsonProducts)
    res.render("products", {jsonProducts})
})

app.get("/dashboard", adminOnly, (req,res) =>{
    res.render("dashboard")
})

// Show edit form
app.get("/products/edit/:id", (req, res) => {
    const id = parseInt(req.params.id)
    const product = jsonProducts.find(p => p.Id === id)
    if (!product) return res.status(404).send("Product not found")
    res.render("editProducts", { product })
})

// Handle edit form submission
app.post("/products/edit/:id", (req, res) => {
    const id = parseInt(req.params.id)
    const index = jsonProducts.findIndex(p => p.Id === id)
    if (index === -1) return res.status(404).send("Product not found")

    jsonProducts[index] = {
        Id: id,
        Name: req.body.productName,
        Category: req.body.category,
        Quantity: req.body.quantity,
        Price: req.body.price
    }

    fs.writeFile('public/data.json', JSON.stringify(jsonProducts, null, 2), (err) => {
        if (err) return res.status(500).send("Failed to save changes")
        res.redirect("/products/view")
    })
})

app.get("/products/delete/:id", (req, res) => {
    const id = parseInt(req.params.id)
    jsonProducts = jsonProducts.filter(p => p.Id !== id)

    // Reassign IDs (optional)
    jsonProducts = jsonProducts.map((p, index) => ({
        ...p,
        Id: index + 1
    }))

    fs.writeFile('public/data.json', JSON.stringify(jsonProducts, null, 2), (err) => {
        if (err) return res.status(500).send("Failed to delete product")
        res.redirect("/products/view")
    })
})


app.use((req, res, next)=>{
    res.send("Page does not exist")
})