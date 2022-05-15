const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const { recoverPersonalSignature } = require("eth-sig-util");
const { bufferToHex } = require("ethereumjs-util");

const app = express();
app.use(cookieParser());
const nonceList = {};

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.get("/nonce", (req, res) => {
  const { walletAddress } = req.query;
  const nonce = String(Math.floor(Math.random() * 10000));
  // save the nonce on the server
  nonceList[walletAddress] = nonce;
  res.send({ nonce });
});

app.get("/verify", (req, res) => {
  const { walletAddress, signedNonce } = req.query;
  const nonce = nonceList[walletAddress];
  try {
    const hexNonce = bufferToHex(Buffer.from(nonce, "utf8"));
    const retrievedAddress = recoverPersonalSignature({
      data: hexNonce,
      sig: signedNonce,
    });

    if (walletAddress === retrievedAddress) {
      // logged in
      return res.cookie("walletAddress", walletAddress).send({ success: true });
    }
    throw false;
  } catch (err) {
    return res.send({ success: false });
  }
});

app.get("/check", (req, res) => {
  const { walletAddress } = req.cookies;
  if (walletAddress) {
    return res.send({ success: true, walletAddress });
  }
  return res.send({ success: false });
});

app.get("/logout", (req, res) => {
  res.clearCookie("walletAddress");
  res.send({ success: true });
});

app.listen(3000, () => {
  console.log("Application started on port 3000");
});
