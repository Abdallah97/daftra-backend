const fs = require("fs");

// Check if nav.json exists and delete it
if (fs.existsSync("nav.json")) {
  console.log("Deleting nav.json...");
  fs.unlinkSync("nav.json");
  console.log("nav.json deleted successfully");
} else {
  console.log("nav.json does not exist, nothing to delete");
}

console.log(
  "Navigation data has been reset. The next GET /nav request will return the default data."
);
