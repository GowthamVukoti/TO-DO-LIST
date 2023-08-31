//requiring the express
const express = require("express");

//requiring the body parser
const bodyParser = require("body-parser");

//requiring the mongoose
const mongoose=require("mongoose");

//requiring the ejs
const { name } = require("ejs");

//requiring the lodash
const _=require("lodash");

//creating the instance like thing for the express module
const app = express();

//setting up the view engine for the ejs its like use the vies folder
app.set('view engine', 'ejs');

//using the bodyparser
app.use(bodyParser.urlencoded({extended: true}));

//using the public folder i.e making it avalaiable for the server explicitly
app.use(express.static("public"));

//making a connection to the database using the mongoose
mongoose.connect('mongodb://localhost/todolistDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    family: 4
})
.then(db => console.log('DB is connected'))
.catch(err => console.log(err));

//creating the itemSchena for the home page
const itemSchema={
  name:String
};

//creating the model for the schema like creating the collection
const Item=mongoose.model("Item",itemSchema);

//generating the default items for the list
const item=new Item({
  name:"Eat"
});
const item2=new Item({
  name:"drink"
});
const item3=new Item({
  name:"sleep"
});

//pusing the genetrated default items into an array so that we can pass that array to display in the page.
const defaultItems=[item,item2,item3];

//maing the get request for the root route
//in the root route it checks if the list is empty or not if the list is empty then it ads the default list items 
//and redirect the rot route again now it checks if the list is empty or not so now it dont add the items it just renders the data
app.get("/", function(req, res) {

  Item.find({})
  .then(items => {
    if(items.length==0){
      Item.insertMany(defaultItems);
      res.redirect("/")
    }else{
      const newListItems = items.map(item => item); // Assuming `name` is the property you want to render
      res.render("list", { listTitle: "Today", newListItems: newListItems });
    }
   
  })
  .catch(err => {
    console.error('Error fetching items:', err);
  });
});

//creting a new schema for the custom lists
const listSchema={
  name:String,
  items:[itemSchema]
}

//making the model for the new listSchema
const List=mongoose.model("List",listSchema)

//making the get request for the new custom list
app.get("/:customList",function(req,res){
  const customListName= _.capitalize(req.params.customList);
  List.findOne({ name: customListName }).then(foundList => {
    if (!foundList) {
      const list=new List({
        name:customListName,
        items:defaultItems
      });
      list.save();
      res.redirect("/"+customListName)
    } else {
      
      res.render("list",{listTitle:foundList.name,newListItems:foundList.items})
    }
  }).catch(error => {
    console.error("Error finding list:", error);
    res.sendStatus(500); // Internal server error
  });
 

});

//making the post request for the both home list page and the custom generated ones
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName=req.body.list;
  const item=new Item({
    name:itemName
  })
  if(listName=="Today"){
    item.save();
    res.redirect("/")
  }else{
    
    List.findOne({ name: listName }).then(foundList => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    }).catch(error => {
      console.error("Error finding list:", error);
      res.sendStatus(500); // Internal server error
    });


  }

});

//making the post request for deleting the items in the list
app.post("/delete", function(req, res) {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({ _id: checkedItem })
      .then(result => {
        if (result.deletedCount === 1) {
          console.log("Document deleted successfully.");
        } else {
          console.log("Document not found.");
        }
        res.redirect("/");
      })
      .catch(err => {
        console.error("Error deleting document:", err);
        res.redirect("/");
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItem } } },
      { useFindAndModify: false }
    )
      .then(result => {
        if (result) {
          console.log("Item deleted from custom list.");
        } else {
          console.log("Custom list not found.");
        }
        res.redirect("/" + listName);
      })
      .catch(err => {
        console.error("Error deleting item from custom list:", err);
        res.redirect("/" + listName);
      });
  }
});

//mking the get requests for the work and about routes
app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

