const { api } = require("../../api");
const sendFile = async (req, res, next) => {
  const { fileContent, batchTitle } = req.body;
  const targetRefIds = fileContent.split("\n").map((item) => item.trim());
  try {
    const response = await api(req, { adminApi: true }).post(
      "/deletion-batches/",
      {
        json: {
          name: batchTitle,
          targetRefDomain: "domain",
          targetRefIds,
        },
      }
    );
    res.status(200).send({ message: "File sent successfully" });
  } catch (error) {
    console.error("error was thrown", error);
    res.status(error.statusCode).send({ message: "Error sending file" });
    next(error);
  }
};

module.exports = sendFile;