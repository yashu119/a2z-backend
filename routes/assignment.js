const express = require("express");
const router = express.Router();
const app = express();
const bodyParser = require("body-parser");
const Assignment = require("../models/Assignments.model");
const Response = require("../models/Responses.model");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 25 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 5 requests per windowMs
});

router.get("/", limiter, async (req, res) => {
  let assignment = await Assignment.find({});
  res.json(assignment);
});


const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');


const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = process.env.REFRESH_TOKEN

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const drive = google.drive({
  version: 'v3',
  auth: oauth2Client,
});

async function uploadFile(Filename, filePath) {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: `${Filename}`,
        mimeType: 'application/pdf',
      },
      media: {
        mimeType: 'application/pdf',
        body: fs.createReadStream(filePath),
      },
    });
    console.log(response.data);
  } catch (error) {
    console.log(error.message);
  }
}

const multer = require("multer");
const User = require("../models/Users.model");
const filePath2 = path.join(__dirname);
const upload = multer({ dest: filePath2 });

router.post("/submit", upload.single("file"), async (req, res) => {
  const assignmentId = req.body.assignment_id;
  const userId = req.body.user_id;
  const file = req.file;
  if (!file) {
    return res.status(400).send("Please upload a file");
  }
  const ext = '.' + file.originalname.split('.').pop();
  if (ext !== ".pdf") {
    return res.status(400).send("Please upload a PDF file");
  }

  try {
    const assignmentName = await Assignment.findOne(
      { _id: assignmentId },);

    const userName = await User.findOne(
      { _id: userId },);

    const unique_id = Math.floor(Math.random() * 900) + 100;
    const newFilename = `${userName.name}_${assignmentName.name}_${unique_id}${ext}`;
    await fs.promises.rename(file.path, `${filePath2}/${newFilename}`);
    await uploadFile(newFilename, `${filePath2}/${newFilename}`)
    await fs.promises.unlink(`${filePath2}/${newFilename}`);

    const assignment = await Assignment.findOneAndUpdate(
      { _id: assignmentId },
      { $push: { submitted: userId } },
      { new: true }
    );
    assignment.save();
    if (!assignment) {
      return res.status(404).send("Assignment not found");
    }
    res.json({ assignment: assignment, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


router.get("/:id", limiter, async (req, res) => {
  const { id } = req.params;
  let assignment = await Assignment.findById(id);
  res.json(assignment);
});


router.post("/status", limiter, async (req, res) => {
  const { user_id } = req.body;
  let assignments = await Assignment.find({ submitted: user_id });
  res.json(assignments);
});


router.post("/response", limiter, async (req, res) => {
  const { name,topic,link } = req.body;
  console.log(name);
  console.log(topic);
  console.log(link);
  try {
    const newResponse = new Response({
      name: name,
      topic: topic,
      link: link
    });
    const savedResponse = await newResponse.save();
    const assignment = await Assignment.findOneAndUpdate(
      { _id: topic },
      { $push: { submitted: name } },
      { new: true }
    );
    assignment.save();
    if (!assignment) {
      return res.status(404).send("Assignment not found");
    }else{
      res.status(200).json({ success: true, assignment: assignment }); // Handle the error gracefully
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, error: "Internal Server Error" }); // Handle the error gracefully
  }
});

module.exports = router;
