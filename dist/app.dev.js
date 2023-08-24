"use strict";

//jshint esversion:6
var express = require("express");

var bodyParser = require("body-parser");

var _ = require("lodash"); //adding mongoose


var mongoose = require("mongoose");

var app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express["static"]("public")); //Mongoose Connect mongodb://localhost:27017/dbName

function connectToDatabase() {
  return regeneratorRuntime.async(function connectToDatabase$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(mongoose.connect("mongodb+srv://admin-piyush:test123@cluster0.gqcgwx7.mongodb.net/todolistDB?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true
          }));

        case 3:
          console.log("Connected to Database");
          _context.next = 10;
          break;

        case 6:
          _context.prev = 6;
          _context.t0 = _context["catch"](0);
          console.error("Failed to connect to database:", _context.t0.message);
          process.exit(1); // Exit the process with an error code

        case 10:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 6]]);
}

connectToDatabase();
mongoose.connection.on("open", function () {
  console.log("Connected to Database");
}); //creating item schema

var itemsSchema = {
  name: String
}; //creating mongoose model

var Item = mongoose.model("Item", itemsSchema); //adding defaults items

var newitem1 = new Item({
  name: "item1"
});
var newitem2 = new Item({
  name: "item2"
});
var newitem3 = new Item({
  name: "item3"
});
var defaultItems = [newitem1, newitem2, newitem3]; //For custom List

var listSchema = {
  name: String,
  items: [itemsSchema]
};
var List = mongoose.model("List", listSchema); //https://mongoosejs.com/docs/api/model.html
//inserting element

app.get("/", function (req, res) {
  Item.find().then(function (item) {
    if (item.length == 0) {
      Item.insertMany(defaultItems).then(function () {
        console.log("Success");
        res.redirect("/");
      });
    }

    res.render("list", {
      listTitle: "Today",
      newListItems: item
    });
  })["catch"](function (err) {
    console.error(err);
  });
}); //Adding new Elements in List

app.post("/", function (req, res) {
  var itemName = new Item({
    name: req.body.newItem
  });
  var listName = req.body.list;
  var item = new Item({
    name: itemName.name
  });

  if (listName == "Today") {
    itemName.save().then(function (item) {
      console.log("Inserted ${item.name} successfully");
      res.redirect("/");
    });
  } else {
    List.findOne({
      name: listName
    }).then(function _callee(list) {
      return regeneratorRuntime.async(function _callee$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              list.items.push(item);
              _context2.next = 3;
              return regeneratorRuntime.awrap(list.save());

            case 3:
              res.redirect("/" + listName);

            case 4:
            case "end":
              return _context2.stop();
          }
        }
      });
    });
  }
});
app.post("/delete", function (request, response) {
  var checkboxId = request.body.checkbox;
  var listName = request.body.listName;

  if (listName == "Today") {
    Item.deleteOne({
      _id: checkboxId
    }).then(function (item) {
      console.log("Successfully Deleted Item");
      response.redirect("/");
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkboxId
        }
      }
    }).exec().then(function (list) {
      response.redirect("/" + listName);
    })["catch"](function (err) {// Handle the error
    });
  }
}); //Custom List

app.get("/:customListName", function (req, res) {
  var listName = _.capitalize(req.params.customListName);

  console.log(listName);
  List.findOne({
    name: listName
  }).then(function (list) {
    if (!list) {
      //Add new List if It Doesn't Exist
      var newList = new List({
        name: listName,
        items: defaultItems
      });
      newList.save();
      res.redirect("/" + listName);
      console.log("Doesn't Exist");
    } else {
      //Show Existing List
      res.render("list", {
        listTitle: list.name,
        newListItems: list.items
      });
      console.log("Exist");
    }
  });
});
app.get("/work", function (req, res) {
  res.render("list", {
    listTitle: "Work List",
    newListItems: workItems
  });
});
app.get("/about", function (req, res) {
  res.render("about");
});
app.listen(3001, function () {
  console.log("Server started on port 3000");
});