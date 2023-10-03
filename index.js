require("dotenv").config();
const nodemailer = require("nodemailer");
const express = require("express");
const fileUpload = require("express-fileupload");
const mongoose = require("mongoose");
const Schema = require("./schema");
const fs = require("fs");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(fileUpload({ createParentPath: true }));

app.listen(3000, () => console.log("listening on port 3000"));

const MONGO_URI = process.env.MONGO_URI;
const mongoConfig = { useNewUrlParser: true, useUnifiedTopology: true };

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PWD,
  },
});

mongoose
  .connect(MONGO_URI, mongoConfig)
  .then((_) => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const saveImage = (image) => {
  fs.writeFile(__dirname + `/images/${image.name}`, image.data, (err) => {
    if (err) {
      console.error("Error saving image:", err);
    } else {
      console.log("Image saved successfully to");
    }
  });
};

const sendEmail = (body) => {
  const { image1, image2, email } = body;
  const mailOptions = {
    from: process.env.email,
    to: email,
    subject: body.caption,
    html: `<html>
    <body>
        <b>Title: ${body.title}
        <br>
        <b>Name: ${body.name}
        <br>
    </body>
    </html>`,
    attachments: [
      {
        filename: image1.name,
        path: __dirname + `/images/${image1.name}`,
      },
      {
        filename: image2.name,
        path: __dirname + `/images/${image2.name}`,
      },
    ],
  };

  transporter.sendMail(mailOptions, (err, info) => console.log(err || info));
};

const saveInDB = async (body) => {
  body.image1 = body.image1.data;
  body.image2 = body.image2.data;
  return await Schema.create(body);
};

app.post("/", async (req, res) => {
  //   const { caption, name, phone, email, region } = req.body;

  //   return await Schema.deleteMany({});

  req.body.image1 = req.files.image1;
  req.body.image2 = req.files.image2;

  //   const data = await Schema.find({});
  //   console.log(data);

  saveImage(req.body.image1);
  saveImage(req.body.image2);

  sendEmail(req.body);

  await saveInDB(req.body);
  return res
    .status(200)
    .json({ status: "success", message: "Data posted successfully" });
});
