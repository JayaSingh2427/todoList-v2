const express=require("express")
const bodyParser=require("body-parser")
const ejs=require("ejs")
const mongoose = require("mongoose");
const _ = require("lodash")
const date=require(__dirname+"/date.js")

const app=express()
//var items= ["Buy Food","Cook food","Eat Food"];
var workItems=[];

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static('public'))

mongoose.connect("mongodb://127.0.0.1:27017/todolistDb",{useNewUrlParser:true});

const itemsSchema = new mongoose.Schema({
    name : String
})

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name : "Hit the + button to add a new list."
});

const item3 = new Item({
    name : "<-- Hit this to delete an item."
})

const defaultItems = [item1 , item2 ,item3];

/*Item.insertMany(defaultItems)
.then(result => {
    console.log("inserted");
})
.catch(err => {
    console.log(err);
})*/



app.get('/', function(req, res) {
    const handleResponse = (items) => {
      console.log("successfully saved default items to db");
      res.render("list", { listTitle: "Today", newListItems: items });
    };
  
    Item.find({})
      .then(foundItems => {
        if (foundItems.length === 0) {
          return Item.insertMany(defaultItems);
        } else {
          return foundItems;
        }
      })
      .then(handleResponse)
      .catch(err => {
        console.log(err);
      });
  });
  

  const listSchema = new mongoose.Schema({
    name : String,
    items : [itemsSchema]

  })

  const List = mongoose.model("List",listSchema)

  app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
  
    List.findOne({ name: customListName })
      .then(foundList => {
        if (!foundList) {
          // Create a new list
          const list = new List({
            name: customListName,
            items: defaultItems
          });
  
          return list.save();
        } else {
          // Show an existing list
          return foundList;
        }
      })
      .then(list => {
        res.render("list", {
          listTitle: list.name,
          newListItems: list.items
        });
      })
      .catch(err => {
        console.log(err);
      });
  });
  

app.post("/",function(req,res){
   /* let item=req.body.myItem;
    console.log(req.body);
   
    if(req.body.button==="Work"){
    workItems.push(item);
    res.redirect("/work");
    }
    else {
    items.push(item);
    res.redirect("/");
    }
    */

    let newItem = req.body.myItem;
    const listName = req.body.button;

    const item = new Item({
        name : newItem
    })
    
    if(listName === "Today"){
    item.save();
    res.redirect("/");
    }else{
      List.findOne({ name: listName })
  .then(foundList => {
    foundList.items.push(item);
    return foundList.save();
  })
  .then(() => {
    res.redirect("/" + listName);
  })
  .catch(err => {
    // Handle any errors
  });

    }
})


app.post("/delete",function(req,res){
    checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    console.log(checkedItemId);

    if (listName === "Today") {
      Item.findByIdAndRemove(checkedItemId)
        .then(() => {
          console.log("Successfully deleted checked item");
          res.redirect("/");
        })
        .catch((err) => {
          console.error("Error deleting checked item:", err);
          res.status(500).send("Error deleting checked item.");
        });
    } else {
      List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId }}})
        .then(() => {
          res.redirect("/" + listName);
        })
        .catch((err) => {
          console.error("Error updating list:", err);
          res.status(500).send("Error updating list.");
        });
    }
    

  
   
   /* Item.findByIdAndRemove(checkedItemId)
    .then(result => {
        console.log("removed successfully");
    })
    .catch(err =>{
        console.log(err);
    })*/
});



app.get("/work",function(req,res){
    res.render("list",{listTitle:"Work list",newListItem:workItems})
})

app.get("/about",function(req,res){
    res.render("about");
})

app.listen(3000,function(){
    console.log("server started at port 3000")
})