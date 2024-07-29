//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
require("dotenv").config();

//adding mongoose
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Mongoose Connect mongodb://localhost:27017/dbName
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to Database");
  } catch (error) {
    console.error("Failed to connect to database:", error.message);
    process.exit(1); // Exit the process with an error code
  }
}

connectToDatabase();

mongoose.connection.on("open", function () {
  console.log("Connected to Database");
});

//creating item schema

const itemsSchema = {
  name: String,
};

//creating mongoose model
const Item = mongoose.model("Item", itemsSchema);

//adding defaults items

const newitem1 = new Item({ name: "item1" });
const newitem2 = new Item({ name: "item2" });
const newitem3 = new Item({ name: "item3" });

const defaultItems = [newitem1, newitem2, newitem3];

//For custom List

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

//https://mongoosejs.com/docs/api/model.html
//inserting element

app.get("/", function (req, res) {
  Item.find()
    .then((item) => {
      if (item.length == 0) {
        Item.insertMany(defaultItems).then(() => {
          console.log("Success");
          res.redirect("/");
        });
      }
      res.render("list", { listTitle: "Today", newListItems: item });
    })
    .catch((err) => {
      console.error(err);
    });
});

//Adding new Elements in List
app.post("/", function (req, res) {
  const itemName = new Item({ name: req.body.newItem });
  const listName = req.body.list;
  const item = new Item({ name: itemName.name });
  if (listName == "Today") {
    itemName.save().then((item) => {
      console.log("Inserted ${item.name} successfully");
      res.redirect("/");
    });
  } else {
    List.findOne({ name: listName }).then(async (list) => {
      list.items.push(item);
      await list.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (request, response) {
  const checkboxId = request.body.checkbox;
  const listName = request.body.listName;

  if (listName == "Today") {
    Item.deleteOne({ _id: checkboxId }).then((item) => {
      console.log("Successfully Deleted Item");
      response.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkboxId } } }
    )
      .exec()
      .then((list) => {
        response.redirect("/" + listName);
      })
      .catch((err) => {
        // Handle the error
      });
  }
});

//Custom List
app.get("/:customListName", function (req, res) {
  const listName = _.capitalize(req.params.customListName);
  console.log(listName);
  List.findOne({ name: listName }).then((list) => {
    if (!list) {
      //Add new List if It Doesn't Exist
      const newList = new List({
        name: listName,
        items: defaultItems,
      });
      newList.save();
      res.redirect("/" + listName);
      console.log("Doesn't Exist");
    } else {
      //Show Existing List
      res.render("list", { listTitle: list.name, newListItems: list.items });
      console.log("Exist");
    }
  });
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3001, function () {
  console.log("Server started on port 3001");
});
